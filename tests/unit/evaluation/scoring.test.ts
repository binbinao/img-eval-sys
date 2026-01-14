import { extractScores, normalizeScores, validateScores } from "../../../lib/evaluation/scoring";

describe("Score extraction", () => {
    describe("extractScores", () => {
        it("should extract scores from analysis text with explicit scores", () => {
            const analysis = `
                构图：8.5分，采用三分法布局。
                技术质量：7.5分，曝光准确。
                艺术价值：9分，创意独特。
                光线：8分，自然光线柔和。
                主体：9分，主体清晰。
                后期处理：7分，基本处理到位。
                总体评分：8.2分
            `;

            const scores = extractScores(analysis);

            expect(scores.overall).toBeGreaterThan(0);
            expect(scores.composition).toBeGreaterThan(0);
            expect(scores.technicalQuality).toBeGreaterThan(0);
            expect(scores.artisticMerit).toBeGreaterThan(0);
            expect(scores.lighting).toBeGreaterThan(0);
            expect(scores.subjectMatter).toBeGreaterThan(0);
            expect(scores.postProcessing).toBeGreaterThan(0);
        });

        it("should return default scores when no explicit scores found", () => {
            const analysis = "这是一张很好的图片。";

            const scores = extractScores(analysis);

            // Should return default scores (7 for each) or adjusted by sentiment
            expect(scores.overall).toBeGreaterThanOrEqual(1);
            expect(scores.overall).toBeLessThanOrEqual(10);
            expect(scores.composition).toBeGreaterThanOrEqual(1);
            expect(scores.composition).toBeLessThanOrEqual(10);
        });
    });

    describe("normalizeScores", () => {
        it("should normalize scores to valid range", () => {
            const scores = {
                overall: 15, // Out of range
                composition: -5, // Out of range
                technicalQuality: 8.5,
                artisticMerit: 9,
                lighting: 7,
                subjectMatter: 6.5,
                postProcessing: 5,
            };

            const normalized = normalizeScores(scores);

            expect(normalized.overall).toBeLessThanOrEqual(10);
            expect(normalized.overall).toBeGreaterThanOrEqual(1);
            expect(normalized.composition).toBeLessThanOrEqual(10);
            expect(normalized.composition).toBeGreaterThanOrEqual(1);
        });
    });

    describe("validateScores", () => {
        it("should validate scores in valid range", () => {
            const scores = {
                overall: 8,
                composition: 7.5,
                technicalQuality: 9,
                artisticMerit: 8,
                lighting: 7,
                subjectMatter: 8.5,
                postProcessing: 7,
            };

            const isValid = validateScores(scores);

            expect(isValid).toBe(true);
        });

        it("should reject scores out of range", () => {
            const scores = {
                overall: 15, // Invalid
                composition: 7.5,
                technicalQuality: 9,
                artisticMerit: 8,
                lighting: 7,
                subjectMatter: 8.5,
                postProcessing: 7,
            };

            const isValid = validateScores(scores);

            expect(isValid).toBe(false);
        });
    });
});
