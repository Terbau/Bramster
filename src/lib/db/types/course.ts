import type { Generated } from "kysely"

export interface Course {
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  id: string
  name: string
}
