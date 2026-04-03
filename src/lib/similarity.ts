import { AzureOpenAI } from "openai"
import { db } from "./db"
import type { Question } from "@/types/question"

export const SIMILARITY_THRESHOLD = 0.82

// Azure text-embedding-3-small caps total tokens per request at 8192.
// At ~4 chars/token, 1500 chars ≈ 375 tokens. Batches of 16 → ~6000 tokens
// per request, comfortably under the limit.
const MAX_CHARS_PER_TEXT = 1500
const BATCH_SIZE = 16

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

function createClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  if (!endpoint || !apiKey) return null
  return new AzureOpenAI({ endpoint, apiKey, apiVersion })
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const client = createClient()
  if (!client) return null

  const model =
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-small"
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map((t) => t.slice(0, MAX_CHARS_PER_TEXT))
    const response = await client.embeddings.create({ model, input: batch })
    embeddings.push(...response.data.map((d) => d.embedding))
  }

  return embeddings
}

/**
 * Computes similarities for all questions in a course and writes them to the
 * database. Called by the offline script.
 */
export async function computeSimilaritiesForCourse(
  questions: { id: string; content: string; type: Question["type"] }[]
) {
  const embeddings = await embedTexts(questions.map((q) => q.content))
  if (!embeddings) return

  const pairs: {
    questionId: string
    similarQuestionId: string
    similarity: number
  }[] = []

  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      if (questions[i].type !== questions[j].type) continue
      const sim = cosineSimilarity(embeddings[i], embeddings[j])
      if (sim >= SIMILARITY_THRESHOLD) {
        pairs.push({
          questionId: questions[i].id,
          similarQuestionId: questions[j].id,
          similarity: sim,
        })
        pairs.push({
          questionId: questions[j].id,
          similarQuestionId: questions[i].id,
          similarity: sim,
        })
      }
    }
  }

  const questionIds = questions.map((q) => q.id)
  await db
    .deleteFrom("questionSimilarity")
    .where("questionId", "in", questionIds)
    .execute()

  if (pairs.length > 0) {
    const CHUNK = 500
    for (let i = 0; i < pairs.length; i += CHUNK) {
      await db
        .insertInto("questionSimilarity")
        .values(pairs.slice(i, i + CHUNK))
        .onConflict((oc) =>
          oc
            .columns(["questionId", "similarQuestionId"])
            .doUpdateSet((eb) => ({
              similarity: eb.ref("excluded.similarity"),
            }))
        )
        .execute()
    }
  }

  return pairs.length / 2
}

/**
 * Embeds a single newly-created question and compares it against all existing
 * questions of the same type in the same course. Writes any pairs above the
 * threshold to the database.
 *
 * Designed to run in the background after question creation — errors are
 * logged but do not affect the API response.
 */
export async function computeSimilaritiesForNewQuestion(questionId: string) {
  const newQuestion = await db
    .selectFrom("question")
    .select(["id", "courseId", "content", "type"])
    .where("id", "=", questionId)
    .executeTakeFirst()

  if (!newQuestion) return

  // Fetch all other questions of the same type in the same course
  const peers = await db
    .selectFrom("question")
    .select(["id", "content", "type"])
    .where("courseId", "=", newQuestion.courseId)
    .where("type", "=", newQuestion.type)
    .where("id", "!=", questionId)
    .execute()

  if (peers.length === 0) return

  const allTexts = [newQuestion.content, ...peers.map((p) => p.content)]
  const embeddings = await embedTexts(allTexts)
  if (!embeddings) return

  const newEmbedding = embeddings[0]
  const peerEmbeddings = embeddings.slice(1)

  const pairs: {
    questionId: string
    similarQuestionId: string
    similarity: number
  }[] = []

  for (let i = 0; i < peers.length; i++) {
    const sim = cosineSimilarity(newEmbedding, peerEmbeddings[i])
    if (sim >= SIMILARITY_THRESHOLD) {
      pairs.push({
        questionId: questionId,
        similarQuestionId: peers[i].id,
        similarity: sim,
      })
      pairs.push({
        questionId: peers[i].id,
        similarQuestionId: questionId,
        similarity: sim,
      })
    }
  }

  if (pairs.length > 0) {
    await db
      .insertInto("questionSimilarity")
      .values(pairs)
      .onConflict((oc) =>
        oc
          .columns(["questionId", "similarQuestionId"])
          .doUpdateSet((eb) => ({ similarity: eb.ref("excluded.similarity") }))
      )
      .execute()
  }
}
