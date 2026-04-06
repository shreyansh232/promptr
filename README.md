# Promptr

**A practical prompt engineering practice platform.** Write prompts, get scored feedback, and solve personalized practice problems — all tailored to your skill level.

## What It Does

Promptr helps you learn prompt engineering through hands-on practice:

- **Prompt Analysis** — Submit a prompt draft and get scored feedback (STRONG / MODERATE / WEAK) with specific improvement suggestions and rewritten examples.
- **Practice Problems** — Solve LeetCode-style challenges personalized to your level, expertise, and goals. Each problem includes test cases, examples, and pro tips.
- **ELO Rating System** — Track your progress with an ELO-based ranking system that adapts problem difficulty as you improve.
- **Personalized Learning** — Problems and feedback are calibrated to your learner profile (level, expertise, learning style, goals).

## Tech Stack

### Frontend

- **Next.js 14** (App Router) — React framework with server components
- **TypeScript** — Strict mode, functional components
- **Tailwind CSS** + **shadcn/ui** — Styling and UI primitives
- **NextAuth v5** — Authentication (GitHub OAuth + credentials)
- **Vercel AI SDK** — Streaming AI responses

### Backend

- **FastAPI** — Python REST API
- **OpenAI GPT-4o-mini** — AI analysis and problem generation
- **Pydantic** — Request/response validation

### Database

- **MongoDB** — Primary database
- **Prisma ORM** — Type-safe database client

## Architecture

```
User → Next.js Frontend (App Router)
     → Server Action / API Route
     → FastAPI Backend (POST /analyze-prompt, /generate-problems)
     → OpenAI GPT-4o-mini
     → Structured JSON response
     → Frontend renders feedback + scoring
```

## Project Structure

```
promptr/
├── backend/                        # FastAPI + OpenAI
│   ├── main.py                     # FastAPI app entry
│   ├── routers/analysis.py         # /analyze-prompt & /generate-problems routes
│   ├── services/gemini_service.py  # AI service (prompt analysis + problem generation)
│   ├── schemas/                    # Pydantic models
│   └── knowledge-base/             # Prompt engineering reference for problem generation
├── prisma/
│   └── schema.prisma               # MongoDB + Prisma schema
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── dashboard/              # Main practice interface
│   │   ├── problems/               # Practice problems page
│   │   ├── profile/                # User profile & stats
│   │   ├── onboarding/             # Initial user setup
│   │   └── api/                    # API route handlers
│   ├── components/                 # Shared UI components
│   ├── actions/                    # Next.js Server Actions
│   ├── lib/                        # Prisma client, utilities
│   └── types/                      # TypeScript interfaces
├── auth.ts                         # NextAuth v5 configuration
├── middleware.ts                   # Route protection
└── next.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Python 3.10+
- MongoDB (local or Atlas)
- OpenAI API key

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable               | Description                                 |
| ---------------------- | ------------------------------------------- |
| `DATABASE_URL`         | MongoDB connection string                   |
| `AUTH_SECRET`          | NextAuth secret (`openssl rand -base64 32`) |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App client ID                  |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret              |
| `OPENAI_API_KEY`       | OpenAI API key (used by backend)            |

Create `backend/.env` with:

```
OPENAI_API_KEY=your_openai_api_key
```

### Install Dependencies

```bash
# Frontend
pnpm install

# Backend virtual environment
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push
```

### Run the App

```bash
# Terminal 1 — Frontend (http://localhost:3000)
pnpm dev

# Terminal 2 — Backend (http://localhost:8000)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## Commands

### Frontend

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Lint (max 10 warnings)
npx tsc --noEmit  # Type check
npx prisma studio # Open Prisma Studio (GUI)
```

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## How It Works

### Prompt Analysis Flow

1. User writes a prompt in the editor
2. Frontend sends the prompt + user profile to the backend
3. Backend constructs a structured analysis prompt using the learner's profile
4. OpenAI returns scored feedback with tags, learning points, and improved prompt suggestions
5. Frontend displays the analysis with visual scoring and ELO update

### Practice Problem Flow

1. System generates personalized problems based on user level and goals
2. Problems follow a LeetCode-style format with description, requirements, examples, and test cases
3. User writes a prompt to solve the problem
4. The prompt is analyzed and scored against the problem's criteria
5. ELO is updated; passing scores unlock the next problem

### Knowledge Base

The backend includes a compiled prompt engineering knowledge base (`backend/knowledge-base/prompt-engineering-guide.md`) sourced from the [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/prompt-engineering-guide). This reference is embedded in the problem generation prompt to ensure problems teach real concepts — zero-shot, few-shot, chain-of-thought, ReAct, RAG, and more.

## ELO & Level System

| Level        | ELO Range | Focus                                          |
| ------------ | --------- | ---------------------------------------------- |
| Beginner     | 0–1199    | Task clarity, specificity, basic structure     |
| Intermediate | 1200–1499 | Few-shot design, chain-of-thought, constraints |
| Expert       | 1500+     | Robustness, advanced techniques, evaluation    |

## Deployment

### Vercel (Frontend)

The project is configured for Vercel deployment. The build script includes `prisma generate` to ensure the Prisma client is generated during the build process.

### Backend

The FastAPI backend can be deployed separately on any platform that supports Python (Railway, Render, Fly.io, etc.).

## License

MIT
