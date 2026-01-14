-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_storage_type ENUM('local', 'cos') NOT NULL DEFAULT 'local',
    overall_score DECIMAL(3, 1) NOT NULL,
    composition_score DECIMAL(3, 1) NOT NULL,
    technical_quality_score DECIMAL(3, 1) NOT NULL,
    artistic_merit_score DECIMAL(3, 1) NOT NULL,
    lighting_score DECIMAL(3, 1) NOT NULL,
    subject_matter_score DECIMAL(3, 1) NOT NULL,
    post_processing_score DECIMAL(3, 1) NOT NULL,
    text_summary TEXT NOT NULL,
    evaluation_status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (evaluation_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
