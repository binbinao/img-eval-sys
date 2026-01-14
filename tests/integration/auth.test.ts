import { hashPassword } from "../../lib/auth/password";
import { userRepository } from "../../lib/repositories";
import { setupTestDatabase, teardownTestDatabase } from "../helpers/db";

// Skip integration tests if database is not configured
// Set DATABASE_TEST_ENABLED=true to enable integration tests
const hasDatabase =
    process.env.DATABASE_TEST_ENABLED === "true" &&
    process.env.DATABASE_HOST &&
    process.env.DATABASE_NAME;

(hasDatabase ? describe : describe.skip)("Authentication Integration Tests", () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe("User Registration", () => {
        it("should create a new user", async () => {
            const email = "test@example.com";
            const password = "Test123!@#";
            const passwordHash = await hashPassword(password);

            const user = await userRepository.create({
                email,
                password_hash: passwordHash,
            });

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe(email);
            expect(user.password_hash).toBe(passwordHash);
        });

        it("should not create duplicate users", async () => {
            const email = "duplicate@example.com";
            const password = "Test123!@#";
            const passwordHash = await hashPassword(password);

            await userRepository.create({
                email,
                password_hash: passwordHash,
            });

            // Try to create duplicate
            await expect(
                userRepository.create({
                    email,
                    password_hash: passwordHash,
                })
            ).rejects.toThrow();
        });
    });

    describe("User Login", () => {
        it("should find user by email", async () => {
            const email = "login@example.com";
            const password = "Test123!@#";
            const passwordHash = await hashPassword(password);

            await userRepository.create({
                email,
                password_hash: passwordHash,
            });

            const user = await userRepository.findByEmail(email);

            expect(user).toBeDefined();
            expect(user?.email).toBe(email);
        });

        it("should return null for non-existent user", async () => {
            const user = await userRepository.findByEmail("nonexistent@example.com");

            expect(user).toBeNull();
        });
    });
});
