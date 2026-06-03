# Promptr

**The prompt engineering & evaluation platform for AI agent builders.** Practice with curated missions, stress-test your prompts against adversarial scenarios, and level up through a progressive curriculum — from greeting bots to self-evaluating meta-agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

Promptr teaches prompt engineering through hands-on practice, not passive tips:

- **25 Curated Missions** — Five progressive levels covering agent basics, tool use, workflow control, guardrails, and evaluation. Each mission includes realistic tools, workflow rules, and adversarial test cases.
- **Scenario-Based Evaluation** — Every prompt is stress-tested against tool-use correctness, workflow sequencing, guardrail enforcement, and prompt injection resistance.
- **Rewrite Coaching** — Get scored feedback (STRONG / MODERATE / WEAK), see a stronger version of your prompt, and learn exactly why the patch improves reliability.
- **Progressive Curriculum** — Start with basic persona control and output formatting. Finish writing meta-agents that generate evaluation test cases for other agents' prompts.

## Mission Curriculum

| Level | Track | What You Learn |
|-------|-------|----------------|
| 1 | Agent Basics | Persona, constraints, output formatting, refusal boundaries |
| 2 | Tool Use | When to call tools, input validation, confirmation gates |
| 3 | Workflow Control | Multi-step pipelines, fail-fast behavior, error recovery |
| 4 | Guardrails | Prompt injection defense, PII protection, RBAC, rate limits |
| 5 | Evals | Confidence calibration, fact-checking, reasoning audit trails |

## Tech Stack

### Frontend

- **Next.js 14** (App Router) — React framework with server components
- **TypeScript** — Strict mode, functional components
- **Tailwind CSS** + **shadcn/ui** — Styling and UI primitives
- **NextAuth v5** — Authentication (GitHub OAuth + credentials)
- **Vercel AI SDK** — Streaming AI responses

### Backend

- **FastAPI** — Python REST API
- **Google Gemini** (`gemini-2.0-flash`) — AI analysis and evaluation
- **Pydantic** — Request/response validation
- **uv** — Fast Python package management

### Database

- **MongoDB** — Primary database
- **Prisma ORM** — Type-safe database client

## Architecture

```
User → Next.js Frontend (App Router)
     → Server Action / API Route
     → FastAPI Backend (POST /analyze-prompt, /generate-problems)
     → Google Gemini API
     → Structured JSON response
     → Frontend renders feedback + scoring
```

## Project Structure

```
promptr/
├── backend/                        # FastAPI + Google Gemini AI
│   ├── main.py                     # FastAPI app entry
│   ├── routers/analysis.py         # /analyze-prompt & /generate-problems routes
│   ├── services/llm_service.py     # AI service (prompt analysis + problem generation)
│   ├── schemas/                    # Pydantic models
│   ├── tests/                      # pytest test suite
│   ├── Makefile                    # install, test, format, lint commands
│   └── knowledge-base/             # Prompt engineering reference
├── prisma/
│   └── schema.prisma               # MongoDB + Prisma schema
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── dashboard/              # Main practice interface
│   │   ├── playground/             # Agent sandbox playground
│   │   ├── profile/                # User profile & stats
│   │   ├── onboarding/             # Initial user setup
│   │   └── api/                    # API route handlers
│   ├── components/                 # Shared UI components
│   ├── data/                       # Curated mission data & static data
│   ├── types/                      # TypeScript interfaces (AgentMission, etc.)
│   ├── actions/                    # Next.js Server Actions
│   ├── lib/                        # Prisma client, utilities
│   └── styles/                     # Global CSS
├── auth.ts                         # NextAuth v5 configuration
├── middleware.ts                   # Route protection
├── AGENTS.md                       # Guide for agentic coding agents
└── next.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Python 3.10+
- MongoDB (local or Atlas)
- Google Gemini API key

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable                       | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`                 | MongoDB connection string                                 |
| `AUTH_SECRET`                  | NextAuth secret (`openssl rand -base64 32`)               |
| `GITHUB_CLIENT_ID`             | GitHub OAuth App client ID                                |
| `GITHUB_CLIENT_SECRET`         | GitHub OAuth App client secret                            |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key (frontend AI SDK)                   |
| `api_key` (backend `.env`)     | Google Gemini API key for FastAPI backend                 |

### Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend
# Recommended: Install uv (https://astral.sh/uv)
curl -LsSf https://astral.sh/uv/install.sh | sh
make install
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Run the App

```bash
# Terminal 1 — Frontend (http://localhost:3000)
pnpm dev

# Terminal 2 — Backend (http://localhost:8000)
cd backend
make install
uv run uvicorn main:app --reload --port 8000
```

## Commands

### Frontend

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Lint (max 10 warnings)
npx tsc --noEmit  # Type check
pnpm test         # Run vitest test suite
```

### Backend

```bash
cd backend
make install      # Install/Sync dependencies
make test         # Run pytest suite
make format       # Format code with ruff
make lint         # Lint and fix with ruff
make check-lint   # Check lint without fixing
```

## Testing & CI/CD

### Frontend Tests

The frontend uses **Vitest** + **React Testing Library** for component tests located in `src/components/__tests__/`.

### Backend Tests

The backend uses **pytest** with mocked Gemini API calls. Tests are in `backend/tests/`.

### CI/CD Pipeline

GitHub Actions (`.github/workflows/backend.yml`) runs formatting, linting, and tests on every push to `main`.

## Contributing

Promptr is MIT-licensed and welcomes contributions. Whether it's new missions, UI improvements, or evaluation logic — open a PR or an issue.

```bash
# Fork the repo, then:\ngit clone https://github.com/YOUR_USERNAME/promptr.git
cd promptr
pnpm install
pnpm dev
```

## License

MIT
