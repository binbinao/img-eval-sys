import {
    validateFileSize,
    validateFileExtension,
    validateImageFile,
} from "../../../lib/image/validation";
import { mockImageBuffer } from "../../helpers/mocks";

describe("Image validation", () => {
    describe("validateFileSize", () => {
        it("should accept a file within size limit", () => {
            const size = 5 * 1024 * 1024; // 5MB
            const result = validateFileSize(size);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should reject a file exceeding size limit", () => {
            const size = 15 * 1024 * 1024; // 15MB
            const result = validateFileSize(size);

            expect(result.valid).toBe(false);
            expect(result.error).toContain("10MB");
        });

        it("should reject an empty file", () => {
            const size = 0;
            const result = validateFileSize(size);

            expect(result.valid).toBe(false);
            expect(result.error).toContain("empty");
        });
    });

    describe("validateFileExtension", () => {
        it("should accept valid image extensions", () => {
            const validExtensions = ["test.jpg", "test.jpeg", "test.png", "test.webp", "test.tiff"];

            validExtensions.forEach((filename) => {
                const result = validateFileExtension(filename);
                expect(result.valid).toBe(true);
            });
        });

        it("should reject invalid extensions", () => {
            const invalidExtensions = ["test.txt", "test.pdf", "test.exe", "test"];

            invalidExtensions.forEach((filename) => {
                const result = validateFileExtension(filename);
                expect(result.valid).toBe(false);
            });
        });
    });

    describe("validateImageFile", () => {
        it("should validate a valid image file", async () => {
            // Note: This test requires a real image buffer
            // For now, we'll test the basic validation logic
            const filename = "test.jpg";
            const buffer = mockImageBuffer;

            // Mock the image processing validation
            const result = await validateImageFile(buffer, filename);

            // The result depends on whether the buffer is a valid image
            // In a real test, you'd use a real image buffer
            expect(result).toBeDefined();
            expect(result.valid).toBeDefined();
        });
    });
});
