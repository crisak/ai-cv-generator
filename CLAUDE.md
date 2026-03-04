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

### 4. CV Generator Workflow (3-Step Process)

**Step 1: Oferta laboral**
- User inputs or pastes full job posting text
- Optional: link to application in dashboard
- System auto-parses with AI (Claude/GPT) to extract key requirements

**Step 2: Seleccionar bullets (Advanced 3-column layout)**
- **Column 1 — Bullets checklist**: Collapsible sections per role, toggle/select bullets, edit inline, AI improve per bullet
- **Column 2 — Live CV Editor**: Real-time editable CV preview with changes from column 1
- **Column 3 — Match Analysis**: Sticky sidebar with:
  - Match score % (green/amber/red) with found/missing keywords
  - Collapsible **Alerts Accordion** (warn/error pills in header) showing:
    - Estimated pages (color-coded: ✓ OK / ⚠ warn / ✕ error)
    - Non-ATS bullets warning + quick fix button
    - Missing key requirements
  - Sticky **Continuar** button at bottom
- **Toolbar (4 buttons with Help Tooltips)**:
  - Vista previa (print CV, check 1-page limit)
  - Ver oferta laboral (search in text)
  - Chat con IA (adjust bullets via conversation)
  - **Optimizar con IA** (→ context modal → suggest optimizations → review diffs → apply to draft, stay in step 2)
- User manually selects bullets or uses AI optimization
- Resulting `draftCv` is saved locally

**Step 3: Resultado final**
- Beautiful ATS-optimized CV rendering in web format
- Download/print to PDF
- Save CV to RxDB (with link to application if applicable)
- Option to go back and edit more, or start new CV

**AI Optimization Flow**
- Click "Optimizar con IA" → opens context modal (optional custom message + predefined suggestion chips)
- Confirms → AI rewrites bullets + reorders skills.technical for max match
- **Diff review dialog**: side-by-side layout (Before | IA suggests), toggle accept/reject per change
- Confirms → applies accepted changes to `draftCv` in Step 2 (does NOT advance to Step 3)
- User can review live in column 2, try "Optimizar" again, or manually edit

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

## Recent Implementations (Phase 3 Complete)

### CV Generator Step 2 Redesign (3-Column Layout)
- **Column 1**: Bullets selector with collapse/expand per section, inline edit, AI improve
- **Column 2**: Live CV editor showing real-time changes
- **Column 3**: Match analysis sidebar with accordion alerts, sticky continue button
- **Toolbar**: 4 buttons (Vista previa, Ver oferta, Chat IA, Optimizar con IA) with help tooltips
- All buttons styled consistently, disabled states handled

### Match Analysis Component
- Displays keyword match % (green/amber/red coloring)
- Shows found vs missing keywords from job offer
- **Accordion-style Alerts** section with collapsible toggle
- Pills showing warn ⚠ and error ✕ counts in accordion header
- Scrollable keywords list (max-h-[140px])
- Alerts include: page estimate, non-ATS bullets (with quick fix), missing keywords
- "Continuar" button always at bottom via `flex flex-col h-full` + spacer pattern

### CV Optimize with AI
- **Context Modal**: Opens when "Optimizar con IA" clicked
  - Optional textarea for additional context
  - 4 predefined suggestion chips (click to select)
  - Confirm button triggers `onOptimize(message)`
- **Optimization Process**:
  - AI rewrites `experience.bullets` + `leadership.bullets` to match job requirements
  - AI reorders/updates `skills.technical` for relevance
  - Returns optimized CV with all fields
- **Diff Review Dialog**: Side-by-side layout
  - Left column: "Antes" (original)
  - Right column: "IA sugiere" (proposed)
  - Toggle accept/reject per change
  - Status badge (Aceptado/Rechazado) per item
- **Flow**: Diff confirm → applies to `draftCv` → stays in Step 2 (NOT auto-advance)
- User can review live in column 2, run optimize again, or manually edit

### Bug Fixes
- Fixed `computeCvDiffs` crash: guard `optimizedItem.bullets` with `?? []` fallback
- Fixed Dialog accessibility warnings: added DialogDescription/aria-describedby (shadcn/ui requirement)

## Important Notes
- No backend API required (RxDB handles local persistence)
- Hardcoded credentials must be hashed to prevent exposure
- CV JSON schema must be strictly followed
- All content in Spanish
- No tests to implement (Vitest config only)
- In "docs/*.json" are the files related of "json-schema-cv-generator.json" and "cv-experiencia-real.json"
- **Step 2 layout**: Grid 3-column `grid-cols-[300px_1fr_300px] h-[calc(100vh-280px)]` for proper viewport height
- **Sticky patterns**: Use `flex flex-col h-full` on containers with `flex-1` spacer to push bottom element down
- **AI Integration**: generateCv() now includes skills in prompt and parses them back
- **Tooltip pattern**: Use `group` + `group-hover:block` with positioned absolute element for consistent help text
