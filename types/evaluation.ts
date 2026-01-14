/**
 * Evaluation report type definitions
 */

export interface EvaluationReport {
    id: number;
    userId: number;
    imageUrl: string;
    imagePath: string;
    storageType: "local" | "cos";
    scores: EvaluationScores;
    summary: string;
    status: "pending" | "processing" | "completed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

export interface EvaluationScores {
    overall: number; // 1-10
    composition: number; // 1-10
    technicalQuality: number; // 1-10
    artisticMerit: number; // 1-10
    lighting: number; // 1-10
    subjectMatter: number; // 1-10
    postProcessing: number; // 1-10
}

export interface EvaluationReportResponse {
    id: number;
    imageUrl: string;
    scores: EvaluationScores;
    summary: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
