import mysql from "mysql2/promise";
import { getDatabaseConfig } from "./config";

let pool: mysql.Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): mysql.Pool {
    if (!pool) {
        const config = getDatabaseConfig();
        pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            waitForConnections: true,
            connectionLimit: config.connectionLimit || 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            multipleStatements: true, // Enable multiple SQL statements in migrations
        });
    }
    return pool;
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

/**
 * Execute a query
 */
export async function query<T = unknown>(
    sql: string,
    params?: unknown[]
): Promise<T[]> {
    const connection = getPool();
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
}
