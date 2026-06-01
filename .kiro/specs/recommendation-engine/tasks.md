# Implementation Plan: Recommendation Engine (Full-Stack)

## Overview

Full-stack implementation of the Cadence recommendation engine. Backend (Tasks 0–10): NestJS API with Prisma ORM, PostgreSQL (Supabase), JWT auth, deterministic keyword matching, and intervention logging. Frontend (Tasks 11–17): React Native (Expo) mobile client with Zustand state management, React Navigation, Reanimated animations, and Supabase anonymous auth. Task 18: Final full-stack checkpoint.

## Tasks

- [x] 0. Install all dependencies and configure project scaffolding
  - [x] 0.1 Initialize NestJS backend project and install dependencies
    - Create NestJS project in `backend/` directory
    - Install runtime deps: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@prisma/client`, `class-validator`, `class-transformer`, `jsonwebtoken`
    - Install dev deps: `prisma`, `@types/jsonwebtoken`, `jest`, `@nestjs/testing`, `fast-check`, `ts-jest`, `@types/jest`
    - Configure `tsconfig.json` with `emitDecoratorMetadata: true` and `experimentalDecorators: true`
    - Add `prisma.seed` entry in `package.json` pointing to `prisma/seed.ts`
    - _Requirements: 1.1–1.7, 4.1–4.8_

  - [x] 0.2 Initialize React Native (Expo) frontend project and install dependencies
    - Create Expo project in `mobile/` directory using TypeScript template
    - Install runtime deps: `@supabase/supabase-js`, `expo-secure-store`, `zustand`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-reanimated`, `react-native-screens`, `react-native-safe-area-context`
    - Install dev deps: `fast-check`, `jest`, `@testing-library/react-native`, `@types/jest`, `ts-jest`
    - Configure `babel.config.js` with `react-native-reanimated/plugin` as the LAST plugin entry
    - Create `.env` file with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (all using `EXPO_PUBLIC_` prefix)
    - _Requirements: 7.1–7.7, 9.1–9.7, 10.1–10.7_

- [x] 1. Define Prisma schema and configure database connection
  - [x] 1.1 Create Prisma schema with all models and relationships
    - Create `prisma/schema.prisma` with datasource using `DATABASE_URL` (PgBouncer port 6543) and `directUrl` using `DIRECT_URL` (direct port 5432)
    - Define `User` model: id (UUID PK, not auto-generated), created_at (DateTime default now), mapped to "users"
    - Define `Protocol` model: id (UUID PK auto-generated), name (String unique max 100), duration_seconds (Int), instruction_text (String max 2000), animation_type (String max 50), audio_guide_url (String? max 500), mapped to "protocols"
    - Define `FeedbackResult` enum: better, no_change, worse
    - Define `InterventionLog` model: id (UUID PK auto-generated), user_id (UUID FK), protocol_id (UUID FK), trigger_context (String max 500), feedback_result (FeedbackResult enum), completed_fully (Boolean default false), actual_duration_seconds (Int?), created_at (DateTime default now), mapped to "intervention_logs"
    - Define User→InterventionLog one-to-many with onDelete: Cascade
    - Define Protocol→InterventionLog one-to-many with onDelete: Restrict
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 1.2 Run Prisma generate and db push
    - Run `npx prisma generate` to generate the Prisma Client
    - Run `npx prisma db push` to sync schema to the database
    - Verify generated client types are available for import
    - _Requirements: 1.6_

- [x] 2. Create PrismaService and seed script
  - [x] 2.1 Implement PrismaService as NestJS injectable
    - Create `src/prisma/prisma.service.ts` extending PrismaClient
    - Implement `onModuleInit()` calling `this.$connect()`
    - Implement `onModuleDestroy()` calling `this.$disconnect()`
    - Export PrismaService from a PrismaModule (global: true)
    - _Requirements: 4.4_

  - [x] 2.2 Create ProtocolName enum and seed script
    - Create `src/recommendation/matching/protocol-name.enum.ts` with enum values: PhysiologicalSigh = 'Physiological Sigh', BoxBreathing = 'Box Breathing'
    - Create `prisma/seed.ts` using upsert pattern (create-if-not-exists, update: {} no-op)
    - Seed Physiological Sigh: duration_seconds=60, animation_type='breathing_circle'
    - Seed Box Breathing: duration_seconds=240, animation_type='box_square'
    - Run `npx prisma db seed` to populate Protocol table
    - _Requirements: 5.2, 5.3_

- [x] 3. Implement keyword matcher (pure function)
  - [x] 3.1 Create keyword-matcher module
    - Create `src/recommendation/matching/keyword-matcher.ts`
    - Define `MatchRule` interface: `{ keyword: string; protocolName: ProtocolName }`
    - Define `MATCH_RULES` array: rule 1 = "meeting" → PhysiologicalSigh, rule 2 = "deadline" → BoxBreathing
    - Define `DEFAULT_PROTOCOL_NAME` = ProtocolName.BoxBreathing
    - Implement `matchTriggerContext(triggerContext: string): ProtocolName` — iterates rules in order, returns first match or default
    - Input arrives pre-normalized (trimmed + lowercased) from DTO transform
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 3.2 Write property tests for keyword matcher (Properties 1–3)
    - **Property 1: Keyword matching returns correct protocol** — For any string containing "meeting" (case-insensitive), matchTriggerContext returns PhysiologicalSigh; for "deadline" returns BoxBreathing
    - **Property 2: Default fallback for unmatched contexts** — For any string NOT containing "meeting" or "deadline", returns BoxBreathing
    - **Property 3: Priority resolution for multiple keyword matches** — For any string containing both "meeting" and "deadline", returns PhysiologicalSigh (first rule wins)
    - Use fast-check with custom arbitraries (triggerWithKeyword, triggerWithoutKeywords)
    - Minimum 100 iterations per property
    - **Validates: Requirements 2.2, 2.3, 2.5, 5.2, 5.3, 5.4, 5.5, 5.6**
    - _Requirements: 5.1–5.6_

- [x] 4. Implement DTO classes with validation and transformation
  - [x] 4.1 Create MatchRequestDto
    - Create `src/recommendation/dto/match-request.dto.ts`
    - Add `@IsString()`, `@IsNotEmpty()`, `@MaxLength(500)` decorators on `trigger_context`
    - Add `@Transform(({ value }) => value?.trim().toLowerCase())` for normalization
    - _Requirements: 2.4, 2.6, 4.6, 4.7_

  - [x] 4.2 Create LogRequestDto
    - Create `src/recommendation/dto/log-request.dto.ts`
    - `protocol_id`: `@IsUUID()`
    - `trigger_context`: `@IsString()`, `@IsNotEmpty()`, `@MaxLength(500)`
    - `feedback_result`: `@IsEnum(['better', 'no_change', 'worse'])`
    - `completed_fully`: `@IsBoolean()`, `@IsOptional()` (defaults to false in Prisma)
    - `actual_duration_seconds`: `@IsInt()`, `@Min(0)`, `@IsOptional()` (nullable in DB)
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [x] 4.3 Create response DTOs (MatchResponseDto, LogResponseDto)
    - Create `src/recommendation/dto/match-response.dto.ts` with Protocol fields
    - Create `src/recommendation/dto/log-response.dto.ts` with InterventionLog fields
    - _Requirements: 2.1, 3.1_

  - [x] 4.4 Write property tests for DTO validation (Properties 4, 6, 7)
    - **Property 4: Whitespace-only trigger contexts are rejected** — For any whitespace-only string, DTO validation rejects it
    - **Property 6: Invalid feedback_result values are rejected** — For any string not in ['better','no_change','worse'], validation fails
    - **Property 7: DTO whitespace trimming is applied consistently** — For any string with leading/trailing whitespace, after transform the value equals trimmed original
    - Use fast-check with whitespaceOnly, invalidFeedback, and padded string arbitraries
    - **Validates: Requirements 2.4, 3.5, 4.6, 4.7**
    - _Requirements: 2.4, 3.5, 4.6, 4.7_

- [x] 5. Implement Supabase Auth Guard
  - [x] 5.1 Create SupabaseAuthGuard
    - Create `src/auth/supabase-auth.guard.ts` implementing `CanActivate`
    - Inject `ConfigService` to read `SUPABASE_JWT_SECRET`
    - Extract Bearer token from Authorization header
    - Verify JWT using `jsonwebtoken.verify()` with clockTolerance
    - Validate `decoded.role === 'authenticated'` (reject 'anon' and 'service_role')
    - Attach `decoded.sub` (UUID) to `request.user`
    - Throw `UnauthorizedException` on any failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.2 Create CurrentUser parameter decorator
    - Create `src/auth/decorators/current-user.decorator.ts`
    - Extract `request.user` from execution context
    - _Requirements: 6.3, 6.5_

  - [x] 5.3 Create AuthModule and register ConfigModule
    - Create `src/auth/auth.module.ts` exporting SupabaseAuthGuard
    - Register `ConfigModule.forRoot({ isGlobal: true })` in AppModule
    - Create `.env` with `SUPABASE_JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`
    - _Requirements: 6.1_

  - [x] 5.4 Write property test for JWT extraction (Property 8)
    - **Property 8: JWT sub claim extraction produces correct user identity** — For any valid JWT with a UUID sub claim, the guard extracts and attaches that exact UUID as the user identity
    - Mock jsonwebtoken.verify to return controlled payloads
    - Use fast-check to generate UUID sub claims and verify extraction
    - **Validates: Requirements 6.3**
    - _Requirements: 6.3_

- [-] 6. Implement RecommendationService
  - [x] 6.1 Create RecommendationService with matchProtocol method
    - Create `src/recommendation/recommendation.service.ts`
    - Inject PrismaService
    - Implement `matchProtocol(triggerContext: string): Promise<Protocol>` — calls `matchTriggerContext()` to get protocol name, then queries Protocol table by name
    - Throw `NotFoundException` if protocol not found in DB
    - _Requirements: 2.1, 2.2, 2.3, 5.1–5.6_

  - [x] 6.2 Implement logIntervention with optimistic user upsert
    - Implement `logIntervention(userId: string, dto: LogRequestDto): Promise<InterventionLog>`
    - Optimistic path: attempt `prisma.interventionLog.create()` directly (assumes user exists)
    - Catch `PrismaClientKnownRequestError` with code `P2003` on `user_id` field
    - On P2003: upsert user (create: { id: userId }, update: {}), then retry the create
    - Re-throw any non-P2003 errors (these are caught by PrismaExceptionFilter)
    - _Requirements: 3.1, 3.3, 3.8_

  - [x] 6.3 Write unit tests for RecommendationService
    - Test optimistic path: existing user → single create succeeds
    - Test FK violation path: P2003 → upsert user → retry create succeeds
    - Test non-existent protocol → NotFoundException (404)
    - Test unexpected Prisma error → re-thrown (handled by filter)
    - Mock PrismaService for all tests
    - _Requirements: 3.1, 3.3, 3.4, 3.7, 4.5_

  - [ ] 6.4 Write property test for intervention log persistence (Property 5)
    - **Property 5: Intervention log persistence round-trip** — For any valid combination of protocol_id, trigger_context, feedback_result, completed_fully, actual_duration_seconds, creating a log and reading it back produces matching field values with non-null id and created_at
    - Requires test database with seeded protocols
    - Use fast-check to generate valid log inputs
    - **Validates: Requirements 3.1**
    - _Requirements: 3.1_

- [ ] 7. Implement RecommendationController and wire module
  - [ ] 7.1 Create RecommendationController
    - Create `src/recommendation/recommendation.controller.ts`
    - Apply `@UseGuards(SupabaseAuthGuard)` at class level
    - `@Post('recommendation/match')` → delegates to `service.matchProtocol(dto.trigger_context)`
    - `@Post('log')` → uses `@CurrentUser() userId` and delegates to `service.logIntervention(userId, dto)`
    - Controller contains NO business logic or direct DB access
    - _Requirements: 2.1, 2.7, 3.1, 3.8, 4.2, 4.3_

  - [ ] 7.2 Create RecommendationModule and AppModule
    - Create `src/recommendation/recommendation.module.ts` importing PrismaModule, providing RecommendationService and RecommendationController
    - Create/update `src/app.module.ts` importing ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, RecommendationModule
    - Apply global ValidationPipe in `main.ts` with `whitelist: true`, `transform: true`
    - _Requirements: 4.3, 4.8_

- [ ] 8. Implement PrismaExceptionFilter
  - [ ] 8.1 Create PrismaExceptionFilter
    - Create `src/common/filters/prisma-exception.filter.ts`
    - Catch `PrismaClientKnownRequestError` and `PrismaClientInitializationError`
    - Map P2002 (unique constraint) → 409 Conflict
    - Map P2025 (record not found) → 404 Not Found
    - Map connection/initialization errors → 500 Internal Server Error
    - IMPORTANT: This filter only catches UNHANDLED Prisma errors — the optimistic P2003 in RecommendationService is caught in the service itself and never reaches this filter
    - Register as global filter in `main.ts`
    - _Requirements: 3.7_

- [ ] 9. Checkpoint — Backend compilation and tests
  - Ensure backend compiles without errors (`npx tsc --noEmit`)
  - Ensure all backend unit tests pass (`npx jest`)
  - Ensure all property tests (Properties 1–8) pass
  - Ask the user if questions arise.

- [ ] 10. Backend integration tests
  - [ ] 10.1 Write integration tests for full endpoint flow
    - Test authenticated POST /recommendation/match → 200 with correct protocol
    - Test authenticated POST /log → 201 with persisted record
    - Test missing auth → 401
    - Test invalid body → 400
    - Test cascade delete: create user + logs, delete user, verify logs removed
    - Test restrict delete: attempt to delete protocol with logs → rejection
    - Test unique constraint on Protocol.name → 409
    - Set up test database utilities (setup/teardown)
    - _Requirements: 1.4, 1.5, 1.7, 2.1, 2.7, 3.1, 3.8, 6.1, 6.2, 6.6_

- [-] 11. Frontend project setup and configuration
  - [x] 11.1 Scaffold directory structure in existing mobile/ project
    - Navigate to the existing `mobile/` project (already created in Task 0.2 — do NOT re-run `npx create-expo-app`)
    - Verify `tsconfig.json` has strict mode enabled
    - Create directory structure: `app/`, `app/screens/`, `app/store/`, `app/services/`, `app/navigation/`, `app/animations/`, `app/hooks/`, `app/types/`
    - _Requirements: 7.1–7.7_

  - [x] 11.2 Configure Babel, Jest mock for Reanimated, and environment variables
    - Verify `babel.config.js` has `react-native-reanimated/plugin` as the LAST entry in the `plugins` array (already added in Task 0.2 — verify, do not duplicate)
    - Configure Jest setup file (`jest.setup.js`) to mock Reanimated: add `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));` — without this, all tests importing Reanimated components will crash with native module errors
    - Reference the setup file in `package.json` or `jest.config.js` via `setupFiles: ['./jest.setup.js']`
    - Verify `.env` file exists with all env vars using `EXPO_PUBLIC_` prefix (already created in Task 0.2):
      - `EXPO_PUBLIC_API_URL` — backend API base URL
      - `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
      - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
    - Verify env vars are accessible via `process.env.EXPO_PUBLIC_*` at runtime
    - _Requirements: 10.7_

- [x] 12. TypeScript types and Zustand stores
  - [x] 12.1 Define shared TypeScript interfaces
    - Create `app/types/index.ts`
    - Define `Protocol` interface: id, name, duration_seconds, instruction_text, animation_type, audio_guide_url (string | null)
    - Define `SessionPhase` type: 'idle' | 'preparation' | 'execution' | 'feedback'
    - Define `FeedbackResult` type: 'better' | 'no_change' | 'worse'
    - Define `AuthState`, `ProtocolState`, `SessionState` interfaces matching design
    - _Requirements: 8.1_

  - [x] 12.2 Implement useAuthStore (Zustand)
    - Create `app/store/useAuthStore.ts`
    - State: token (string | null), userId (string | null), isAuthenticated (boolean)
    - Actions: login(token, userId), logout(), restoreToken()
    - login() stores token in secure storage + updates state
    - logout() clears secure storage + resets state
    - restoreToken() reads from secure storage and hydrates store
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7_

  - [x] 12.3 Implement useProtocolStore (Zustand)
    - Create `app/store/useProtocolStore.ts`
    - State: protocol (Protocol | null)
    - Actions: setProtocol(protocol), clearProtocol()
    - setProtocol stores the full Protocol object
    - clearProtocol resets to null
    - Protocol and session slices are NOT persisted (reset on app launch)
    - _Requirements: 8.4, 8.7_

  - [x] 12.4 Implement useSessionStore (Zustand)
    - Create `app/store/useSessionStore.ts`
    - State: phase (SessionPhase, default 'idle'), elapsedSeconds (number, default 0), completedFully (boolean, default false)
    - Actions: setPhase(phase), tick(), complete(), skip(), reset()
    - tick() increments elapsedSeconds by 1
    - complete() sets completedFully=true, transitions to 'feedback'
    - skip() sets completedFully=false, transitions to 'feedback'
    - reset() returns all state to defaults (phase='idle', elapsedSeconds=0, completedFully=false)
    - Phase transitions must be sequential: idle→preparation→execution→feedback→idle
    - _Requirements: 8.1, 8.5, 8.7_

- [x] 13. Auth service with Supabase client and secure storage
  - [x] 13.1 Create secure storage adapter
    - Create `app/services/secureStorage.ts`
    - Wrap `expo-secure-store` with getItem, setItem, removeItem interface
    - Export adapter object compatible with Supabase storage interface
    - _Requirements: 9.6, 9.7_

  - [x] 13.2 Create Supabase client with custom storage adapter
    - Create `app/services/auth.ts`
    - Initialize Supabase client with `createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth: { storage: secureStoreAdapter, ... } })`
    - CRITICAL: Use the custom secure storage adapter (NOT AsyncStorage)
    - Set `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`
    - Implement `signInAnonymously()` function
    - Implement `restoreSession()` function that checks for existing session
    - On successful auth: call `useAuthStore.getState().login(token, userId)`
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7_

- [x] 14. API service with JWT interceptor
  - [x] 14.1 Create API client with auth interceptor
    - Create `app/services/api.ts`
    - Create fetch/axios wrapper with base URL from `EXPO_PUBLIC_API_URL`
    - CRITICAL: Interceptor reads token via `useAuthStore.getState().token` (NOT the React hook — avoids Hook Rule violations outside components)
    - Attach `Authorization: Bearer <token>` header to every request
    - If no token available, do NOT send request until auth completes
    - Set request timeouts: 10s for /recommendation/match, 15s for /log
    - _Requirements: 9.4, 9.5_

  - [x] 14.2 Implement 401 retry logic
    - On 401 response: clear token via `useAuthStore.getState().logout()`
    - Trigger anonymous re-auth via Supabase client
    - Retry the original request exactly once with new token
    - If retry also fails, propagate error to caller
    - _Requirements: 9.5_

- [x] 15. Navigation structure
  - [x] 15.1 Create RootNavigator and InterventionFlowNavigator
    - Create `app/navigation/RootNavigator.tsx` — native stack with HomeScreen as main screen
    - Create `app/navigation/InterventionFlowNavigator.tsx` — modal stack with Preparation, Execution, Feedback screens
    - Register InterventionFlowNavigator as a modal presentation in RootNavigator
    - Configure gesture-based dismiss prevention on the modal (user must complete flow)
    - _Requirements: 7.3, 7.4_

  - [x] 15.2 Implement back-navigation prevention during execution
    - In InterventionFlowNavigator, disable back gesture and hardware back button when session phase is 'execution'
    - Use `navigation.addListener('beforeRemove')` to prevent accidental timer reset
    - User must explicitly tap "Skip" or complete the timer to leave Execution
    - _Requirements: 7.5_

- [ ] 16. Screens implementation
  - [ ] 16.1 Implement HomeScreen
    - Create `app/screens/HomeScreen.tsx`
    - Render TextInput for trigger_context with maxLength=500 and visible character counter
    - Render submit button
    - On submit: call API POST /recommendation/match with trigger_context
    - On success (200): store protocol in useProtocolStore, navigate to InterventionFlow modal
    - On error (4xx/5xx): display inline error message without navigating away
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

  - [ ] 16.2 Implement PreparationScreen
    - Create `app/screens/PreparationScreen.tsx`
    - Display protocol name, duration_seconds (formatted), and instruction_text from useProtocolStore
    - Render "Begin" button that transitions session phase to 'execution' and navigates to ExecutionScreen
    - _Requirements: 7.4_

  - [ ] 16.3 Implement ExecutionScreen with Reanimated animations and useTimer hook
    - Create `app/hooks/useTimer.ts` — countdown hook from duration_seconds, decrements every 1s, calls useSessionStore.tick() each second
    - Create `app/screens/ExecutionScreen.tsx`
    - Render countdown timer display (remaining seconds)
    - Render animation component based on protocol.animation_type ('breathing_circle' or 'box_square')
    - Create `app/animations/BreathingCircle.tsx` — Reanimated worklet-driven expanding/contracting circle
    - Create `app/animations/BoxSquare.tsx` — Reanimated worklet-driven square tracing animation
    - All animation logic runs on UI thread via Reanimated worklets (does NOT block JS thread)
    - Render "Skip" button: calls useSessionStore.skip(), records actual_duration_seconds as elapsed, navigates to Feedback
    - When timer reaches 0: calls useSessionStore.complete(), navigates to Feedback
    - CRITICAL: On AppState resume (foreground), re-sync Reanimated shared values to correct animation phase based on elapsed time delta — prevents visual jumping after backgrounding
    - Implement AppState listener: calculate time delta on resume, update elapsedSeconds, snap shared values
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ] 16.4 Implement FeedbackScreen
    - Create `app/screens/FeedbackScreen.tsx`
    - Render three outcome buttons: "Better", "No Change", "Worse"
    - On selection: send POST /log with protocol_id, trigger_context, feedback_result, completed_fully, actual_duration_seconds
    - On success (201) or failure: dismiss modal, return to HomeScreen, reset session and protocol stores
    - On failure: log error but still dismiss (do not block user)
    - _Requirements: 7.6_

  - [ ] 16.5 Wire App.tsx with navigation container and auth initialization
    - Create/update `app/App.tsx` as root component
    - Wrap with NavigationContainer
    - On mount: call restoreToken() → if no token, trigger anonymous sign-in
    - Show loading state while auth initializes
    - Render RootNavigator once authenticated
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 17. Frontend tests (Properties 9–12 and unit/component tests)
  - [ ] 17.1 Write property test for session phase transitions (Property 9)
    - **Property 9: Session phase transitions are sequential** — For any intervention session, phase transitions only in order: idle→preparation→execution→feedback→idle. No phase is skipped or revisited.
    - Test that calling setPhase with out-of-order values is rejected or ignored
    - Use fast-check to generate random action sequences and verify phase invariant
    - **Validates: Requirements 7.4, 7.5, 8.5**
    - _Requirements: 7.4, 7.5, 8.5_

  - [ ] 17.2 Write property test for timer bounds (Property 10)
    - **Property 10: Timer elapsed never exceeds protocol duration** — For any protocol with duration_seconds=D, session.elapsedSeconds never exceeds D. When elapsed reaches D, session transitions to 'feedback' with completedFully=true.
    - Use fast-check to generate durations (1–3600) and simulate tick sequences
    - Verify elapsedSeconds is clamped at D and complete() is triggered
    - **Validates: Requirements 10.1, 10.5**
    - _Requirements: 10.1, 10.5_

  - [ ] 17.3 Write property test for auth token presence (Property 11)
    - **Property 11: Auth token is always present on API requests** — For any HTTP request sent to the backend, the Authorization header contains a Bearer token from the Zustand auth store. If no token is available, the request is not sent.
    - Mock the API service, generate random request payloads
    - Verify every outgoing request has Authorization header with valid Bearer format
    - Verify requests are blocked when token is null
    - **Validates: Requirements 9.4, 9.5**
    - _Requirements: 9.4, 9.5_

  - [ ] 17.4 Write property test for secure storage exclusivity (Property 12)
    - **Property 12: Secure storage exclusivity for JWT** — For any app session, the JWT token exists in exactly one persistent storage location: expo-secure-store. The token is never written to AsyncStorage or any unencrypted mechanism.
    - Mock storage adapters, verify only secureStorage.setItem is called for token persistence
    - Verify AsyncStorage is never invoked for token-related keys
    - **Validates: Requirements 9.6, 9.7**
    - _Requirements: 9.6, 9.7_

  - [ ] 17.5 Write unit tests for Zustand stores and hooks
    - Test useAuthStore: login() sets token+userId+isAuthenticated; logout() clears all; restoreToken() hydrates from secure storage
    - Test useProtocolStore: setProtocol() stores protocol; clearProtocol() resets to null
    - Test useSessionStore: setPhase() updates phase; tick() increments elapsed; complete() sets completedFully; skip() records partial
    - Test useTimer hook: starts at duration, decrements each second, stops at zero
    - Test background tracking: calculates correct elapsed delta on foreground resume
    - _Requirements: 8.1–8.7, 10.1, 10.3, 10.4_

  - [ ] 17.6 Write unit tests for API interceptor
    - Test that Bearer token is attached to all requests
    - Test 401 response triggers re-auth and single retry
    - Test retry failure propagates error
    - Test request is blocked when no token available
    - _Requirements: 9.4, 9.5_

  - [ ] 17.7 Write component tests for screens
    - HomeScreen: renders input, character counter, submit button; shows error on API failure
    - PreparationScreen: displays protocol name, duration, instruction text
    - ExecutionScreen: shows timer, skip button; verify timer decrements
    - FeedbackScreen: renders outcome buttons; submits on selection
    - Use React Native Testing Library with mocked stores and navigation
    - _Requirements: 7.1–7.7, 10.1–10.6_

- [ ] 18. Final full-stack checkpoint
  - Ensure backend compiles without errors and all backend tests pass (unit + property + integration)
  - Ensure mobile app compiles without errors on both iOS and Android (`npx expo start`)
  - Ensure all frontend tests pass (property tests Properties 9–12, unit tests, component tests)
  - Verify end-to-end flow: anonymous auth → trigger input → match → preparation → execution → feedback → log
  - Ask the user if questions arise.

## Notes

- ALL tests are mandatory — no optional markers. Property tests and unit tests must be implemented.
- Backend uses NestJS + Prisma ORM + PostgreSQL (Supabase) + Supabase Auth JWT
- Frontend uses React Native (Expo) + TypeScript + Zustand + React Navigation + React Native Reanimated
- `ConfigModule.forRoot({ isGlobal: true })` must be registered in AppModule
- `PrismaExceptionFilter` only catches unhandled errors — the optimistic P2003 is caught in the service layer
- Frontend env vars MUST use `EXPO_PUBLIC_` prefix to be bundled by Expo
- `react-native-reanimated/plugin` MUST be the LAST plugin in `babel.config.js`
- Supabase client MUST use custom storage adapter wrapping `expo-secure-store` (NOT AsyncStorage)
- API interceptor MUST use `useAuthStore.getState().token` (NOT the React hook)
- Reanimated shared values MUST be re-synced on AppState resume to prevent visual jumping
- Property tests use fast-check with minimum 100 iterations per property
- Checkpoints verify compilation on both backend and mobile
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "0.2"] },
    { "id": 1, "tasks": ["1.1", "11.1"] },
    { "id": 2, "tasks": ["1.2", "11.2", "12.1"] },
    { "id": 3, "tasks": ["2.1", "2.2", "12.2", "12.3", "12.4"] },
    { "id": 4, "tasks": ["3.1", "13.1"] },
    { "id": 5, "tasks": ["3.2", "4.1", "4.2", "4.3", "13.2"] },
    { "id": 6, "tasks": ["4.4", "5.1", "5.2", "14.1"] },
    { "id": 7, "tasks": ["5.3", "5.4", "14.2"] },
    { "id": 8, "tasks": ["6.1", "15.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "15.2"] },
    { "id": 10, "tasks": ["6.4", "7.1", "16.1"] },
    { "id": 11, "tasks": ["7.2", "8.1", "16.2"] },
    { "id": 12, "tasks": ["9"] },
    { "id": 13, "tasks": ["10.1", "16.3"] },
    { "id": 14, "tasks": ["16.4", "16.5"] },
    { "id": 15, "tasks": ["17.1", "17.2", "17.3", "17.4"] },
    { "id": 16, "tasks": ["17.5", "17.6", "17.7"] },
    { "id": 17, "tasks": ["18"] }
  ]
}
```
