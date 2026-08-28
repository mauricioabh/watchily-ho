# validated-environment Specification

## Purpose

Provides a single, typed contract for configuration so required integrations fail clearly while optional features remain safely disabled when their credentials are absent.

## Requirements

### Requirement: Required configuration is validated explicitly

The application SHALL validate required Supabase and primary streaming configuration before using those integrations, and SHALL report the variable names that are missing or invalid without exposing their values.

#### Scenario: Required variable is missing

- **WHEN** the application starts or builds without a required variable
- **THEN** validation fails with an actionable message naming the missing variable

#### Scenario: Required URL is malformed

- **WHEN** a required URL variable is present but is not a valid URL
- **THEN** validation fails before the integration is invoked

### Requirement: Optional integrations fail closed

The application SHALL treat PostHog, Sentry, Upstash, Inngest, Push, and secondary streaming credentials as optional features, and SHALL disable an integration when its complete required configuration is unavailable.

#### Scenario: Optional integration has no credentials

- **WHEN** an optional integration has no credentials configured
- **THEN** the rest of the application remains usable and the integration performs no external call

#### Scenario: Paired credentials are incomplete

- **WHEN** an integration requiring a credential pair has only one member configured
- **THEN** the integration is disabled or reports a configuration error without attempting a partial connection

### Requirement: Secrets remain server-only

The system MUST prevent server secrets, including Supabase secret keys and streaming provider API keys, from being available to client bundles or browser-exposed configuration.

#### Scenario: Client code imports configuration

- **WHEN** a client component accesses the public configuration
- **THEN** it can receive only explicitly public variables and cannot receive server secrets

### Requirement: Configuration documentation stays complete

The project SHALL document every supported runtime variable, its scope, whether it is required or optional, and the feature it controls in the local example and deployment documentation.

#### Scenario: New integration is configured

- **WHEN** a developer follows the documented setup for a new integration
- **THEN** the required variable names and public/server scope are unambiguous
