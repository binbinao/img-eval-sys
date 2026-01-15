/**
 * Database type definitions
 */

// User role type
export type UserRole = 'admin' | 'user';

export interface User {
    id: number;
    email: string;
    role: UserRole;
    is_active: boolean;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface ApiKey {
    id: number;
    user_id: number;
    key_hash: string;
    created_at: Date;
}

export interface Evaluation {
    id: number;
    user_id: number;
    image_path: string;
    image_storage_type: "local" | "cos";
    overall_score: number;
    composition_score: number;
    technical_quality_score: number;
    artistic_merit_score: number;
    lighting_score: number;
    subject_matter_score: number;
    post_processing_score: number;
    text_summary: string;
    evaluation_status: "pending" | "processing" | "completed" | "failed";
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserInput {
    email: string;
    password_hash: string;
}

export interface CreateApiKeyInput {
    user_id: number;
    key_hash: string;
}

export interface CreateEvaluationInput {
    user_id: number;
    image_path: string;
    image_storage_type: "local" | "cos";
    overall_score: number;
    composition_score: number;
    technical_quality_score: number;
    artistic_merit_score: number;
    lighting_score: number;
    subject_matter_score: number;
    post_processing_score: number;
    text_summary: string;
    evaluation_status?: "pending" | "processing" | "completed" | "failed";
}
