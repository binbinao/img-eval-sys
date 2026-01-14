## ADDED Requirements

### Requirement: Image Upload
The system SHALL accept image uploads from authenticated users via web UI or API.

#### Scenario: Successful image upload
- **WHEN** a user uploads a valid image file (JPEG, PNG, WebP, or TIFF)
- **AND** the file size is within 10MB limit
- **THEN** the image is accepted
- **AND** the image is stored (local for dev, COS for production)
- **AND** image metadata is recorded

#### Scenario: Upload with invalid file type
- **WHEN** a user attempts to upload an unsupported file format
- **THEN** upload is rejected
- **AND** an appropriate error message is returned

#### Scenario: Upload with file exceeding size limit
- **WHEN** a user attempts to upload a file larger than 10MB
- **THEN** upload is rejected
- **AND** an appropriate error message is returned

### Requirement: Image Evaluation Processing
The system SHALL evaluate uploaded images using Tencent Cloud Hunyuan Vision API.

#### Scenario: Successful evaluation
- **WHEN** a valid image is uploaded
- **THEN** the image is sent to Tencent Cloud Hunyuan Vision API
- **AND** AI analysis is performed
- **AND** evaluation results are processed
- **AND** evaluation completes within 10 seconds

#### Scenario: Evaluation API failure
- **WHEN** the Tencent Cloud API fails or times out
- **THEN** an error is logged
- **AND** an appropriate error message is returned to the user
- **AND** the evaluation is marked as failed

#### Scenario: Concurrent evaluation processing
- **WHEN** multiple images are uploaded simultaneously
- **THEN** the system processes up to 20 concurrent evaluations
- **AND** additional requests are queued until capacity is available
- **AND** each evaluation completes within 10 seconds

### Requirement: Evaluation Report Generation
The system SHALL generate comprehensive evaluation reports with scores and feedback.

#### Scenario: Report generation with all components
- **WHEN** an image evaluation completes successfully
- **THEN** a JSON report is generated containing:
  - Overall score (1-10 scale)
  - Composition score (1-10 scale)
  - Technical quality score (1-10 scale)
  - Artistic merit score (1-10 scale)
  - Lighting score (1-10 scale)
  - Subject matter score (1-10 scale)
  - Post-processing score (1-10 scale)
  - Text summary (within 200 characters)
  - Evaluation timestamp
  - Image metadata

#### Scenario: Report storage
- **WHEN** an evaluation report is generated
- **THEN** the report is stored in the database
- **AND** the report is associated with the user account
- **AND** the report can be retrieved later

### Requirement: Evaluation History
The system SHALL allow users to view their evaluation history.

#### Scenario: Viewing evaluation history
- **WHEN** an authenticated user requests their evaluation history
- **THEN** all past evaluations for that user are returned
- **AND** results are ordered by most recent first
- **AND** each result includes evaluation metadata and scores

### Requirement: Image Storage Management
The system SHALL manage image storage with automatic cleanup based on retention policy.

#### Scenario: Storage strategy selection
- **WHEN** the system is in development environment
- **THEN** images are stored in local file system
- **WHEN** the system is in production environment
- **THEN** images are stored in Tencent Cloud COS (Object Storage)

#### Scenario: Automatic image cleanup
- **WHEN** an image has been stored for 3 days after evaluation
- **THEN** the image file is automatically deleted
- **AND** the evaluation record in database is preserved
- **AND** the deletion is logged
