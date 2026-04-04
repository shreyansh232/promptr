# AGENTS.md - Development Guide for Agentic Coding Agents

This document provides essential information for agentic coding agents (Cursor, Claude, Copilot, Windsurf, etc.) working on **Promptr**.

Promptr is an open-source prompt engineering learning platform. Users submit prompts and receive AI-powered analysis — scoring (STRONG / MODERATE / WEAK), encouraging feedback, improved prompt suggestions, and personalized practice problems — all tailored to each user's skill level, expertise, and learning goals.

**License:** MIT  
**Target audience:** Developers and learners who want to improve their prompt engineering skills  

---

## Codebase Structure (Next.js Monorepo + Python Backend)

```
promptr/
├── backend/                        # FastAPI + Google Gemini AI
│   ├── main.py                     # FastAPI app, /analyze-prompt & /generate-problems routes
│   ├── schemas/
│   │   └── user.py                 # Pydantic UserType schema
│   └── venv/                       # Python virtualenv (gitignored)
├── prisma/
│   └── schema.prisma               # MongoDB + Prisma schema (User, UserProfile, Auth models)
├── src/
│   ├── actions/                    # Next.js Server Actions
│   ├── app/                        # Next.js 14 App Router
│   │   ├── api/                    # API route handlers
│   │   ├── dashboard/              # Main app dashboard
│   │   │   └── _components/        # Dashboard-specific components
│   │   ├── problems/               # Practice problems page
│   │   ├── sign-in/                # Auth pages
│   │   ├── sign-up/
│   │   ├── layout.tsx
│   │   └── page.tsx                # Landing page
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── prompt-editor.tsx       # Main prompt input component
│   │   ├── problem-sidebar.tsx     # Problem list sidebar
│   │   ├── problem-description.tsx # Problem detail view
│   │   └── ...                     # Landing page sections (Hero, Features, etc.)
│   ├── data/                       # Static data / seed data
│   ├── hooks/                      # Custom React hooks
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── mongodb.ts              # MongoDB connection (for Auth adapter)
│   │   └── utils.ts                # cn() and shared utilities
│   ├── styles/                     # Global CSS
│   ├── types/                      # Global TypeScript interfaces
│   └── utils/                      # Utility functions
├── auth.ts                         # NextAuth v5 config (GitHub OAuth + credentials)
├── db.ts                           # DB connection export
├── middleware.ts                   # Route protection middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── AGENTS.md                       # ← this file
```

---

## Package Managers & Core Commands

### Frontend (Next.js + TypeScript)

Always use **pnpm** — never npm or yarn.

```bash
# Install dependencies
pnpm install

# Add a dependency
pnpm add <package>

# Add a dev dependency
pnpm add -D <package>

# Run dev server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Lint (max 10 warnings)
pnpm lint

# Type check
npx tsc --noEmit
```

### Backend (FastAPI + Python)

The backend lives in `./backend/`. Use the project's `venv` — avoid installing packages globally.

```bash
# Activate virtual environment
cd backend
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install a new dependency (then update requirements if one exists)
pip install <package>

# Run backend dev server (http://localhost:8000)
uvicorn main:app --reload --port 8000

# Run from project root (if venv is active)
python -m uvicorn backend.main:app --reload --port 8000
```

### Database (Prisma + MongoDB)

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema to MongoDB (no migration files, direct push)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Add new variables to both `.env.example` (without secrets) and `src/env.js` (schema validation).

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key (frontend AI SDK) |
| `api_key` (backend `.env`) | Google Gemini API key for FastAPI backend |

---

## Code Style Guidelines

### TypeScript (Frontend)

- Strict mode enabled (`tsconfig.json`)
- Functional components only — no class components, no `React.FC`
- Prefer `interface` over `type` for object shapes
- Prefer `const` and immutable patterns
- Use Tailwind CSS for all styling — no inline styles, no CSS modules
- Use **shadcn/ui** primitives from `src/components/ui/`
- Use `cn()` from `src/lib/utils.ts` for conditional classNames

```tsx
interface PromptAnalysisProps {
  label: 'STRONG' | 'MODERATE' | 'WEAK'
  feedback: string
  tags: string[]
  isLoading?: boolean
}

export function PromptAnalysis({ label, feedback, tags, isLoading = false }: PromptAnalysisProps) {
  // implementation
}
```

### Python (Backend)

- Keep `main.py` clean — one file, straightforward FastAPI routes
- Use Pydantic `BaseModel` for all request/response bodies
- Use `async def` for all route handlers
- Parse Gemini JSON responses defensively — always handle `json.JSONDecodeError`
- Return structured error messages via `HTTPException`

```python
from fastapi import HTTPException
from pydantic import BaseModel

class MyRequest(BaseModel):
    field: str

@app.post("/my-route")
async def my_route(request: MyRequest):
    try:
        # call Gemini, parse result
        ...
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Architectural Patterns

### Data Flow

```
User → Next.js frontend (App Router)
     → Server Action or API Route
     → FastAPI backend (POST /analyze-prompt)
     → Google Gemini API
     → Structured JSON response
     → Frontend renders feedback
```

### Authentication

- **NextAuth v5** (`next-auth@5.0.0-beta`) configured in `auth.ts`
- Supports **GitHub OAuth** and **credentials** (email/password with bcrypt)
- Session-based auth; adapter dual-writes to MongoDB via `@auth/prisma-adapter` and `@auth/mongodb-adapter`
- Route protection handled in `middleware.ts`
- Always use `auth()` from `auth.ts` in Server Components/Actions, not the session hook

### Database

- **MongoDB** via Prisma ORM (MongoDB provider)
- Schema: `User` → `UserProfile` (1-to-1), `Account`, `Session` (NextAuth managed)
- `UserProfile` stores prompt engineering context: `level`, `expertise`, `learningStyle`, `goals`
- Use `src/lib/prisma.ts` singleton — never instantiate `PrismaClient` directly in components

### AI Integration

- **Frontend**: uses Vercel AI SDK (`ai` package, `@ai-sdk/google`) for streaming where applicable
- **Backend**: uses `google-generativeai` Python SDK with `gemini-2.0-flash`
- Gemini responses **always** return JSON — strip ` ```json ` fences before parsing

---

## Common Development Workflows

### Adding a new AI analysis feature

1. Update `backend/main.py` — add a new `@app.post()` route
2. Update `backend/schemas/user.py` if new input fields are needed
3. Add a corresponding Server Action in `src/actions/` or API route in `src/app/api/`
4. Create or update components in `src/components/` or `src/app/dashboard/_components/`
5. Test JSON parsing edge cases (malformed Gemini response fallback)

### Adding a new page/route

1. Create directory in `src/app/<route-name>/`
2. Add `page.tsx` (Server Component by default)
3. Update `middleware.ts` if the route needs auth protection
4. Add navigation links in `src/components/Header.tsx` if needed

### Adding a new Prisma model

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma db push` (MongoDB — no migration files)
3. Run `npx prisma generate` to update the client
4. Create/update types in `src/types/`

### Adding a new shadcn/ui component

```bash
npx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/`.

---

## Testing Expectations

- No testing framework is currently configured — avoid breaking existing functionality
- Before submitting changes, manually verify:
  - Auth flow (sign in / sign up / sign out) works
  - `/analyze-prompt` backend endpoint returns valid JSON
  - Dashboard renders prompt editor and analysis correctly
  - `pnpm lint` passes with ≤ 10 warnings
  - `npx tsc --noEmit` exits with no errors

---

## Debugging Tips

**Frontend**
- Check `src/env.js` if environment variables are not loading — all vars must be declared there
- NextAuth errors: verify `AUTH_SECRET` is set and `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` match the OAuth app's callback URL exactly (`http://localhost:3000/api/auth/callback/github`)
- Prisma: if `PrismaClient` throws "not generated", run `npx prisma generate`

**Backend**
- Gemini 400 errors → usually a malformed prompt or missing `api_key` in `backend/.env`
- CORS errors in development → the backend allows all origins (`*`); check the frontend is hitting `http://localhost:8000`
- JSON parse failures → Gemini occasionally wraps responses in ` ```json ``` ` fences; the stripping logic in `main.py` handles this but verify the strip range is correct

**Common failure points**
- Missing `api_key` in `backend/.env` (separate from root `.env`)
- MongoDB connection string missing auth credentials
- `UserProfile` not yet created for a new user — check the sign-up flow creates the profile record

---

Help make Promptr the best place to learn prompt engineering.
