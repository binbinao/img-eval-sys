#!/usr/bin/env tsx

import { runMigrations } from "../lib/db/migrations";
import { closePool } from "../lib/db/connection";

async function main() {
    try {
        await runMigrations();
        console.log("Migrations completed successfully");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

main();
