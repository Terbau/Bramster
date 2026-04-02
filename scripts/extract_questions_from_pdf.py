"""
This script exists for the sole purpose of extracting questions from a PDF. The PDF can be
downloaded from Inspera Assessment.

Prerequisites:
python3 -m pip install python-dotenv pydantic openai pymupdf

Usage:
python extract_questions_from_pdf.py --pdf 10044.pdf --output output.json [--dpi 200] [--concurrency 4] [--verbose]

Environment variables (can be placed in a .env file next to this script):
    AZURE_OPENAI_ENDPOINT
    AZURE_OPENAI_API_KEY
    AZURE_OPENAI_API_VERSION
    AZURE_OPENAI_DEPLOYMENT   # GPT-4o deployment name
"""

import argparse
import base64
import difflib
import json
import os
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Literal

import fitz  # pymupdf
from dotenv import load_dotenv
from openai import AzureOpenAI
from pydantic import BaseModel, ValidationError

load_dotenv()

MAX_RETRIES = 3


# ── Pydantic Models ──────────────────────────────────────────────────────────


class ExtractedOption(BaseModel):
    content: str
    selected: bool  # visually selected by the student in the PDF


class ExtractionResult(BaseModel):
    question_type: Literal["MULTIPLE_CHOICE", "SKIP"]
    question_number: int | None = None
    question_text: str | None = None
    options: list[ExtractedOption] = []
    pdf_shows_correct: bool | None = None  # True if "Riktig/Feil" text is present
    pdf_correct_option: str | None = (
        None  # Option text Inspera marked correct (if visible)
    )
    skip_reason: str | None = None


class PageExtractionResult(BaseModel):
    questions: list[ExtractionResult]


class VerificationResult(BaseModel):
    correct_option: str  # Verbatim text of the correct option
    confidence: Literal["high", "medium", "low"]
    reasoning: str  # 1-3 sentence explanation


class OutputOption(BaseModel):
    content: str
    correct: bool


class OutputQuestion(BaseModel):
    content: str
    type: str = "MULTIPLE_CHOICE"
    origin: str
    options: list[OutputOption]
    verified: bool


class OutputFile(BaseModel):
    origin: str
    questions: list[OutputQuestion]


# ── System Prompts ───────────────────────────────────────────────────────────

EXTRACTION_SYSTEM_PROMPT = """You are an expert at analyzing Norwegian university exam answer sheets from the Inspera Assessment platform.

Your task is to examine a single exam page image and extract structured data.

## Question Types to EXTRACT (return question_type = "MULTIPLE_CHOICE"):
- Standard single-answer multiple choice questions marked "Velg ett alternativ"
- Multi-answer multiple choice questions marked "Velg ett eller flere alternativ" or "Velg X alternativer"

## Question Types to SKIP (return question_type = "SKIP"):
- Paring / matrix questions (matching pairs in a grid layout)
- Drag-and-drop image questions (place labels on images)
- Fill-in-text questions ("Fyll inn tekst", "Fyll riktig ord")
- Sentence select / dropdown questions ("Nedtrekk")
- Pages with no question at all (cover pages, table of contents, headers, blank pages)

## Critical Visual Instructions for Radio Buttons:
Radio buttons / answer circles come in two visual states:
- EMPTY circle (○): NOT selected by the student
- FILLED / SOLID circle (●): SELECTED by the student

When the student answered WRONG, Inspera shows TWO distinct markers on the page:
- One marker for the student's incorrect selection (often shown in red or with an X)
- One marker for the actual correct answer (often shown in green or with a checkmark)
Examine colors and additional visual indicators carefully to distinguish these.

When the student answered CORRECTLY, only one filled marker appears (green/checkmark).

## Output Format (strict JSON — no markdown, no code fences):
A page may contain one OR MORE questions. Always return all questions found on the page.

{
  "questions": [
    {
      "question_type": "MULTIPLE_CHOICE" or "SKIP",
      "question_number": <integer or null>,
      "question_text": "<full question stem not including the numbered title, e.g. 'Hva er en av de primære funksjonene til cellemembranen?'>",
      "options": [
        {"content": "<option text>", "selected": <true or false>}
      ],
      "pdf_shows_correct": <true if Riktig/Feil text is present for this question, else false>,
      "pdf_correct_option": "<verbatim text of the correct option if determinable, else null>",
      "skip_reason": "<reason if SKIP, else null>"
    }
  ]
}

Rules:
- Return one entry in "questions" for every question found on the page, in top-to-bottom order
- If the page has no questions at all, return {"questions": [{"question_type": "SKIP", "skip_reason": "No question on page"}]}
- options must preserve the original top-to-bottom order
- question_text must not include the question number or subtitle
- Do NOT include "Velg ett alternativ" or "Velg ett eller flere alternativ" in the options list
- Do NOT include scoring text ("Riktig. 2 av 2 poeng.") in the options list
- Do NOT hallucinate options; only extract what is visibly listed as answer choices
- If a question is not a multiple-choice type, set question_type="SKIP" with an appropriate skip_reason
"""

# ── Verification Prompts ─────────────────────────────────────────────────────

VERIFICATION_PROMPTS: dict[str, str] = {
    "MFEL1010": (
        "You are a medical and physiology knowledge expert assisting with Norwegian university exam "
        "question verification. The questions are from NTNU courses such as MFEL1010 "
        "(Introduksjon til medisin for ikke-medisinere).\n\n"
        "This is a strictly academic and clinical context. Questions may cover pharmacology, drug "
        "administration routes, dosages, anatomy, physiology, and medical procedures — all as part "
        "of formal healthcare education at a Norwegian university. All content is intended for "
        "educational purposes only.\n\n"
        "You will be given a multiple choice question written in Norwegian, along with its answer options.\n"
        "Your task is to identify which single option is the medically and scientifically correct answer.\n\n"
        "IMPORTANT:\n"
        "- Do NOT consider how a student may have answered.\n"
        "- Base your answer solely on established medical and scientific knowledge.\n"
        "- Return the correct_option field as the EXACT verbatim text of one of the provided options "
        "— do not paraphrase or truncate.\n"
        "- If multiple options seem defensible, pick the most precise and complete one.\n"
        "- Use confidence=\"low\" if genuinely uncertain, but always provide your best assessment.\n\n"
        "## Output Format (strict JSON — no markdown, no code fences):\n"
        "{\n"
        '  "correct_option": "<verbatim text of the correct option, copied exactly from the input>",\n'
        '  "confidence": "high" or "medium" or "low",\n'
        '  "reasoning": "<1-3 sentence explanation of why this option is correct>"\n'
        "}"
    ),
}

# ── PDF Rendering ────────────────────────────────────────────────────────────


def render_pdf_pages(pdf_path: str, dpi: int = 200) -> list[bytes]:
    """Render every page of a PDF as PNG bytes at the given DPI."""
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"ERROR: Could not open PDF '{pdf_path}': {e}", file=sys.stderr)
        sys.exit(1)

    pages: list[bytes] = []
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    for page in doc:
        pixmap = page.get_pixmap(matrix=mat)
        pages.append(pixmap.tobytes("png"))
    doc.close()
    return pages


# ── Azure OpenAI Client ──────────────────────────────────────────────────────


def build_client() -> AzureOpenAI:
    """Build AzureOpenAI client from environment variables."""
    required = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_DEPLOYMENT",
    ]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            "Set them in a .env file or export them before running."
        )
    return AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    )


# ── Retry Helper ─────────────────────────────────────────────────────────────


def _backoff(attempt: int) -> None:
    """Exponential backoff with jitter."""
    delay = 2**attempt + random.uniform(0, 1)
    time.sleep(delay)


# ── Vision Extraction ────────────────────────────────────────────────────────


def extract_page(
    client: AzureOpenAI,
    deployment: str,
    page_image_bytes: bytes,
    page_number: int,
    verbose: bool = False,
) -> list[ExtractionResult]:
    """Send a single page image to GPT-4o and extract all questions on the page."""
    image_b64 = base64.b64encode(page_image_bytes).decode("utf-8")

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=deployment,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Analyze page {page_number} of the exam. Extract all questions found on this page following the system instructions.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}",
                                    "detail": "high",
                                },
                            },
                        ],
                    },
                ],
                max_completion_tokens=2000,
            )
            raw = response.choices[0].message.content or ""
            if verbose:
                print(f"  [page {page_number}] raw: {raw[:200]}", file=sys.stderr)
            page_result = PageExtractionResult.model_validate_json(raw)
            return page_result.questions
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            print(
                f"WARNING: Page {page_number} validation error (attempt {attempt + 1}/{MAX_RETRIES}): {e}",
                file=sys.stderr,
            )
            if attempt < MAX_RETRIES - 1:
                _backoff(attempt)
        except Exception as e:
            print(
                f"WARNING: Page {page_number} API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}",
                file=sys.stderr,
            )
            if attempt < MAX_RETRIES - 1:
                _backoff(attempt)

    print(
        f"ERROR: Page {page_number} failed after {MAX_RETRIES} attempts — skipping.",
        file=sys.stderr,
    )
    return []


def extract_all_pages(
    client: AzureOpenAI,
    deployment: str,
    page_images: list[bytes],
    *,
    concurrency: int = 4,
    verbose: bool = False,
) -> list[ExtractionResult]:
    """Extract all pages in parallel and return a flat list of all questions found."""
    total = len(page_images)
    per_page: list[list[ExtractionResult]] = [[] for _ in range(total)]
    completed_count = 0

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        future_to_idx = {
            executor.submit(extract_page, client, deployment, img, i + 1, verbose): i
            for i, img in enumerate(page_images)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            per_page[idx] = future.result()
            completed_count += 1
            n = len(per_page[idx])
            print(
                f"  Extracted page {idx + 1}/{total}: {n} question(s) ({completed_count}/{total} done)",
                file=sys.stderr,
            )

    # Flatten in page order
    return [q for page_questions in per_page for q in page_questions]


# ── Verification ─────────────────────────────────────────────────────────────


def verify_question(
    client: AzureOpenAI,
    deployment: str,
    question_text: str,
    options: list[str],
    system_prompt: str,
) -> VerificationResult | None:
    """Independently verify the correct answer using the provided system prompt."""
    options_block = "\n".join(f"- {opt}" for opt in options)
    user_message = (
        f"Question:\n{question_text}\n\n"
        f"Answer options:\n{options_block}\n\n"
        "Which option is correct? Return JSON as specified."
    )

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=deployment,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_completion_tokens=500,
            )
            raw = response.choices[0].message.content or ""
            result = VerificationResult.model_validate_json(raw)
            return result
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            print(
                f"WARNING: Verification validation error (attempt {attempt + 1}/{MAX_RETRIES}): {e}",
                file=sys.stderr,
            )
            if attempt < MAX_RETRIES - 1:
                _backoff(attempt)
        except Exception as e:
            print(
                f"WARNING: Verification API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}",
                file=sys.stderr,
            )
            if attempt < MAX_RETRIES - 1:
                _backoff(attempt)

    print(
        f"ERROR: Verification failed for question: {question_text[:60]}...",
        file=sys.stderr,
    )
    return None


def verify_all_questions(
    client: AzureOpenAI,
    deployment: str,
    extractions: list[ExtractionResult],
    *,
    concurrency: int = 4,
    verbose: bool = False,
    system_prompt: str,
) -> list[VerificationResult | None]:
    """Verify all extracted MC questions in parallel, preserving order."""
    total = len(extractions)
    results: list[VerificationResult | None] = [None] * total
    completed_count = 0

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        future_to_idx = {
            executor.submit(
                verify_question,
                client,
                deployment,
                ext.question_text or "",
                [opt.content for opt in ext.options],
                system_prompt,
            ): i
            for i, ext in enumerate(extractions)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            result = future.result()
            results[idx] = result
            completed_count += 1
            ext = extractions[idx]
            q_label = (
                f"Q{ext.question_number}" if ext.question_number else f"#{idx + 1}"
            )
            status = f"confidence={result.confidence}" if result else "FAILED"
            if verbose and result:
                print(
                    f"  Verified {q_label}: {status} — {result.correct_option[:50]}",
                    file=sys.stderr,
                )
            else:
                print(
                    f"  Verified {q_label}: {status} ({completed_count}/{total} done)",
                    file=sys.stderr,
                )

    return results


# ── Assembly ─────────────────────────────────────────────────────────────────


def _fuzzy_match(
    target: str, candidates: list[str], cutoff: float = 0.85
) -> str | None:
    """Return the best fuzzy match from candidates, or None if no match above cutoff."""
    matches = difflib.get_close_matches(
        target.strip(), [c.strip() for c in candidates], n=1, cutoff=cutoff
    )
    if matches:
        # Return the original candidate (not the stripped version)
        for c in candidates:
            if c.strip() == matches[0]:
                return c
    return None


def assemble_output(
    origin: str,
    extractions: list[ExtractionResult],
    verifications: list[VerificationResult | None],
) -> OutputFile:
    """Merge extraction and verification results into the final output."""
    questions: list[OutputQuestion] = []

    for ext, ver in zip(extractions, verifications):
        option_texts = [opt.content for opt in ext.options]
        verified = False
        correct_option_text: str | None = None

        if ver is not None:
            # Try exact match first (case-insensitive, stripped)
            ver_stripped = ver.correct_option.strip().lower()
            exact = next(
                (c for c in option_texts if c.strip().lower() == ver_stripped), None
            )

            if exact:
                correct_option_text = exact
                verified = True
            else:
                # Fall back to fuzzy match
                fuzzy = _fuzzy_match(ver.correct_option, option_texts)
                if fuzzy:
                    correct_option_text = fuzzy
                    verified = True
                    print(
                        f"WARNING: Q{ext.question_number} — fuzzy match used: "
                        f"'{ver.correct_option[:60]}' → '{fuzzy[:60]}'",
                        file=sys.stderr,
                    )
                else:
                    print(
                        f"WARNING: Q{ext.question_number} — verification answer did not match any option. "
                        f"Verifier said: '{ver.correct_option[:80]}'. "
                        f"Options: {[o[:40] for o in option_texts]}",
                        file=sys.stderr,
                    )

        output_options = [
            OutputOption(
                content=opt.content,
                correct=(opt.content == correct_option_text),
            )
            for opt in ext.options
        ]

        questions.append(
            OutputQuestion(
                content=ext.question_text or "",
                type="MULTIPLE_CHOICE",
                origin=origin,
                options=output_options,
                verified=verified,
            )
        )

    return OutputFile(origin=origin, questions=questions)


# ── CLI Entrypoint ────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract multiple choice questions from an Inspera Assessment PDF using Azure OpenAI GPT-4o."
    )
    parser.add_argument("--pdf", required=True, help="Path to the input PDF file")
    parser.add_argument("--output", required=True, help="Path to the output JSON file")
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="DPI for rendering PDF pages (default: 200)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=4,
        help="Number of parallel API calls (default: 4)",
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Print detailed per-question output"
    )
    parser.add_argument(
        "--verify-prompt",
        metavar="KEY",
        choices=list(VERIFICATION_PROMPTS.keys()),
        help=(
            f"Verification prompt to use. Available keys: {', '.join(VERIFICATION_PROMPTS)}. "
            "If omitted, the verification step is skipped and all options will have correct=false."
        ),
    )
    args = parser.parse_args()

    # Derive origin from the PDF filename stem (e.g. "10044")
    origin = Path(args.pdf).stem

    verify_prompt: str | None = (
        VERIFICATION_PROMPTS[args.verify_prompt] if args.verify_prompt else None
    )

    print(f"=== Bramster PDF Extractor ===", file=sys.stderr)
    print(f"PDF:        {args.pdf}", file=sys.stderr)
    print(f"Origin:     {origin}", file=sys.stderr)
    print(f"Output:     {args.output}", file=sys.stderr)
    print(f"DPI:        {args.dpi}  Concurrency: {args.concurrency}", file=sys.stderr)
    print(f"Verify:     {args.verify_prompt if args.verify_prompt else 'no (--verify-prompt not set)'}", file=sys.stderr)

    # Build Azure OpenAI client
    try:
        client = build_client()
    except EnvironmentError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    deployment = os.environ["AZURE_OPENAI_DEPLOYMENT"]

    total_stages = 3 if verify_prompt else 2

    # Stage 1: Render PDF pages
    print(f"\n[1/{total_stages}] Rendering PDF pages...", file=sys.stderr)
    page_images = render_pdf_pages(args.pdf, dpi=args.dpi)
    print(f"      Rendered {len(page_images)} pages.", file=sys.stderr)

    # Stage 2: Extract questions from all pages
    print(
        f"\n[2/{total_stages}] Extracting questions (concurrency={args.concurrency})...",
        file=sys.stderr,
    )
    all_extractions = extract_all_pages(
        client,
        deployment,
        page_images,
        concurrency=args.concurrency,
        verbose=args.verbose,
    )

    mc_extractions = [e for e in all_extractions if e.question_type == "MULTIPLE_CHOICE"]
    skipped = [e for e in all_extractions if e.question_type == "SKIP"]

    print(
        f"      Found {len(mc_extractions)} MC questions, {len(skipped)} skipped.",
        file=sys.stderr,
    )

    if args.verbose:
        for e in skipped:
            print(f"      SKIP Q{e.question_number}: {e.skip_reason}", file=sys.stderr)

    if not mc_extractions:
        print("ERROR: No multiple choice questions found. Exiting.", file=sys.stderr)
        sys.exit(1)

    # Stage 3: Verify all extracted questions (only if --verify-prompt was given)
    if verify_prompt:
        print(
            f"\n[3/{total_stages}] Verifying answers (concurrency={args.concurrency})...",
            file=sys.stderr,
        )
        verifications = verify_all_questions(
            client,
            deployment,
            mc_extractions,
            concurrency=args.concurrency,
            verbose=args.verbose,
            system_prompt=verify_prompt,
        )
        verified_count = sum(1 for v in verifications if v is not None)
        print(
            f"      Verified {verified_count}/{len(mc_extractions)} questions.",
            file=sys.stderr,
        )
    else:
        verifications = [None] * len(mc_extractions)
        print(
            f"\nSkipping verification (no --verify-prompt supplied). "
            f"All options will have correct=false.",
            file=sys.stderr,
        )

    # Assemble final output
    output = assemble_output(origin, mc_extractions, verifications)

    matched_count = sum(1 for q in output.questions if q.verified)
    print(
        f"\n      {matched_count}/{len(output.questions)} questions have a matched correct answer.",
        file=sys.stderr,
    )

    # Write JSON output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output.model_dump(), f, ensure_ascii=False, indent=2)

    print(
        f"\nDone. Written {len(output.questions)} questions to {args.output}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
