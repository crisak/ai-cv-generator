# CV Generator Platform - Project Guidelines

## Project Overview
A web platform that streamlines the CV generation process for job applications. Centralizes job applications, allows real-time CV generation and editing with AI assistance, and tracks application metadata (salary, benefits, rankings, status, etc.).

## Core Problem Solved
- Automates CV generation from job postings
- Provides preview and editing of AI-generated content (especially goals)
- Centralizes application tracking and metadata
- Eliminates manual JSON editing through intuitive UI

## Tech Stack (Non-Negotiable)
- **Frontend**: React + Next.js with TypeScript
- **Styling**: TailwindCSS with dark/light mode support (Facebook blue palette)
- **State Management**: Zustand
- **Database**: RxDB (Local-First, no backend API needed)
- **UI Components**: shadcn/ui (custom ui - Facebook blue palette)
- **Code Quality**: Prettier, ESLint, Zod (schema validation)
- **Testing**: Vitest (configuration only, no test implementation)
- **Design Skills**: interface-design, vercel-react-best-practices, shadcn-ui

## Key Features (MVP)

### 1. Authentication
- Hardcoded login with mocked credentials
- Email: `cristian.c.romero.p@gmail.com`
- Password: `Ajudfn23#`
- Use crypto-js for hashing (prevent plaintext exposure)

### 2. Dashboard - Applications Tracking
- Centralized view of all job applications sorted by submission date
- Fields tracked:
  - Date applied
  - Company
  - Position
  - Source
  - Status (pending, interviewed, rejected, offer, etc.)
  - Salary offered
  - Benefits
  - Ranking (subjective score)
  - Next steps/Notes
  - Link to generated CV
- Editable fields (e.g., salary, benefits, status)
- Shows ROI per application

### 3. Experience Editor
- Import and edit real experience (cv-experiencia-real.json)
- Dynamic form based on json-schema-cv-generator.json
- Full CRUD operations
- Export in same JSON format
- Stores locally in RxDB

### 4. CV Generator Workflow
- Step 1: Input job posting details
- Step 2: AI preview of suggested goals
  - User can uncheck goals they disagree with
  - Generate alternative goals matching their experience
- Step 3: Generate CV in json-schema-cv-generator.json format
- Step 4: Beautiful web rendering of generated CV
- Stores metadata and CV reference for tracking

### 5. Settings
- Select AI model: Claude, GPT, Gemini, Grok, DeepSeek
- User profile info (email, name)
- Dark/light mode toggle

## Data Models & Storage
- **RxDB Collections**:
  - applications (job postings metadata + CV references)
  - experiences (real work experience)
  - settings (user preferences, AI model selection)
  - cvs (generated CVs in JSON format)

## AI Integration Requirements
- CV generation must follow these rules:
  - Action verb (past tense) + What + How + Quantifiable result
  - Strong verbs: Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré
  - Include metrics (%, time, cost, users)
  - Max 4-5 bullets for recent role, 3 for others
  - Prioritize offer-relevant content
  - Max 1 page PDF
  - Spanish language only
  - Match requirements directly with bullets/skills
- Goals preview MUST be editable before final generation

## UI/UX Principles
- Dark mode first (dark/light toggle)
- Professional but modern aesthetic
- ATS-optimized CV rendering
- Responsive design (mobile-friendly)
- Intuitive forms with validation (Zod)

## Development Preferences
- No over-engineering; minimal features for MVP
- Simple solutions preferred over complex abstractions
- Validation only at system boundaries (user input)
- No unnecessary comments or documentation
- Use existing patterns from the codebase

## Project Structure (TBD during implementation)
- `/app` - Next.js pages and layouts
- `/components` - Reusable React components (shadcn + custom)
- `/lib` - Utilities, database setup, AI integration
- `/hooks` - Custom React hooks
- `/store` - Zustand stores
- `/types` - TypeScript definitions
- `/styles` - Global TailwindCSS config

## Important Notes
- No backend API required (RxDB handles local persistence)
- Hardcoded credentials must be hashed to prevent exposure
- CV JSON schema must be strictly followed
- All content in Spanish
- No tests to implement (Vitest config only)
- In "docs/*.json" are the files related of "json-schema-cv-generator.json" and "cv-experiencia-real.json"
