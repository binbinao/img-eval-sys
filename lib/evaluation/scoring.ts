import logger from "../logger";

export interface ScoreExtractionResult {
    overall: number;
    composition: number;
    technicalQuality: number;
    artisticMerit: number;
    lighting: number;
    subjectMatter: number;
    postProcessing: number;
}

/**
 * Extract scores from AI analysis text
 * Uses pattern matching and keyword analysis to extract scores
 */
export function extractScores(analysis: string): ScoreExtractionResult {
    const scores: ScoreExtractionResult = {
        overall: 7,
        composition: 7,
        technicalQuality: 7,
        artisticMerit: 7,
        lighting: 7,
        subjectMatter: 7,
        postProcessing: 7,
    };

    try {
        // Pattern 1: Look for explicit score mentions like "构图: 8分" or "构图 8/10"
        const explicitPatterns = [
            { key: "composition", patterns: [/构图[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /构图\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            { key: "technicalQuality", patterns: [/技术质量[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /技术[质量]?[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /技术[质量]?\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            { key: "artisticMerit", patterns: [/艺术价值[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /艺术[价值]?[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /艺术[价值]?\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            { key: "lighting", patterns: [/光线[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /光线\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            { key: "subjectMatter", patterns: [/主体[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /主体\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            { key: "postProcessing", patterns: [/后期处理[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /后期[处理]?[：:]\s*(\d+(?:\.\d+)?)\s*分?/i, /后期[处理]?\s*(\d+(?:\.\d+)?)\s*[分/]?10?/i] },
            // Note: overall is always calculated from individual scores, not extracted from text
        ];

        for (const { key, patterns } of explicitPatterns) {
            for (const pattern of patterns) {
                const match = analysis.match(pattern);
                if (match && match[1]) {
                    const score = parseFloat(match[1]);
                    if (score >= 1 && score <= 10) {
                        scores[key as keyof ScoreExtractionResult] = Math.round(score * 10) / 10;
                        break;
                    }
                }
            }
        }

        // Always calculate overall score from individual scores (weighted average)
        // This ensures consistency between individual scores and overall score
        const individualScores = [
            scores.composition,
            scores.technicalQuality,
            scores.artisticMerit,
            scores.lighting,
            scores.subjectMatter,
            scores.postProcessing,
        ];
        
        // Calculate overall as the average of all individual scores
        // This ensures the overall score is always consistent with individual scores
        scores.overall = Math.round((individualScores.reduce((a, b) => a + b, 0) / individualScores.length) * 10) / 10;

        logger.info("Extracted scores from analysis", { scores });
        return scores;
    } catch (error) {
        logger.error("Error extracting scores:", error);
        return scores; // Return default scores on error
    }
}

/**
 * Validate scores are within valid range
 */
export function validateScores(scores: ScoreExtractionResult): boolean {
    const scoreValues = Object.values(scores);
    return scoreValues.every((score) => score >= 1 && score <= 10);
}

/**
 * Normalize scores to ensure they're in valid range
 */
export function normalizeScores(scores: ScoreExtractionResult): ScoreExtractionResult {
    return {
        overall: Math.max(1, Math.min(10, Math.round(scores.overall * 10) / 10)),
        composition: Math.max(1, Math.min(10, Math.round(scores.composition * 10) / 10)),
        technicalQuality: Math.max(1, Math.min(10, Math.round(scores.technicalQuality * 10) / 10)),
        artisticMerit: Math.max(1, Math.min(10, Math.round(scores.artisticMerit * 10) / 10)),
        lighting: Math.max(1, Math.min(10, Math.round(scores.lighting * 10) / 10)),
        subjectMatter: Math.max(1, Math.min(10, Math.round(scores.subjectMatter * 10) / 10)),
        postProcessing: Math.max(1, Math.min(10, Math.round(scores.postProcessing * 10) / 10)),
    };
}
