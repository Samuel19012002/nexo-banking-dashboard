# Nexo Banking Dashboard

Nexo is a separated full-stack business-banking demonstration. The repository contains an independent Next.js frontend and a Python API backed by PostgreSQL.

> All accounts, balances, recipients, and transactions are fictional. No real money is moved.

## Architecture

```text
Browser
  │
  ▼
frontend/  Next.js 16 + React + TypeScript
  │ HTTP/JSON
  ▼
backend/   FastAPI + SQLAlchemy
  │ SQL
  ▼
PostgreSQL 17
```

Payments are validated by FastAPI, saved in PostgreSQL, added to the transaction history, and deducted from the selected account inside one database transaction.

## Project structure

```text
.
├── frontend/              # Next.js application
│   ├── src/app/           # Dashboard routes
│   ├── src/components/    # Interactive UI
│   ├── src/lib/           # API configuration
│   └── src/types/         # API contracts
├── backend/
│   ├── app/main.py        # FastAPI application
│   ├── app/models.py      # SQLAlchemy models
│   ├── app/routers/       # Accounts, transactions, payments
│   ├── app/schemas.py     # Pydantic request/response models
│   └── app/seed.py        # Realistic demonstration data
└── docker-compose.yml     # PostgreSQL and API services
```

## Run the complete application

### 1. Start PostgreSQL and FastAPI

Docker Desktop must be running.

```bash
docker compose up --build
```

The API runs at [http://localhost:8000](http://localhost:8000), with interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

PostgreSQL is exposed to the host on port `5433` to avoid conflicting with an existing local PostgreSQL instance. Services inside Compose continue using `db:5432`.

### 2. Start the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service health |
| `GET` | `/api/accounts` | PostgreSQL-backed account balances |
| `POST` | `/api/accounts` | Create and persist a demo bank account |
| `GET` | `/api/transactions` | Searchable transaction history |
| `GET` | `/api/payments` | Recent persisted payments |
| `POST` | `/api/payments` | Validate and persist a payment |

The transaction endpoint supports optional `search`, `status`, and `category` query parameters.

## Frontend checks

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Backend checks

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m compileall -q app
.venv/bin/python -m pip check
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -q
```

The automated API tests use an isolated SQLite database for speed and verify the same SQLAlchemy models and FastAPI routes. The running application uses PostgreSQL through `DATABASE_URL`.

## Features

- Responsive cash overview and account summaries
- PostgreSQL-backed account and transaction screens
- Search, combined filters, sorting, empty states, and transaction details
- Multi-step payment flow with client and server validation
- Atomic balance updates and persisted payment transactions
- Functional account creation, CSV export, receipts, and issue reporting
- Interactive cash-flow and account-activity period controls
- Loading, API-error, review, and success states
- Mobile navigation and responsive layouts

## AI-assisted development

OpenAI Codex was used for product scoping, architecture, frontend implementation, FastAPI and PostgreSQL integration, sample-data creation, and quality assurance. The work was reviewed using TypeScript compilation, ESLint, production builds, Python compilation, dependency checks, and browser testing.

## Deployment approach

- Frontend: Vercel
- Backend: Render, Railway, Fly.io, or another Python container host
- Database: managed PostgreSQL from the chosen backend provider

Set `NEXT_PUBLIC_API_URL` in the frontend deployment and `DATABASE_URL` plus `FRONTEND_ORIGIN` in the backend deployment.
