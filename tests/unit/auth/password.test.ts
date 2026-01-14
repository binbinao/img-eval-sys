import { hashPassword, verifyPassword, validatePassword } from "../../../lib/auth/password";

describe("Password utilities", () => {
    describe("hashPassword", () => {
        it("should hash a password", async () => {
            const password = "Test123!@#";
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it("should produce different hashes for the same password", async () => {
            const password = "Test123!@#";
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            // bcrypt salts are different, so hashes should be different
            expect(hash1).not.toBe(hash2);
        });
    });

    describe("verifyPassword", () => {
        it("should verify a correct password", async () => {
            const password = "Test123!@#";
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(password, hash);

            expect(isValid).toBe(true);
        });

        it("should reject an incorrect password", async () => {
            const password = "Test123!@#";
            const wrongPassword = "Wrong123!@#";
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(wrongPassword, hash);

            expect(isValid).toBe(false);
        });
    });

    describe("validatePassword", () => {
        it("should accept a valid password", () => {
            const password = "Test123!@#";
            const result = validatePassword(password);

            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it("should reject a password that is too short", () => {
            const password = "Test1!";
            const result = validatePassword(password);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject a password without uppercase", () => {
            const password = "test123!@#";
            const result = validatePassword(password);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject a password without lowercase", () => {
            const password = "TEST123!@#";
            const result = validatePassword(password);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject a password without numbers", () => {
            const password = "TestABC!@#";
            const result = validatePassword(password);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject a password without special characters", () => {
            const password = "Test123ABC";
            const result = validatePassword(password);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
