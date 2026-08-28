# application-localization Specification

## Purpose

Supports English and Spanish as first-class application languages with stable, SEO-friendly URLs while preserving authentication endpoints and the existing no-locale TV integration.

## Requirements

### Requirement: Supported locales and fallback are deterministic

The application SHALL support `en` and `es`, SHALL use English as the default locale for existing unprefixed URLs, and SHALL fall back safely to English for an unsupported locale.

#### Scenario: Existing URL is opened

- **WHEN** a user opens an existing unprefixed application URL
- **THEN** the English version is rendered without requiring a URL migration

#### Scenario: Spanish URL is opened

- **WHEN** a user opens the same route under the `/es` locale prefix
- **THEN** the Spanish version is rendered

#### Scenario: Unsupported locale is requested

- **WHEN** a user requests a locale outside `en` and `es`
- **THEN** the request is rejected or redirected to the English equivalent without rendering untranslated locale data

### Requirement: User-facing content is localized consistently

Navigation, authentication, search, title details, lists, library, settings, onboarding, errors, loading states, metadata, and accessibility labels SHALL use the active locale rather than hardcoded language-specific copy.

#### Scenario: Language is switched

- **WHEN** a user switches between English and Spanish
- **THEN** the current route and supported query parameters are preserved in the selected locale

### Requirement: Locale routing preserves non-page contracts

API routes, auth callbacks, static assets, OpenAPI routes, and server-to-server endpoints SHALL remain unlocalized, while localized page links SHALL preserve the active locale.

#### Scenario: API request is made from Spanish UI

- **WHEN** a Spanish page calls an application API
- **THEN** the API path remains unchanged and the request retains authentication behavior

### Requirement: TV routes remain compatible

The existing hosted TV route and user-agent rewrites SHALL continue to work without requiring a locale prefix, and the TV surface SHALL use English by default while allowing an explicit Spanish TV route if supported.

#### Scenario: TV hosted app opens root route

- **WHEN** the hosted TV application opens its existing root URL
- **THEN** middleware rewrites and TV rendering continue to work

### Requirement: Localized metadata is generated

Localized pages SHALL provide locale-appropriate titles, descriptions, alternate locale links where applicable, and canonical URLs that do not duplicate the same content accidentally.

#### Scenario: Search engine reads Spanish title page

- **WHEN** a crawler requests a Spanish title page
- **THEN** its metadata and canonical/alternate links identify the Spanish representation
