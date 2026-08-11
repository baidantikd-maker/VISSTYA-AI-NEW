# Visstya AI — Project TODO

## Architecture & Setup

- [x] Initialize web-db-user project scaffold
- [x] Create database schema (verifications, reports, users)
- [x] Set up environment variables for external APIs (Gemini, OpenWeatherMap, Nominatim, Fact Check APIs)
- [x] Set up file storage for media uploads (S3 integration, presigned URLs, Supabase fallback)

## Backend — Verification Modules

- [x] Module 1: Metadata Analysis (EXIF extraction, integrity checks, score /15)
- [x] Module 2: Vision Analysis (Gemini 2.5 Flash integration, claim consistency, score /25)
- [x] Module 3: Weather Verification (Nominatim geocoding, OpenWeatherMap API integration, conditional skip for indoor scenes, score /25)
- [x] Module 4: Evidence Corroboration (Search queries, news verification with trusted sources, veracity scoring, score /35)
- [x] Trust Engine Orchestrator (parallel execution, score aggregation, status band assignment)
- [x] tRPC procedures for verification workflow

## Backend — Data Management

- [x] Query helpers for storing and retrieving verification reports
- [x] User verification history queries
- [x] Report sharing/access control logic
- [x] Unit tests for verification modules, Trust Engine, and scoring

## Frontend — Pages & Components

- [x] Landing page (hero, vision statement, CTA, smooth scrolling)
- [x] Media upload page (file/URL input, claim fields, form validation)
- [x] Trust Report page (score gauge, status badge, module cards, narrative)
- [x] Verification history page (list of past reports, filters)
- [x] Navigation & routing structure
- [x] Report sharing/detail page (unique link, read-only view)

## Frontend — Design & UX

- [x] Neo-minimalist design system (color palette, typography, spacing)
- [x] Responsive layout (mobile-first, breakpoints)
- [x] Smooth page transitions and animations
- [x] Skeleton loading states
- [x] Staggered entrance animations
- [x] Animated trust score gauge
- [x] Status badge styling (FALSE, AVERAGE, TRUSTABLE)

## Frontend — Integration

- [x] Connect upload form to verification API
- [x] Implement real-time progress tracking during verification
- [x] Display module scores and findings in report
- [x] Implement verification history list
- [x] Add report sharing functionality
- [x] Error handling and user feedback

## Testing & Polish

- [x] Vitest unit tests for backend procedures
- [x] End-to-end testing of verification flow
- [x] Mobile responsiveness testing
- [x] Animation performance optimization
- [x] Accessibility audit (keyboard nav, contrast, focus states)

## Deployment

- [x] Create final checkpoint
- [x] Verify all features working in preview
- [x] Prepare for publish
