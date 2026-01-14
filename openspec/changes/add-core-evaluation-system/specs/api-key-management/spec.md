## ADDED Requirements

### Requirement: API Key Auto-Generation
The system SHALL automatically generate a unique API key for each user upon registration.

#### Scenario: API key generation on registration
- **WHEN** a new user successfully registers
- **THEN** a unique API key is automatically generated
- **AND** the API key is associated with the user account
- **AND** the API key is stored in the database
- **AND** the API key has no expiration date
- **AND** the API key has no permission levels (full access)

#### Scenario: One API key per user
- **WHEN** a user already has an API key
- **THEN** no additional API key is generated
- **AND** the existing API key remains valid

### Requirement: API Key Validation
The system SHALL validate API keys for API endpoint access.

#### Scenario: Valid API key authentication
- **WHEN** a request includes a valid API key in the header
- **THEN** the request is authenticated
- **AND** the associated user is identified
- **AND** the request proceeds to the endpoint handler

#### Scenario: Invalid API key authentication
- **WHEN** a request includes an invalid or missing API key
- **THEN** authentication fails
- **AND** a 401 Unauthorized response is returned
- **AND** the request is not processed

### Requirement: API Key Retrieval
The system SHALL allow authenticated users to retrieve their API key.

#### Scenario: User retrieves their API key
- **WHEN** an authenticated user requests their API key
- **THEN** the user's API key is returned
- **AND** only the user's own API key is accessible
