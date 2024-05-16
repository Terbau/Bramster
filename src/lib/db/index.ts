import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"

import pg from "pg"
import type { Database } from "./types"

const int8TypeId = 20

pg.types.setTypeParser(int8TypeId, (value) => Number.parseInt(value, 10))

export function createKysely() {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
    plugins: [new CamelCasePlugin()],
  })
}

export const db = createKysely()
