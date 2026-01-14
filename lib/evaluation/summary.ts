import logger from "../logger";

/**
 * Generate text summary from AI analysis
 * Returns the full AI analysis without truncation
 */
export function generateSummary(
    analysis: string,
    insights: string[]
): string {
    try {
        // Directly return the full AI analysis content
        // The analysis already contains the formatted evaluation with sections:
        // - 辣评
        // - 专业详评 (构图、技术质量、光线、艺术价值、主体表现、后期处理)
        // - 改进建议
        // - 评分
        
        if (!analysis || analysis.trim().length === 0) {
            logger.warn("Empty analysis received");
            return "图片评价：专业摄影师视角分析完成。";
        }

        logger.info("Generated summary", { length: analysis.length });
        return analysis.trim();
    } catch (error) {
        logger.error("Error generating summary:", error);
        return "图片评价：专业摄影师视角分析完成。";
    }
}

/**
 * Validate summary - now allows any length since we use TEXT field
 */
export function validateSummary(summary: string): boolean {
    return summary.length > 0;
}
