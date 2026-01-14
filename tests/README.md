# Testing Guide

This directory contains all tests for the Image Evaluation System.

## Test Structure

```
tests/
├── helpers/          # Test utilities and helpers
│   ├── db.ts        # Database setup/teardown
│   └── mocks.ts     # Mock data and fixtures
├── unit/            # Unit tests
│   ├── auth/        # Authentication tests
│   ├── image/       # Image validation tests
│   └── evaluation/  # Evaluation logic tests
├── integration/     # Integration tests
│   ├── auth.test.ts
│   └── api_key.test.ts
└── performance/     # Performance tests
    ├── queue.test.ts
    └── cleanup.test.ts
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage
```bash
pnpm test:coverage
```

### Run specific test file
```bash
pnpm test tests/unit/auth/password.test.ts
```

### Run tests matching a pattern
```bash
pnpm test --testNamePattern="password"
```

## Test Environment

Tests use a separate test database. Configure the following environment variables:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=test
DATABASE_PASSWORD=test
DATABASE_NAME=test_db
SESSION_SECRET=test-secret-key
CLEANUP_ENABLED=false
```

## Test Coverage

The project aims for 70% code coverage across:
- Branches
- Functions
- Lines
- Statements

## Writing Tests

### Unit Tests
Test individual functions and utilities in isolation.

Example:
```typescript
describe("Function name", () => {
    it("should do something", () => {
        const result = functionToTest();
        expect(result).toBe(expected);
    });
});
```

### Integration Tests
Test interactions between multiple components.

Example:
```typescript
describe("Feature Integration", () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    it("should work end-to-end", async () => {
        // Test full flow
    });
});
```

### Performance Tests
Test system performance and concurrency.

Example:
```typescript
describe("Performance", () => {
    it("should handle load", async () => {
        const startTime = Date.now();
        await performOperation();
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(threshold);
    });
});
```
