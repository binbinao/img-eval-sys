import {
    generateApiKey,
    hashApiKey,
    verifyApiKey,
    validateApiKeyFormat,
    extractApiKeyFromHeader,
} from "../../../lib/auth/api_key";

describe("API Key utilities", () => {
    describe("generateApiKey", () => {
        it("should generate an API key with correct prefix", () => {
            const key = generateApiKey();

            expect(key).toBeDefined();
            expect(key.startsWith("ie_")).toBe(true);
            expect(key.length).toBeGreaterThan(10);
        });

        it("should generate unique API keys", () => {
            const key1 = generateApiKey();
            const key2 = generateApiKey();

            expect(key1).not.toBe(key2);
        });
    });

    describe("hashApiKey", () => {
        it("should hash an API key", async () => {
            const key = generateApiKey();
            const hash = await hashApiKey(key);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(key);
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe("verifyApiKey", () => {
        it("should verify a correct API key", async () => {
            const key = generateApiKey();
            const hash = await hashApiKey(key);
            const isValid = await verifyApiKey(key, hash);

            expect(isValid).toBe(true);
        });

        it("should reject an incorrect API key", async () => {
            const key = generateApiKey();
            const wrongKey = generateApiKey();
            const hash = await hashApiKey(key);
            const isValid = await verifyApiKey(wrongKey, hash);

            expect(isValid).toBe(false);
        });
    });

    describe("validateApiKeyFormat", () => {
        it("should accept a valid API key format", () => {
            // Generate a valid API key (ie_ + 64 hex characters)
            const key = generateApiKey();
            const isValid = validateApiKeyFormat(key);

            expect(isValid).toBe(true);
        });

        it("should reject an API key without prefix", () => {
            const key = "test1234567890";
            const isValid = validateApiKeyFormat(key);

            expect(isValid).toBe(false);
        });

        it("should reject an API key with wrong prefix", () => {
            const key = "api_test1234567890";
            const isValid = validateApiKeyFormat(key);

            expect(isValid).toBe(false);
        });
    });

    describe("extractApiKeyFromHeader", () => {
        it("should extract API key from Bearer header", () => {
            // Use a properly formatted API key
            const apiKey = generateApiKey();
            const header = `Bearer ${apiKey}`;
            const key = extractApiKeyFromHeader(header);

            expect(key).toBe(apiKey);
        });

        it("should extract API key from ApiKey header", () => {
            // Use a properly formatted API key
            const apiKey = generateApiKey();
            const header = `ApiKey ${apiKey}`;
            const key = extractApiKeyFromHeader(header);

            expect(key).toBe(apiKey);
        });

        it("should return null for invalid header", () => {
            const header = "Invalid header";
            const key = extractApiKeyFromHeader(header);

            expect(key).toBeNull();
        });

        it("should return null for null header", () => {
            const key = extractApiKeyFromHeader(null);

            expect(key).toBeNull();
        });
    });
});
