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
        // Pattern 1: Look for explicit score mentions like "构图: 2分" or "**构图**: 2分 - xxx"
        // Support various bullet points (•, *, -, ·) and markdown bold formatting
        // The key pattern is: [bullet]? [**]?[keyword][**]?: [number]分
        const explicitPatterns = [
            { key: "composition", patterns: [
                /\*{0,2}构图\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            { key: "technicalQuality", patterns: [
                /\*{0,2}技术质量\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            { key: "artisticMerit", patterns: [
                /\*{0,2}艺术价值\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            { key: "lighting", patterns: [
                /\*{0,2}光线\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            { key: "subjectMatter", patterns: [
                /\*{0,2}主体\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            { key: "postProcessing", patterns: [
                /\*{0,2}后期处理\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
                /\*{0,2}后期\*{0,2}[：:]\s*(\d+(?:\.\d+)?)\s*分/,
            ] },
            // Note: overall is always calculated from individual scores, not extracted from text
        ];
        
        // Log the analysis text for debugging
        logger.info("Analyzing text for scores extraction", { analysisLength: analysis.length, analysisSample: analysis.substring(0, 500) });

        for (const { key, patterns } of explicitPatterns) {
            for (const pattern of patterns) {
                const match = analysis.match(pattern);
                logger.debug("Pattern matching attempt", { key, pattern: pattern.toString(), matched: !!match, matchValue: match ? match[1] : null });
                if (match && match[1]) {
                    const score = parseFloat(match[1]);
                    if (score >= 1 && score <= 10) {
                        scores[key as keyof ScoreExtractionResult] = Math.round(score * 10) / 10;
                        logger.info("Score extracted", { key, score: scores[key as keyof ScoreExtractionResult] });
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
