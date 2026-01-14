/**
 * Database configuration
 */
export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
}

export function getDatabaseConfig(): DatabaseConfig {
    return {
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT || "3306", 10),
        user: process.env.DATABASE_USER || "root",
        password: process.env.DATABASE_PASSWORD || "password",
        database: process.env.DATABASE_NAME || "image_evaluation",
        connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || "10", 10),
    };
}
