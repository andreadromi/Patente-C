# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema web per esercitarsi su simulazioni d'esame per trasporto merci. L'applicazione permette agli utenti di eseguire simulazioni d'esame con 60 domande (2 ore di tempo), ricevere report dettagliati, tracciare punti deboli e migliorare attraverso quiz mirati.

**Production URL**: https://simulazioni-esami-dun.vercel.app

## Tech Stack

- **Framework**: Next.js 15 with App Router (TypeScript)
- **Database**: PostgreSQL (Neon in production) / SQLite (local development)
- **ORM**: Prisma 6
- **Authentication**: iron-session (cookie-based, Edge Runtime compatible)
- **Styling**: Tailwind CSS v4 with dark mode
- **UI**: Lucide React icons, Framer Motion animations
- **Hosting**: Vercel with auto-deploy on main branch

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Database
```bash
# Push schema changes to database (development)
npx prisma db push

# Generate Prisma Client after schema changes
npm run prisma:generate

# Seed database with questions and simulations
npm run db:seed
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server locally
npm start

# Lint code
npm run lint
```

### Production Database Management
```bash
# IMPORTANT: Migrations are applied manually in production
# DO NOT use prisma migrate deploy in build script

# To apply schema changes to production:
1. Test locally with: npx prisma db push
2. Commit schema changes
3. Manually run on Vercel: npx prisma db push
4. Let auto-deploy rebuild the app
```

## Architecture

### Database Schema (Prisma)

**Core Models**:
- `User`: Utenti (username only) + Admin (username + password hash)
- `Area`: 8 aree tematiche (A-H) con regole di valutazione
- `Question`: 872 domande con 4 opzioni e risposta corretta
- `Simulation`: 19 simulazioni pre-generate (JSON array di 60 question IDs)
- `UserSimulation`: Tentativo utente su una simulazione (status, score, timing)
- `Answer`: Risposta utente a una domanda (con unique constraint `[userSimulationId, questionId]`)
- `AreaResult`: Risultati per area in una simulazione completata
- `WeakPoint`: Punti deboli utente (domande sbagliate) con counter 3-strike removal

**Key Constraints**:
- `Answer`: `@@unique([userSimulationId, questionId])` - CRITICAL for upsert operations
- All relations have `onDelete: Cascade` for safe user/simulation deletion
- `questionOrder` field in `UserSimulation` stores shuffled order as JSON array

### Authentication Flow

1. **User Login** (`/login`): Username only → Creates user if not exists → iron-session cookie
2. **Admin Login** (`/admin/login`): Username + password (bcrypt hash) → Requires `isAdmin: true`
3. **Middleware** (`middleware.ts`): Protects `/dashboard` and `/admin/*` routes with JWT verification
4. **Session**: Stored in httpOnly cookie (more secure than localStorage JWT)

### Simulation Flow

1. **Start Simulation** (`POST /api/simulations/[id]/start`):
   - Creates new `UserSimulation` with status `IN_PROGRESS`
   - Generates question order (shuffled but respecting area distribution)
   - Stores order in `questionOrder` field for persistence across page refreshes

2. **Answer Questions** (`POST /api/user-simulations/[id]/answer`):
   - Uses `prisma.answer.upsert()` to save/update answers
   - Auto-saves on every answer change
   - Requires unique constraint to work properly

3. **Complete Simulation** (`POST /api/user-simulations/[id]/complete`):
   - Validates ALL 60 questions are answered
   - Calculates results per area
   - **CRITICAL**: Areas A+B+C+D are evaluated as MACRO-AREA (≥10/20 correct combined)
   - Other areas (E, F, G, H) require ≥50% each
   - Updates status to `COMPLETED`, stores score and pass/fail
   - Creates `AreaResult` records
   - Automatically creates `WeakPoint` entries for incorrect answers

### Weak Points System

**Tracking**:
- Created automatically when user answers incorrectly in a simulation
- One `WeakPoint` per (user, question) pair

**Quiz Practice** (`/weak-points/practice`):
- Interactive quiz with immediate feedback
- **3-strike removal**: 3 consecutive correct answers → removes weak point
- **Counter reset**: 1 incorrect answer → resets `consecutiveCorrect` to 0
- Progress bar and statistics tracking

**API Routes**:
- `POST /api/weak-points/start`: Loads all user weak points
- `POST /api/weak-points/answer`: Handles answer + 3-strike logic

### Question Distribution (Critical)

Each simulation has **exactly 60 questions** in **FIXED ORDER**:
- **Questions 1-20**: Areas A+B+C+D combined (total 20, variable distribution per simulation)
- **Questions 21-30**: Area E (10 questions)
- **Questions 31-40**: Area F (10 questions)
- **Questions 41-50**: Area G (10 questions)
- **Questions 51-60**: Area H (10 questions)

**IMPORTANT**: The order is **FIXED** in the database (field `simulation.questions`). The API must use this exact order without shuffling. Shuffling was causing undefined questions in the array (bug fixed in v1.4.1).

**Pass Criteria**:
- **Macro-area ABCD**: ≥10/20 correct (evaluated as single unit)
- **Area E, F, G, H**: ≥5/10 correct each (≥50%)

This distribution is enforced in:
- Seed script: `prisma/seed.ts` (pre-generated simulations)
- Simulation start: Question order shuffling respects area blocks

### Admin Area

**CRUD Operations** (`/admin/*`):
- **Questions** (`/admin/questions`): Paginated list (20/page), search, filter by area, create/edit/delete
- **Simulations** (`/admin/simulations`): List all 19 simulations, create/edit/delete
- **Users** (`/admin/users`): List with stats, create/edit/delete (CASCADE deletes all related data)

**Protection**:
- All admin routes require `isAdmin: true` in session
- Middleware redirects non-admin users to `/dashboard`
- API routes use `requireAuth()` helper and check `isAdmin` flag

### Dark Mode

- **Provider**: `next-themes` with localStorage persistence
- **Strategy**: Tailwind `class` mode (`dark:` prefix)
- **Toggle**: Available in dashboard header (sun/moon icon)
- **Coverage**: All pages support dark mode with proper color schemes

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts              # User login (username only)
│   │   ├── admin/login/route.ts        # Admin login (username + password)
│   │   ├── me/route.ts                 # Get current user session
│   │   └── logout/route.ts             # Clear session
│   ├── simulations/
│   │   └── [id]/start/route.ts         # Start new simulation attempt
│   ├── user-simulations/
│   │   └── [id]/
│   │       ├── answer/route.ts         # Save/update answer (upsert)
│   │       ├── complete/route.ts       # Complete simulation + calculate score
│   │       └── report/route.ts         # Get simulation report
│   ├── weak-points/
│   │   ├── start/route.ts              # Load weak points for quiz
│   │   └── answer/route.ts             # Answer weak point question (3-strike logic)
│   └── admin/
│       ├── questions/route.ts          # CRUD questions
│       ├── simulations/route.ts        # CRUD simulations
│       └── users/route.ts              # CRUD users
├── dashboard/page.tsx                  # User dashboard (simulations list)
├── simulations/[id]/page.tsx           # Simulation execution (60 questions, timer)
├── user-simulations/[userSimId]/report/page.tsx  # Report with area breakdown
├── weak-points/
│   ├── page.tsx                        # Weak points overview (stats per area)
│   └── practice/page.tsx               # Interactive quiz
└── admin/
    ├── dashboard/page.tsx              # Admin home
    ├── questions/page.tsx              # Questions management
    ├── simulations/page.tsx            # Simulations management
    └── users/page.tsx                  # Users management

lib/
├── auth.ts                             # iron-session helpers (requireAuth, getSession)
├── jwt.ts                              # JWT token generation/verification
└── prisma.ts                           # Prisma Client singleton

components/
├── CircularProgress.tsx                # Progress indicator
├── SimulationCarousel.tsx              # Simulation cards carousel
├── SimulationSlider.tsx                # Alternative slider component
├── ThemeProvider.tsx                   # next-themes wrapper
└── ThemeToggle.tsx                     # Dark mode toggle button

prisma/
├── schema.prisma                       # Database schema (8 models)
├── seed.ts                             # Seed script (872 questions, 19 simulations)
└── migrations/                         # Migration history (manual in production)

data/
├── questions.json                      # 872 questions extracted from PDFs
└── simulations.json                    # 19 pre-generated simulations

middleware.ts                           # Route protection (dashboard, admin)
```

## Important Notes

### Database Operations

1. **Answer Upsert**: The unique constraint `@@unique([userSimulationId, questionId])` on `Answer` model is CRITICAL. Without it, `prisma.answer.upsert()` will fail. If you modify the schema, always run `npx prisma db push` and restart the dev server.

2. **Cascade Deletes**: All foreign keys have `onDelete: Cascade` to prevent orphaned records. Deleting a user will delete all their simulations, answers, and weak points.

3. **Question Order Persistence**: The `questionOrder` field in `UserSimulation` stores the shuffled question IDs as a JSON string. This ensures the same order is shown even after page refresh. Parse it with `JSON.parse()` when loading.

### Pass/Fail Logic

The evaluation logic in `app/api/user-simulations/[id]/complete/route.ts` (lines 111-142) implements the **macro-area ABCD grouping**. Do NOT change this logic without understanding the business rules:

- Areas A, B, C, D are evaluated together (≥10/20 total)
- Areas E, F, G, H are evaluated individually (≥5/10 each)

### Weak Points 3-Strike Removal

In `app/api/weak-points/answer/route.ts`, the `consecutiveCorrect` counter:
- Increments on correct answer
- Deletes weak point when reaches 3
- **Resets to 0** on any incorrect answer

This is intentional to ensure mastery before removal.

### Build Configuration

The `package.json` build script is:
```json
"build": "prisma generate && next build"
```

**IMPORTANT**: Do NOT add `prisma migrate deploy` to build script. Migrations are applied manually to avoid locking issues with Neon PostgreSQL. Schema changes should be pushed manually after testing locally.

### Environment Variables

Required in `.env` (local) and Vercel environment:
```
DATABASE_URL="postgresql://..."     # Neon PostgreSQL connection string
JWT_SECRET="random-secret-key"      # For iron-session encryption
```

### Default Admin Credentials

- Username: `admin`
- Password: `Admin2025`

These are created by the seed script. Change password in production if needed.

## Common Tasks

### Adding a New Question

1. Use admin interface: `/admin/questions/new`
2. Select area (A-H)
3. Enter question text, 4 options, and correct answer (1-4)
4. Save (creates unique code automatically)

### Regenerating Simulations

Simulations are pre-generated with specific question distributions. To regenerate:

1. Modify `data/simulations.json` or update seed script logic
2. Run `npm run db:seed` to repopulate database

### Testing Locally

1. Start dev server: `npm run dev`
2. User login: http://localhost:3000/login (any username)
3. Admin login: http://localhost:3000/admin/login (admin / Admin2025)
4. Open Prisma Studio: `npm run db:studio` to inspect database

### Debugging Session Issues

If authentication is not working:
1. Check `JWT_SECRET` is set in `.env`
2. Verify middleware is allowing the route in `middleware.ts`
3. Check cookies in browser DevTools (should have `auth-token`)
4. Verify `requireAuth()` is called in API routes that need protection

## Recent Critical Fixes (v1.4.1) ✅

### Bug 1: Undefined Questions in Simulation Start (Oct 18, 2025) - FIXED

**Problem**: API `/api/simulations/[id]/start` returned 500 error with "X domande non valide nell'array ordinato"

**Root Cause**:
- `shuffleWithSeed` function had incorrect TypeScript type (`typeof questions` instead of generic `<T>`)
- Spread operator `[...array]` created holes in array
- Result: 8-21 questions became `undefined` after shuffle

**Solution Implemented**:
1. ✅ Reorganized `data/simulations.json` with correct distribution (all 19 simulations)
2. ✅ Verified with `scripts/verify-order-report.ts` - all simulations correct
3. ✅ Updated production database with `scripts/update-prod-database.ts` (deleted 3 test users, updated 19 simulations)
4. ✅ Simplified `/api/simulations/[id]/start/route.ts` - removed ~220 lines of shuffle code
5. ✅ Uses fixed order from `simulation.questions` field with Map-based ordering

**Files Changed**:
- `app/api/simulations/[id]/start/route.ts` - Removed shuffle, uses fixed DB order (-53% lines)
- `data/simulations.json` - Reorganized all 19 simulations with correct area distribution
- `scripts/update-prod-database.ts` - Production database update script

### Bug 2: Same Shuffle Bug in Report API (Oct 18, 2025) - FIXED

**Problem**: API `/api/user-simulations/[id]/report/route.ts` crashed with `Cannot read properties of undefined (reading 'id')` when clicking "Termina" (Complete) button

**Root Cause**: Same shuffle bug as Bug 1, creating undefined elements in `orderedQuestions` array

**Solution Implemented**:
1. ✅ Removed shuffle logic from report API (lines 64-119 deleted)
2. ✅ Uses saved `questionOrder` from UserSimulation model
3. ✅ Fallback to fixed order from `simulation.questions` if `questionOrder` is missing
4. ✅ Map-based ordering preserves exact question sequence

**Files Changed**:
- `app/api/user-simulations/[id]/report/route.ts` - Removed shuffle, uses saved question order

### Comprehensive Verification (Oct 18, 2025) ✅

**All API routes verified** for similar shuffle bugs:
- ✅ `/api/simulations/[id]/start/route.ts` - FIXED (no shuffle)
- ✅ `/api/user-simulations/[id]/report/route.ts` - FIXED (no shuffle)
- ✅ `/api/user-simulations/[id]/complete/route.ts` - SAFE (no shuffle, calculates stats only)
- ✅ `/api/user-simulations/[id]/answer/route.ts` - SAFE (single question, no arrays)
- ✅ `/api/weak-points/start/route.ts` - SAFE (no shuffle, alphabetical sort)
- ✅ `/api/weak-points/answer/route.ts` - SAFE (single question, no arrays)

**Pattern Search Results**:
- `shuffleWithSeed` - Found only in fixed files (start + report APIs)
- `seededRandom` - Found only in fixed files
- Spread operator with question arrays - Only in fixed files
- All `.map()` operations - Verified safe, no undefined risks

**Scripts Created**:
- `scripts/fix-simulation-order.ts` - Reorder simulations by area
- `scripts/verify-order-report.ts` - Verify all 19 simulations
- `scripts/update-prod-database.ts` - Update production Neon database
- `VERIFICATION_REPORT.txt` - Detailed verification report (all 19 ✅)

## Known Issues & Solutions

### Build Errors

**Error**: `Cannot find module '@prisma/client'`
**Solution**: Run `npx prisma generate` to regenerate Prisma Client after schema changes

**Error**: Migration lock timeout in production
**Solution**: Use `npx prisma db push` instead of migrations in Neon PostgreSQL

### Runtime Errors

**Error**: `Unknown argument 'userSimulationId_questionId'` in upsert
**Solution**: Unique constraint missing. Run `npx prisma db push` and restart server

**Error**: Hydration error with window access
**Solution**: Wrap client-side window access in `useEffect()` hook

**Error**: 500 on user deletion
**Solution**: Ensure all foreign keys have `onDelete: Cascade` in schema

## Testing Strategy

**Manual Testing Checklist** (before deploying major changes):

1. User flow:
   - [ ] Login with new username
   - [ ] Start simulation
   - [ ] Answer questions (test navigation, timer)
   - [ ] Complete simulation (verify scoring)
   - [ ] Check report (area breakdown, pass/fail)
   - [ ] Retry same simulation (multiple attempts)

2. Weak points:
   - [ ] Fail questions in simulation → weak points created
   - [ ] Start weak points quiz
   - [ ] Answer correctly 3 times → removed
   - [ ] Answer incorrectly → counter resets

3. Admin:
   - [ ] Login as admin
   - [ ] Create/edit/delete question
   - [ ] Create/edit/delete user
   - [ ] View user statistics

4. Dark mode:
   - [ ] Toggle theme in dashboard
   - [ ] Verify persistence after reload
   - [ ] Check all pages render correctly

## Deployment

**Production environment**: Vercel + Neon PostgreSQL

1. Push to `main` branch → auto-deploys to Vercel
2. If schema changed:
   - Manually run on Vercel CLI: `npx prisma db push`
   - Trigger redeploy to regenerate Prisma Client
3. Verify deployment: https://simulazioni-esami-dun.vercel.app

**Database seed** (one-time setup):
```bash
# After fresh database setup
npx prisma db push
npm run db:seed
```

## Additional Documentation

- `STATUS.md`: Current project status, changelog, completed features
- `CHANGELOG.md`: Detailed version history
- `docs/ARCHITETTURA_TECNICA.md`: Complete technical architecture (extended version of this file)
- `docs/10-comandi-utili.md`: Additional useful commands
- `Istruzioni.pdf`: Original functional specifications
