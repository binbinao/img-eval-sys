// Learn more: https://github.com/testing-library/jest-dom
require("@testing-library/jest-dom");

// Mock environment variables
process.env.DATABASE_HOST = process.env.DATABASE_HOST || "localhost";
process.env.DATABASE_PORT = process.env.DATABASE_PORT || "3306";
process.env.DATABASE_USER = process.env.DATABASE_USER || "test";
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || "test";
process.env.DATABASE_NAME = process.env.DATABASE_NAME || "test_db";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-secret-key";
process.env.CLEANUP_ENABLED = "false"; // Disable cleanup in tests
