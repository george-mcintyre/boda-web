# WeddingApp Constitution

## Core Principles

### Component-First Design
Components must be isolated, testable, and documentable with clear purpose.

### Comments and Documentation Language
- README docs and specifications will be provided in two language versions: 
  - Primary (default): English (no suffix after document name. e.g. README.md)
  - Secondary: Spanish. (suffix after document name ".es". e.g. README.es.md).
- Spanish versions are for documentation only - English versions are the primary authoritative versions.
- New comments must be provided in English only
- Any Spanish comments found in any code being refactored MUST be converted to English comments

### i18n
- All pages MUST use i18n to provide content in user's chosen language.  This includes:
  - All static page content
  - All error messages
  - All labels, hints, and tool tips

### Web-Only Interface
Access to the application will be via web browsers only.  No CLI access will be possible or provided.

### Test-First (Mandatory)
TDD mandatory for functions but not for UI or end to end:
For each function, e.g. getByEmail()
- Tests written → Tests fail → Implement;

### Integration Testing
No integration testing required for this project

### Observability, Versioning, Simplicity
No logging required above very basic logging

## Technology Constraints
- Node.js v18+
- TypeScript 5.0
- Database: MongoDB
- Compliance: GDPR
- Production Hosting: Vercel 

## Development Process
- Automated testing gates for functions in all features


Version: 1.0.0 | Ratified: 2025-11-22 | Last Amended: 2025-11-22
