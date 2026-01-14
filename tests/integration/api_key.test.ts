import { generateApiKey, hashApiKey, verifyApiKey } from "../../lib/auth/api_key";
import { userRepository, apiKeyRepository } from "../../lib/repositories";
import { hashPassword } from "../../lib/auth/password";
import { setupTestDatabase, teardownTestDatabase } from "../helpers/db";

// Skip integration tests if database is not configured
// Set DATABASE_TEST_ENABLED=true to enable integration tests
const hasDatabase =
    process.env.DATABASE_TEST_ENABLED === "true" &&
    process.env.DATABASE_HOST &&
    process.env.DATABASE_NAME;

(hasDatabase ? describe : describe.skip)("API Key Integration Tests", () => {
    let userId: number;

    beforeAll(async () => {
        await setupTestDatabase();

        // Create a test user
        const passwordHash = await hashPassword("Test123!@#");
        const user = await userRepository.create({
            email: "apikey@example.com",
            password_hash: passwordHash,
        });
        userId = user.id;
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe("API Key Generation and Storage", () => {
        it("should generate and store API key", async () => {
            const apiKey = generateApiKey();
            const keyHash = await hashApiKey(apiKey);

            const storedKey = await apiKeyRepository.create({
                user_id: userId,
                key_hash: keyHash,
            });

            expect(storedKey).toBeDefined();
            expect(storedKey.user_id).toBe(userId);
            expect(storedKey.key_hash).toBe(keyHash);
        });

        it("should verify stored API key", async () => {
            const apiKey = generateApiKey();
            const keyHash = await hashApiKey(apiKey);

            await apiKeyRepository.create({
                user_id: userId,
                key_hash: keyHash,
            });

            const isValid = await verifyApiKey(apiKey, keyHash);
            expect(isValid).toBe(true);
        });

        it("should find API key by user ID", async () => {
            const apiKey = generateApiKey();
            const keyHash = await hashApiKey(apiKey);

            await apiKeyRepository.create({
                user_id: userId,
                key_hash: keyHash,
            });

            const storedKey = await apiKeyRepository.findByUserIdForRetrieval(userId);

            expect(storedKey).toBeDefined();
            expect(storedKey?.user_id).toBe(userId);
        });
    });
});
