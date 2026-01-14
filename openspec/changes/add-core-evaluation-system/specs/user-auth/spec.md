## ADDED Requirements

### Requirement: User Registration
The system SHALL allow users to register new accounts with email and password.

#### Scenario: Successful registration
- **WHEN** a user provides valid email and password
- **THEN** a new user account is created
- **AND** the user's password is hashed before storage
- **AND** an API key is automatically generated for the user
- **AND** a session is established for the user

#### Scenario: Registration with duplicate email
- **WHEN** a user attempts to register with an email that already exists
- **THEN** registration fails
- **AND** an appropriate error message is returned

#### Scenario: Registration with invalid email format
- **WHEN** a user provides an invalid email format
- **THEN** registration fails
- **AND** a validation error message is returned

### Requirement: User Login
The system SHALL allow registered users to log in with their email and password.

#### Scenario: Successful login
- **WHEN** a user provides valid email and password
- **THEN** a session is established
- **AND** the user is authenticated
- **AND** the user can access protected resources

#### Scenario: Login with invalid credentials
- **WHEN** a user provides incorrect email or password
- **THEN** login fails
- **AND** an authentication error message is returned
- **AND** no session is created

### Requirement: Session Management
The system SHALL maintain user sessions for authenticated web users.

#### Scenario: Session persistence
- **WHEN** a user is logged in
- **THEN** the session persists across requests
- **AND** the user remains authenticated until logout or session expiration

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** the session is terminated
- **AND** the user is no longer authenticated
