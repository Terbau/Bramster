# scripts/

## extract_questions_from_pdf.py

Extracts multiple choice questions from Inspera Assessment exam PDF answer sheets using Azure OpenAI GPT-4o vision.

### Prerequisites

```bash
python3 -m pip install python-dotenv pydantic openai pymupdf
```

### Configuration

Create a `.env` file in this directory:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Usage

```bash
python extract_questions_from_pdf.py --pdf <path-to-pdf> --output <path-to-output.json>
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--pdf` | *(required)* | Path to the input PDF |
| `--output` | *(required)* | Path to the output JSON file |
| `--verify-prompt` | *(omit to skip)* | Key from `VERIFICATION_PROMPTS` in the script (e.g. `medical`). Verification is skipped if not provided — all options will have `correct=false` |
| `--dpi` | `200` | Resolution for rendering PDF pages |
| `--concurrency` | `4` | Number of parallel Azure OpenAI API calls |
| `--verbose` | off | Print per-question extraction details |

### Examples

**Extract only (no answer verification):**
```bash
python extract_questions_from_pdf.py --pdf 10044.pdf --output out_10044.json
```

**Extract with answer verification:**
```bash
python extract_questions_from_pdf.py \
  --pdf 10044.pdf \
  --output out_10044.json \
  --verify-prompt MFEL1010
```

**With verbose output:**
```bash
python extract_questions_from_pdf.py \
  --pdf 10044.pdf \
  --output out_10044.json \
  --verify-prompt MFEL1010 \
  --verbose
```

**Higher resolution (better accuracy, slower):**
```bash
python extract_questions_from_pdf.py --pdf 10044.pdf --output out_10044.json --dpi 300
```

**Faster with more parallel calls:**
```bash
python extract_questions_from_pdf.py --pdf 10044.pdf --output out_10044.json --concurrency 8
```

### Output format

```json
{
  "origin": "10044",
  "questions": [
    {
      "content": "Hva er en av de primære funksjonene til cellemembranen?",
      "type": "MULTIPLE_CHOICE",
      "origin": "10044",
      "options": [
        { "content": "Å lagre energi i form av fett og karbohydrater.", "correct": false },
        { "content": "Å produsere proteiner fra aminosyrer.", "correct": false },
        { "content": "Å beskytte DNA mot skader fra ytre omgivelser", "correct": false },
        { "content": "Å skille det ytre fra det indre miljøet ved å regulere hva som kommer inn og ut av cellen.", "correct": true }
      ],
      "verified": true
    }
  ]
}
```

### Notes

- Non-MC question types (matrix/pairing, drag-and-drop, fill-in, dropdown) are automatically skipped and must be added manually.
- Every question goes through an independent verification step regardless of whether the PDF shows the correct answer.
- The `origin` field is derived from the PDF filename stem (e.g. `10044.pdf` → `"10044"`).
