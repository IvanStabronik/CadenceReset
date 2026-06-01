# Requirements Document

## Introduction

This is the full-stack requirements document for "Cadence", a somatic self-regulation app for burnout prevention. The system consists of two major components: (1) the Recommendation Engine backend API and (2) the Mobile Client frontend application. The backend (NestJS, Prisma ORM, PostgreSQL via Supabase) powers the app's four-state flow (Smart Trigger → Preparation → Execution → Post-Intervention Feedback) by matching user-reported trigger contexts to appropriate somatic protocols and logging intervention outcomes. The Mobile Client (React Native with Expo, TypeScript) provides the user interface, managing authentication state via Zustand, rendering performant 60fps animations via React Native Reanimated, and navigating users through the intervention flow using React Navigation.

## Glossary

- **Recommendation_Engine**: The NestJS backend service responsible for matching trigger contexts to somatic protocols and logging intervention feedback.
- **Protocol**: A somatic self-regulation exercise defined by a name, duration, instruction text, animation type, and optional audio guide URL (e.g., "Physiological Sigh", 60 seconds).
- **Trigger_Context**: A free-text description of the user's current stressor or situation (e.g., "3 hours of back-to-back meetings"), limited to 500 characters.
- **Intervention_Log**: A record capturing which protocol was recommended, the trigger context, the user's post-intervention feedback, and completion tracking data.
- **Feedback_Result**: The user's self-reported outcome after completing a protocol (e.g., "better", "no_change", "worse").
- **User**: An authenticated individual using the Cadence app, identified by their Supabase Auth user ID.
- **Prisma_Schema**: The database schema definition file that defines data models and their relationships using Prisma ORM syntax.
- **Auth_Guard**: A NestJS guard that validates the Supabase JWT token from the Authorization header and extracts the authenticated user's ID.
- **DTO**: A Data Transfer Object validated using class-validator decorators to ensure incoming request data conforms to expected types and constraints.
- **Mobile_Client**: The React Native (Expo) mobile application that provides the user interface for the Cadence app.
- **Zustand_Store**: The client-side state management store (Zustand) that holds the JWT token, current matched protocol, and active intervention session state.
- **Reanimated**: React Native Reanimated library used for performant 60fps animations on the intervention execution screen.
- **Intervention_Flow**: The modal navigation flow consisting of three sequential phases: Preparation, Execution, and Feedback.
- **Home_Screen**: The primary screen where users input their trigger context and initiate the recommendation flow.
- **Secure_Storage**: Platform-specific secure storage (expo-secure-store) used to persist the JWT token between app sessions.

## Requirements

### Requirement 1: Data Model Definition

**User Story:** As a developer, I want a complete Prisma schema defining the data models, so that the database structure supports the recommendation and logging workflows.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL define a User model with fields: id (UUID, primary key, sourced from Supabase Auth user ID — not auto-generated independently), and created_at (DateTime, default to current timestamp).
2. THE Prisma_Schema SHALL define a Protocol model with fields: id (UUID, primary key, auto-generated), name (String, maximum 100 characters), duration_seconds (Integer, minimum value 1, maximum value 3600), instruction_text (String, maximum 2000 characters), animation_type (String, maximum 50 characters), and audio_guide_url (String, nullable, maximum 500 characters).
3. THE Prisma_Schema SHALL define an InterventionLog model with fields: id (UUID, primary key, auto-generated), user_id (UUID, foreign key to User), protocol_id (UUID, foreign key to Protocol), trigger_context (String, maximum 500 characters), feedback_result (String, constrained to enum values "better", "no_change", or "worse"), completed_fully (Boolean, default false), actual_duration_seconds (Integer, nullable, minimum value 0), and created_at (DateTime, default to current timestamp).
4. THE Prisma_Schema SHALL define a one-to-many relationship from User to InterventionLog with cascade delete behavior, so that deleting a User removes all associated InterventionLog records.
5. THE Prisma_Schema SHALL define a one-to-many relationship from Protocol to InterventionLog with restrict delete behavior, so that a Protocol cannot be deleted while associated InterventionLog records exist.
6. THE Prisma_Schema SHALL configure the PostgreSQL datasource provider with a connection URL sourced from the DATABASE_URL environment variable.
7. THE Prisma_Schema SHALL define a unique constraint on the Protocol model's name field to prevent duplicate protocol entries.

### Requirement 2: Protocol Recommendation Endpoint

**User Story:** As a user, I want to receive a matched somatic protocol based on my current trigger context, so that I can perform an appropriate self-regulation exercise.

#### Acceptance Criteria

1. WHEN a POST request is received at the /recommendation/match endpoint with a JSON body containing a trigger_context field, THE Recommendation_Engine SHALL query the Protocol table for the matched protocol and return an HTTP 200 response containing the full Protocol record with fields: id, name, duration_seconds, instruction_text, animation_type, and audio_guide_url.
2. WHEN the trigger_context string contains the keyword "meeting" (matched case-insensitively), THE Recommendation_Engine SHALL return the Protocol record from the database where name equals "Physiological Sigh".
3. WHEN the trigger_context string does not match any keyword rule defined in Requirement 5, THE Recommendation_Engine SHALL return the Protocol record from the database where name equals "Box Breathing" as the default.
4. IF the trigger_context field is missing, empty, or contains only whitespace characters, THEN THE Recommendation_Engine SHALL return an HTTP 400 response with an error message indicating that trigger_context is required.
5. IF the trigger_context string matches multiple keyword rules, THEN THE Recommendation_Engine SHALL return the Protocol record associated with the first matching rule in priority order: "meeting" first, "deadline" second.
6. IF the trigger_context field exceeds 500 characters, THEN THE Recommendation_Engine SHALL return an HTTP 400 response with an error message indicating the maximum allowed length.
7. THE Recommendation_Engine SHALL require a valid Supabase JWT token in the Authorization header for the /recommendation/match endpoint.

### Requirement 3: Intervention Logging Endpoint

**User Story:** As a user, I want to log my post-intervention feedback, so that the system can track my outcomes and improve future recommendations.

#### Acceptance Criteria

1. WHEN a POST request is received at the /log endpoint with a valid body containing protocol_id, trigger_context, feedback_result, completed_fully, and actual_duration_seconds, THE Recommendation_Engine SHALL extract the user_id from the authenticated JWT token, persist an InterventionLog record to the database, and return an HTTP 201 response containing the created record with its generated id and a timestamp indicating when the log was recorded.
2. IF the request body is missing required fields (protocol_id, trigger_context, or feedback_result), THEN THE Recommendation_Engine SHALL return an HTTP 400 response with an error message indicating which fields are missing.
3. IF the user_id extracted from the JWT token does not correspond to an existing User record in the public.users table, THEN THE Recommendation_Engine SHALL automatically create the user record and retry the log creation, ensuring first-time users are onboarded transparently.
4. IF the provided protocol_id does not correspond to an existing Protocol, THEN THE Recommendation_Engine SHALL return an HTTP 404 response indicating the protocol was not found.
5. IF the feedback_result value is not one of "better", "no_change", or "worse", THEN THE Recommendation_Engine SHALL return an HTTP 400 response with an error message indicating the accepted values.
6. IF the trigger_context field exceeds 500 characters, THEN THE Recommendation_Engine SHALL return an HTTP 400 response with an error message indicating the maximum allowed length.
7. IF the database is unavailable or the write operation fails, THEN THE Recommendation_Engine SHALL return an HTTP 500 response with an error message indicating a server error, and SHALL NOT return a success status.
8. THE Recommendation_Engine SHALL require a valid Supabase JWT token in the Authorization header for the /log endpoint and SHALL NOT accept user_id in the request body.

### Requirement 4: NestJS Service Architecture and DTO Validation

**User Story:** As a developer, I want clean separation between the controller and service layers with validated DTOs, so that the codebase is maintainable, testable, and rejects malformed input at the boundary.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL implement a RecommendationService class containing the protocol-matching logic.
2. THE Recommendation_Engine SHALL implement a RecommendationController class that delegates request handling to the RecommendationService, containing no business logic or database access of its own.
3. THE Recommendation_Engine SHALL use NestJS dependency injection to provide the RecommendationService to the RecommendationController.
4. THE Recommendation_Engine SHALL use Prisma Client for all database read and write operations within the service layer.
5. THE Recommendation_Engine SHALL structure the RecommendationService so that it can be instantiated in a unit test with mocked dependencies and invoked without an HTTP request context.
6. THE Recommendation_Engine SHALL define DTO classes for each endpoint using class-validator decorators to enforce field types, required fields, string length constraints, and enum value constraints.
7. THE Recommendation_Engine SHALL define DTO classes using class-transformer decorators to handle type coercion and field transformation where needed.
8. THE Recommendation_Engine SHALL apply the NestJS ValidationPipe globally so that all incoming requests are validated against their corresponding DTO before reaching the controller method.

### Requirement 5: Deterministic Rule-Based Matching (MVP)

**User Story:** As a product owner, I want the MVP recommendation logic to use simple deterministic rules, so that we can validate the user flow before investing in ML-based matching.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL implement rule-based matching using substring keyword detection on the trigger_context string.
2. WHEN the trigger_context contains the substring "meeting", THE Recommendation_Engine SHALL select the Protocol record from the database where name equals "Physiological Sigh".
3. WHEN the trigger_context contains the substring "deadline", THE Recommendation_Engine SHALL select the Protocol record from the database where name equals "Box Breathing".
4. WHEN the trigger_context matches multiple keyword rules, THE Recommendation_Engine SHALL select the protocol associated with the first matching rule in definition order (rule 1: "meeting", rule 2: "deadline").
5. WHEN no keyword rule matches the trigger_context, THE Recommendation_Engine SHALL fall back to the Protocol record from the database where name equals "Box Breathing" as the default.
6. THE Recommendation_Engine SHALL perform keyword matching in a case-insensitive manner.

### Requirement 6: Authentication and Authorization

**User Story:** As a user, I want my identity to be securely verified via Supabase Auth, so that no one can impersonate me or submit data on my behalf.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL implement an Auth_Guard that validates the Supabase JWT token from the Authorization header on every protected endpoint.
2. WHEN a request lacks a valid JWT token in the Authorization header, THE Auth_Guard SHALL return an HTTP 401 response with an error message indicating authentication is required.
3. WHEN a valid JWT token is present, THE Auth_Guard SHALL extract the user ID from the token's sub claim and attach it to the request context for use by downstream handlers.
4. THE Recommendation_Engine SHALL use the User.id field as the same value as the Supabase Auth user ID (the sub claim from the JWT), ensuring a single source of identity.
5. THE Recommendation_Engine SHALL NOT accept user_id as a client-supplied field in any request body or query parameter for endpoints that perform user-specific operations.
6. IF the JWT token is expired or has an invalid signature, THEN THE Auth_Guard SHALL return an HTTP 401 response with an error message indicating the token is invalid.

### Requirement 7: Mobile App Navigation & UI Flow

**User Story:** As a user, I want a simple, focused interface that guides me from describing my stressor to completing a self-regulation exercise, so that I can quickly access help without cognitive overhead.

#### Acceptance Criteria

1. THE Home_Screen SHALL display a text input for trigger_context with a maximum length of 500 characters and a visible character counter, and a submit button.
2. WHEN the submit button is pressed with valid input, THE Mobile_Client SHALL send a POST request to the /recommendation/match endpoint with the trigger_context and the JWT token from the Zustand_Store attached as a Bearer token in the Authorization header.
3. WHEN a successful response (HTTP 200) is received from /recommendation/match, THE Mobile_Client SHALL navigate to the Intervention_Flow modal.
4. THE Intervention_Flow SHALL present three sequential phases: Preparation (displaying the protocol name, duration_seconds, and instruction_text), Execution (animated timer), and Feedback (outcome selection).
5. WHILE the session phase is "execution" and the timer has started, THE Mobile_Client SHALL prevent backward navigation from Execution to Preparation.
6. WHEN the Feedback phase is completed with a selected feedback_result, THE Mobile_Client SHALL send a POST request to the /log endpoint with the protocol_id, trigger_context, feedback_result, completed_fully, and actual_duration_seconds fields, and return the user to the Home_Screen.
7. IF the /recommendation/match request fails with an HTTP 4xx or 5xx status code, THEN THE Mobile_Client SHALL display an inline error message on the Home_Screen without navigating away.

### Requirement 8: Client-Side State Management (Zustand)

**User Story:** As a developer, I want a predictable client-side state container, so that the app's authentication state, matched protocol, and session progress are managed in a single source of truth.

#### Acceptance Criteria

1. THE Zustand_Store SHALL maintain the following state slices: auth (jwt token, user id, isAuthenticated boolean), protocol (the currently matched Protocol object or null), and session (current phase enum with values idle, preparation, execution, or feedback, elapsed_seconds integer, and completed_fully boolean).
2. WHEN the user logs in successfully, THE Zustand_Store SHALL store the JWT token and user ID, and set isAuthenticated to true.
3. WHEN the user logs out or the token expires, THE Zustand_Store SHALL clear the JWT token and user ID, set isAuthenticated to false, and remove the token from Secure_Storage.
4. WHEN a Protocol object is received from the /recommendation/match endpoint, THE Zustand_Store SHALL store the full Protocol object and set the session phase to "preparation".
5. WHEN the session phase transitions from one phase to the next, THE Zustand_Store SHALL update the phase value synchronously before any UI re-render occurs.
6. THE Zustand_Store SHALL persist the auth slice (JWT token) to Secure_Storage so that the user remains authenticated across app restarts.
7. THE Zustand_Store SHALL NOT persist the session or protocol slices; the session and protocol slices SHALL reset to default values on app launch.

### Requirement 9: Authentication Flow & Secure Token Storage

**User Story:** As a user, I want to be silently authenticated when I open the app, so that I can immediately start using it without a login screen blocking my access.

#### Acceptance Criteria

1. WHEN the app launches, THE Mobile_Client SHALL check Secure_Storage for an existing JWT token.
2. IF a valid (non-expired) JWT token is found in Secure_Storage, THEN THE Mobile_Client SHALL restore the token to the Zustand_Store and proceed to the Home_Screen without showing a login UI.
3. IF no token is found or the token is expired, THEN THE Mobile_Client SHALL initiate a Supabase anonymous sign-in automatically, store the resulting JWT in Secure_Storage and the Zustand_Store, and proceed to the Home_Screen.
4. THE Mobile_Client SHALL attach the JWT token from the Zustand_Store as a Bearer token in the Authorization header of every request to the backend API.
5. IF any backend request returns HTTP 401, THEN THE Mobile_Client SHALL clear the stored token, re-initiate anonymous sign-in, and retry the original request exactly once.
6. THE Mobile_Client SHALL use expo-secure-store (Secure_Storage) for token persistence, utilizing encrypted platform-native keychain on iOS and keystore on Android.
7. THE Mobile_Client SHALL NOT store the JWT token in AsyncStorage, local storage, or any unencrypted storage mechanism.

### Requirement 10: Intervention Execution (Animation & Timer Logic)

**User Story:** As a user, I want a smooth, visually guided breathing/timer animation during the exercise, so that I can follow along without distraction and complete the full protocol duration.

#### Acceptance Criteria

1. WHEN the session phase transitions to "execution", THE Mobile_Client SHALL start a countdown timer from the protocol's duration_seconds value, decrementing every second.
2. THE Mobile_Client SHALL render the timer animation using Reanimated at 60fps, driven by the protocol's animation_type field (e.g., "breathing_circle" renders an expanding and contracting circle, "box_square" renders a square tracing animation).
3. THE Mobile_Client SHALL update the Zustand_Store's session.elapsed_seconds value every second during execution.
4. IF the user backgrounds the app during execution, THEN THE Mobile_Client SHALL continue tracking elapsed time and resume the animation at the correct position when the app returns to the foreground.
5. WHEN the countdown reaches zero, THE Mobile_Client SHALL set session.completed_fully to true, transition the session phase to "feedback", and stop the animation.
6. IF the user manually exits the execution phase before the timer completes (e.g., via a "Skip" button), THEN THE Mobile_Client SHALL set session.completed_fully to false, record the actual_duration_seconds as the elapsed time, and transition the session phase to "feedback".
7. THE Mobile_Client SHALL run all animation logic on the UI thread via Reanimated worklets; animation rendering SHALL NOT block the JavaScript thread.
