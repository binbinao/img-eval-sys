# Image Evaluation System

Professional photographer's perspective image evaluation system using AI vision models.

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: MySQL 8.0
- **Image Processing**: Sharp
- **AI/ML**: Tencent Cloud Hunyuan Vision API
- **Logging**: Winston
- **Monitoring**: Sentry
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker and Docker Compose

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp env.template .env
   # Edit .env with your configuration
   ```

4. Start Docker services:
   ```bash
   docker-compose up -d db
   ```

5. Run database migrations:
   ```bash
   pnpm migrate
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── app/                    # Next.js app directory
├── api/                    # API routes
├── lib/                    # Library code
│   ├── db/                # Database configuration and connection
│   ├── repositories/      # Data access layer
│   ├── logger/            # Logging utilities
│   └── sentry/            # Sentry configuration
├── migrations/            # Database migration scripts
├── scripts/               # Utility scripts
├── types/                 # TypeScript type definitions
└── openspec/              # OpenSpec specifications
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm migrate` - Run database migrations
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests (requires test database)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm setup:test-db` - Set up test database

## Database Schema

- **users**: User accounts with email and password
- **api_keys**: API keys for programmatic access (one per user)
- **evaluations**: Image evaluation records with scores and feedback

## Testing

### Unit Tests

Unit tests can be run without a database:

```bash
pnpm test:unit
```

### Integration Tests

Integration tests require a test database. To set up:

1. **Option 1: Use setup script**
   ```bash
   pnpm setup:test-db
   ```

2. **Option 2: Manual setup**
   - Create test database in MySQL
   - Set environment variables (see `tests/.env.test` for template)
   - Run: `DATABASE_TEST_ENABLED=true pnpm test:integration`

See `tests/setup-db.md` for detailed instructions.

### Test Coverage

Generate coverage report:

```bash
pnpm test:coverage
```

## Development

This project follows OpenSpec for specification-driven development. See `openspec/` directory for detailed specifications.

## License

Private project
