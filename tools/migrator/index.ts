import { Argument, program } from "commander";

import type { MigrationResultSet } from "kysely";
import { createKysely } from "../../src/lib/db";
import { createMigrator } from "../../src/lib/db/migrator";

program
	.name("migrator")
	.description("CLI to migrate database")
	.addArgument(
		new Argument("<action>", "Up, down or latest")
			.choices(["up", "down", "down-all", "latest"])
			.default("latest")
			.argOptional(),
	)
	.action(async (name: "down-all" | "down" | "latest" | "up", option) => {
		const migrator = createMigrator(createKysely());
		let res: MigrationResultSet;

		let handlesItself = false;
		switch (name) {
			case "up": {
				res = await migrator.migrateUp();
				break;
			}
			case "down": {
				res = await migrator.migrateDown();
				break;
			}
			case "down-all": {
				handlesItself = true;

				do {
					res = await migrator.migrateDown();
					if (res.results && !res.error) {
						for (const r of res.results) {
							console.log(`${r.direction} ${r.migrationName}: ${r.status}`);
						}
					} else {
						break;
					}
				} while (
					res.results.length > 0 &&
					!res.results[0].migrationName.startsWith("0001")
				);

				if (res.error) {
					console.log(
						`Failed to down all in migration "${res.results?.[0].migrationName}": ${res.error}`,
					);
				}
				break;
			}
			case "latest": {
				res = await migrator.migrateToLatest();
				break;
			}
		}
		if (!handlesItself) {
			if (res.results) {
				const errorFmt = res.error ? `: '${res.error}'` : "";
				console.log(
					`Migrating...\n${res.results
						.map(
							(r, i) =>
								`${i + 1}. ${r.direction} ${r.migrationName}: ${
									r.status
								}${errorFmt}`,
						)
						.join("\n")}`,
				);
			} else {
				console.warn(res);
			}
		}

		if (res.error) {
			console.warn("Error while running migrations:");
			console.warn(JSON.stringify(res.error));
			process.exit(1);
		}

		process.exit();
	});

program.parse();
