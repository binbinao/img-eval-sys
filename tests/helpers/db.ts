import { query } from "../../lib/db/connection";

/**
 * Test database helpers
 */

export async function setupTestDatabase(): Promise<void> {
    // Create test tables if they don't exist
    // This should match your migration files
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS api_keys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            key_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS evaluations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            image_path VARCHAR(500),
            image_storage_type ENUM('local', 'cos'),
            overall_score DECIMAL(3,1) DEFAULT 0,
            composition_score DECIMAL(3,1) DEFAULT 0,
            technical_quality_score DECIMAL(3,1) DEFAULT 0,
            artistic_merit_score DECIMAL(3,1) DEFAULT 0,
            lighting_score DECIMAL(3,1) DEFAULT 0,
            subject_matter_score DECIMAL(3,1) DEFAULT 0,
            post_processing_score DECIMAL(3,1) DEFAULT 0,
            text_summary TEXT,
            evaluation_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
}

export async function teardownTestDatabase(): Promise<void> {
    // Clean up test data
    await query("DELETE FROM evaluations");
    await query("DELETE FROM api_keys");
    await query("DELETE FROM users");
}

export async function clearTestData(): Promise<void> {
    await teardownTestDatabase();
}
