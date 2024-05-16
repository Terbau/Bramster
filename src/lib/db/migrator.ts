import { promises as fs } from "node:fs"
import * as path from "node:path"
import { FileMigrationProvider, type Kysely, Migrator } from "kysely"
import type { Database } from "./types"

const BASE_DIR = __dirname

export const createMigrator = (db: Kysely<Database>) =>
  new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(BASE_DIR, "migrations"),
    }),
  })
