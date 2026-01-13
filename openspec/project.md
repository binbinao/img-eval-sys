# Project Context

## Purpose
Image evaluation system that provides professional photographer's perspective analysis of images. The system evaluates images from a photography standpoint, assessing composition, technical quality, artistic merit, and other photographic criteria using AI vision models.

**Project Type:**
- Web application with user interface for uploading and viewing evaluation results
- REST API service for programmatic access by other applications
- User account management with registration and login
- Evaluation history viewing for authenticated users

**Goals:**
- Provide professional photographer-style image evaluation
- Integrate with Tencent Cloud Hunyuan Vision model for AI-powered analysis
- Support both web UI and API access modes
- Support various image formats commonly used in photography
- Maintain clear, maintainable codebase
- Enable extensibility for future evaluation criteria

## Tech Stack
- **Language**: TypeScript / JavaScript
- **Framework**: Next.js (full-stack React framework)
- **Image Processing**: Sharp (high-performance image processing)
- **Database**: MySQL
- **Storage**: Local file system + Tencent Cloud COS (Object Storage)
- **ML/AI**: Tencent Cloud Hunyuan Vision API
- **Logging**: Winston
- **Monitoring**: Sentry (error tracking and monitoring)
- **Testing**: Jest
- **Build Tools**: pnpm
- **Runtime**: Node.js 18+
- **Deployment**: Docker containers

## Project Conventions

### Code Style
- **Naming**: Use descriptive, clear names
  - Functions/methods: `camelCase` (e.g., `evaluateImage`, `processUpload`)
  - Classes: `PascalCase` (e.g., `ImageEvaluator`, `ApiClient`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `API_BASE_URL`)
  - Files: `snake_case` (e.g., `image_evaluator.ts`, `api_client.ts`)
- **Formatting**: 
  - Indentation: 4 spaces
  - Line length: 100 characters
  - Use Prettier for automatic code formatting
  - Use ESLint for code quality checks
- **Comments**: 
  - Write self-documenting code
  - Add comments for complex logic or non-obvious decisions
  - Use JSDoc comments for public APIs and functions

### Architecture Patterns
- **Structure**: Next.js App Router (modular, component-based)
- **Design Principles**: 
  - Single Responsibility Principle
  - Separation of concerns (API routes, UI components, business logic)
  - Server Components and Client Components separation
  - API route handlers for REST endpoints
  - Dependency injection where appropriate
- **Data Layer**:
  - MySQL database for persistent storage:
    - Evaluation records (image info, evaluation results, timestamps, user association)
    - User information (user ID, email, registration time, etc.)
    - API Key information and management (auto-generated upon registration, one per user, no expiration, no permission levels)
  - Image storage strategy:
    - Development: Local file system
    - Production: Tencent Cloud COS (Object Storage)
    - Image retention: Auto-delete after 3 days from evaluation date
  - Database connection pooling for performance
- **User Features**:
  - View evaluation history (all past evaluations associated with user account)
  - Access evaluation records through web UI
- **Authentication**:
  - User registration and login functionality for web UI
  - User information stored: user ID, email, registration time
  - Session-based authentication for web users (server-side sessions)
  - API Key authentication for API endpoints
  - API Key auto-generation upon user registration (one unique API Key per user)
  - API Key management: no permission levels, no expiration, one-to-one relationship with user account
  - API Key validation middleware
- **Error Handling**: Exception-based with try-catch blocks, custom error classes for different error types
- **Configuration**: Environment variables (.env files) for API keys, endpoints, database connection, and storage configuration

### Testing Strategy
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test component interactions and API routes
- **Test Coverage**: Target 80% code coverage
- **Test Framework**: Jest with React Testing Library for components
- **Test Data**: Use fixtures/mocks for image data and API responses
- **CI/CD**: Run tests on every commit/PR
- **Test Structure**: 
  - Unit tests: `*.test.ts` or `*.test.tsx`
  - Integration tests: `*.integration.test.ts`
  - Test files co-located with source files or in `__tests__` directories

### Git Workflow
- **Branching**: GitHub Flow (main branch + feature branches)
  - Main branch: production-ready code
  - Feature branches: `feature/description` or `feat/description`
  - Hotfix branches: `fix/description` for urgent fixes
- **Commit Messages**: 
  - Use conventional commits format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
  - Example: `feat(image-eval): add quality scoring algorithm`
- **PR Process**: 
  - Create PR from feature branch to main
  - Require code review before merge
  - Ensure tests pass
  - Update documentation as needed
  - Merge via squash or merge commit (specify preference)

## Domain Context
**Image Evaluation Domain:**
- **Primary Focus**: Professional photographer's perspective evaluation
- **Evaluation Aspects**:
  - Composition (rule of thirds, leading lines, framing)
  - Technical quality (sharpness, exposure, color accuracy)
  - Artistic merit (creativity, storytelling, visual impact)
  - Lighting and contrast
  - Subject matter and focus
  - Post-processing quality
- **AI Integration**: Uses Tencent Cloud Hunyuan Vision model for intelligent image analysis
- **Performance considerations**: API response time, image upload/processing, batch evaluation
- **Input formats**: JPEG/JPG, PNG, WebP, TIFF
- **Output formats**: JSON evaluation reports containing:
  - Overall score (1-10 scale)
  - Categorized scores (1-10 scale for each category):
    - Composition score
    - Technical quality score
    - Artistic merit score
    - Lighting score
    - Subject matter score
    - Post-processing score
  - Text summary feedback (within 200 characters) providing overall assessment
  - Additional metadata: evaluation timestamp, image information, etc.

**Key Concepts:**
- Photographer evaluation: Professional assessment from photography expertise perspective
- AI-powered analysis: Leveraging Tencent Cloud Hunyuan Vision for visual understanding
- Evaluation metrics: 
  - Overall score (1-10 scale)
  - Categorized scores (1-10 scale): composition, technical quality, artistic merit, lighting, subject matter, post-processing
  - Text summary: Concise feedback within 200 characters
- Evaluation pipeline: Image upload → preprocessing → AI analysis → photographer-style report generation
- Report format: JSON containing:
  - Overall score
  - Individual category scores
  - Text summary
  - Evaluation metadata (timestamp, image info, etc.)

## Important Constraints
- **Performance**: 
  - Single image evaluation: within 10 seconds
  - Concurrent processing: support up to 20 simultaneous image evaluations
  - API response time: target 30ms for API endpoints (excluding image processing time)
- **Memory**: 
  - Maximum image file size: 10MB per image
  - Batch upload: Not supported (single image upload only)
- **Compatibility**: 
  - Node.js: 18+ required
  - Platform: Cross-platform (macOS, Linux, Windows)
  - Browser: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- **Security**: 
  - Validate image inputs (file type, size, format)
  - Sanitize file paths and filenames
  - Secure API key storage (environment variables, database)
  - User registration and login for web UI
  - API Key authentication for API access (auto-generated, no expiration)
  - Rate limiting for API endpoints
  - Input validation and sanitization
  - Password hashing for user authentication
- **Regulatory**: [Specify any compliance requirements, e.g., GDPR, data privacy]

## External Dependencies
- **Image Processing Libraries**: 
  - Sharp (image processing and manipulation)
- **Database**: 
  - MySQL (for storing evaluation records, user information, and API Key data)
  - MySQL client library (e.g., mysql2, Prisma, TypeORM)
  - Database schema includes:
    - Evaluation records table (image info, results, timestamps)
    - User information table (user ID, email, registration time, password hash, etc.)
    - API Key management table (one unique API Key per user, auto-generated upon registration, no expiration, no permission levels)
- **Storage**: 
  - Local file system (for development environment)
  - Tencent Cloud COS (Object Storage Service) for production image storage
  - Tencent Cloud COS SDK
  - Automatic image cleanup: Images deleted after 3 days from evaluation date
- **ML/AI Services**: 
  - Tencent Cloud Hunyuan Vision API (primary AI vision model)
- **APIs**: 
  - Tencent Cloud API SDK
- **Logging & Monitoring**: 
  - Logging system: Winston
  - Log level: warn (warnings and above)
  - Error tracking and monitoring: Sentry
  - Application performance monitoring
- **Infrastructure**: 
  - Docker (containerization)
  - Docker Compose (for local development with MySQL)
