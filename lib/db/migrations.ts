import { readFileSync } from "fs";
import { join } from "path";
import { query } from "./connection";
import logger from "../logger";

interface Migration {
    id: string;
    name: string;
    sql: string;
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
    logger.info("Starting database migrations...");

    // Create migrations table if it doesn't exist
    await query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Get executed migrations
    const executed = await query<{ id: string }>("SELECT id FROM migrations");

    const executedIds = new Set(executed.map((m) => m.id));

    // Load migration files
    const migrations: Migration[] = [
        {
            id: "001",
            name: "create_users_table",
            sql: readFileSync(
                join(process.cwd(), "migrations", "001_create_users_table.sql"),
                "utf-8"
            ),
        },
        {
            id: "002",
            name: "create_api_keys_table",
            sql: readFileSync(
                join(process.cwd(), "migrations", "002_create_api_keys_table.sql"),
                "utf-8"
            ),
        },
        {
            id: "003",
            name: "create_evaluations_table",
            sql: readFileSync(
                join(process.cwd(), "migrations", "003_create_evaluations_table.sql"),
                "utf-8"
            ),
        },
        {
            id: "004",
            name: "add_user_role",
            sql: readFileSync(
                join(process.cwd(), "migrations", "004_add_user_role.sql"),
                "utf-8"
            ),
        },
    ];

    // Execute pending migrations
    for (const migration of migrations) {
        if (executedIds.has(migration.id)) {
            logger.info(`Migration ${migration.id} already executed, skipping...`);
            continue;
        }

        try {
            logger.info(`Executing migration ${migration.id}: ${migration.name}`);
            
            // Split SQL by semicolon and execute each statement separately
            const statements = migration.sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            for (const statement of statements) {
                // Skip pure comment lines
                const cleanedStatement = statement
                    .split('\n')
                    .filter(line => !line.trim().startsWith('--'))
                    .join('\n')
                    .trim();
                
                if (cleanedStatement.length > 0) {
                    await query(cleanedStatement);
                }
            }
            
            await query(
                "INSERT INTO migrations (id, name) VALUES (?, ?)",
                [migration.id, migration.name]
            );
            logger.info(`Migration ${migration.id} completed successfully`);
        } catch (error) {
            logger.error(`Migration ${migration.id} failed:`, error);
            throw error;
        }
    }

    logger.info("All migrations completed");
}
