import { z } from "zod"

export interface Paginated<T> {
  total: number
  results: T[]
}

export const SortDirectionSchema = z.enum(["asc", "desc"])

export type SortDirection = z.infer<typeof SortDirectionSchema>
