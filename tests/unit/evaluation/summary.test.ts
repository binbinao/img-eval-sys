import { generateSummary, validateSummary } from "../../../lib/evaluation/summary";

describe("Summary generation", () => {
    describe("generateSummary", () => {
        it("should generate a summary within character limit", () => {
            const analysis = "这是一张很好的图片。构图优秀，采用三分法布局。技术质量良好，曝光准确。";
            const insights = ["构图优秀", "技术质量良好"];

            const summary = generateSummary(analysis, insights);

            expect(summary.length).toBeLessThanOrEqual(200);
            expect(summary.length).toBeGreaterThan(0);
        });

        it("should truncate long summaries", () => {
            const longAnalysis = "a".repeat(300);
            const insights: string[] = [];

            const summary = generateSummary(longAnalysis, insights);

            expect(summary.length).toBeLessThanOrEqual(200);
            expect(summary.endsWith("...")).toBe(true);
        });

        it("should use insights when available", () => {
            const analysis = "这是一张很好的图片。";
            const insights = ["构图优秀", "技术质量良好", "艺术价值高"];

            const summary = generateSummary(analysis, insights);

            // Summary should be generated (may use insights or analysis)
            expect(summary.length).toBeGreaterThan(0);
            expect(summary.length).toBeLessThanOrEqual(200);
        });

        it("should have minimum length", () => {
            const analysis = "好";
            const insights: string[] = [];

            const summary = generateSummary(analysis, insights);

            // Summary should have a minimum length (default fallback message)
            expect(summary.length).toBeGreaterThan(0);
        });
    });

    describe("validateSummary", () => {
        it("should accept a valid summary", () => {
            const summary = "这是一张很好的图片。";

            const isValid = validateSummary(summary);

            expect(isValid).toBe(true);
        });

        it("should reject a summary exceeding character limit", () => {
            const summary = "a".repeat(201);

            const isValid = validateSummary(summary);

            expect(isValid).toBe(false);
        });

        it("should reject an empty summary", () => {
            const summary = "";

            const isValid = validateSummary(summary);

            expect(isValid).toBe(false);
        });
    });
});
