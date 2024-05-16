import type { Generated } from "kysely"

export interface User {
  id: string
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  email: string
  name: string
  authProvider: string
}
