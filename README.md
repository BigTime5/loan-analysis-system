# Loan Analysis System — CreditEngine

A production-grade, full-stack credit scoring platform built on a calibrated LightGBM probability-of-default (PD) model trained on Lending Club loan data. The system scores individual applicants and bulk CSV portfolios in real time, returning calibrated PD estimates, five-tier risk classifications, Expected Loss (EL) dollar figures, and SHAP-powered adverse action explanations that are fully compliant with FCRA and ECOA disclosure requirements.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Feature Set](#feature-set)
4. [Technology Stack](#technology-stack)
5. [Model Design](#model-design)
6. [Risk Framework](#risk-framework)
7. [Getting Started](#getting-started)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)
10. [Configuration](#configuration)
11. [Demo Mode](#demo-mode)
12. [Production Deployment Checklist](#production-deployment-checklist)
13. [Roadmap](#roadmap)

---

## Project Overview

CreditEngine addresses a core challenge in consumer lending: translating raw applicant data into a defensible, explainable credit decision within milliseconds. The platform operationalises a machine learning model as a REST API, wraps it in a polished React interface for loan officers and analysts, and produces audit-ready decision logs for every scoring event.

The system is designed for three distinct use cases:

- **Individual underwriting** — A loan officer enters applicant data through a structured form and receives an instant decision with a visual risk gauge and top-five risk-factor attribution.
- **Portfolio batch scoring** — An analyst uploads a CSV file containing hundreds or thousands of applicants and downloads a scored output file with PD, EL, risk tier, and primary adverse action reason appended to each row.
- **Model governance** — A credit risk manager reviews live model performance metrics, risk tier configuration, and system health from a dedicated Model Card page.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                         │
│   Single Score Form  │  Batch Upload  │  Model Card         │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP / REST (JSON)
┌──────────────────────────────▼──────────────────────────────┐
│                      FastAPI Backend  v2.1                    │
│  POST /score  │  POST /score/batch  │  GET /model/card       │
│  POST /auth/login  │  GET /audit  │  GET /health             │
└──────────────────────────────┬──────────────────────────────┘
                               │  pickle.load
┌──────────────────────────────▼──────────────────────────────┐
│               loan_default_model_v2.pkl  bundle              │
│  ColumnTransformer  │  LightGBM  │  CalibratedClassifier     │
│  SHAP TreeExplainer  │  Feature Columns  │  Model Card       │
└─────────────────────────────────────────────────────────────┘
                               │  SQLite
┌──────────────────────────────▼──────────────────────────────┐
│                      Audit Database                          │
│  DecisionLog  │  ContactLead  │  NewsletterSubscriber        │
└─────────────────────────────────────────────────────────────┘
```

The frontend and backend are containerised independently and orchestrated via Docker Compose. The model bundle is mounted as a read-only volume into the backend container, making model updates a single file swap with zero code changes.

---

## Feature Set

### Single Applicant Scoring

- Structured form with 25 validated input fields covering borrower profile, loan terms, and credit bureau data.
- Animated ring gauge displaying the calibrated PD percentage on submission.
- Clear decision output: APPROVE, REFER, or DECLINE.
- Expected Loss in dollars computed as `PD × LGD × EAD`.
- SHAP attribution panel showing the top five features driving the score, with direction (risk-increasing or risk-reducing) and relative magnitude.
- Adverse action notice basis, suitable for FCRA/ECOA compliance workflows.

### Batch Portfolio Scoring

- Drag-and-drop CSV upload with a live progress indicator.
- Server-side validation and sanitisation of every row before scoring.
- Summary statistics panel: aggregate Approve / Refer / Decline counts and total portfolio Expected Loss.
- Paginated results table with tier-coloured badges and decision icons.
- One-click download of the scored CSV with all original columns intact and `pd_score`, `pd_pct`, `risk_tier`, `decision`, `expected_loss`, `top_reason`, and `error` columns appended.
- Built-in CSV template generator to ensure correct column formatting.

### Model Card and Governance

- Live performance metrics (Gini, KS statistic, Brier score, calibration slope, population stability index) served directly from the model bundle.
- Benchmark comparison bars and radar chart visualisation.
- Risk tier threshold table with configurable decision boundaries.
- Training, validation, and test period details.
- System health indicator showing model load status, SHAP availability, and operating mode.

### Authentication and Audit

- JWT Bearer token authentication protecting all scoring endpoints.
- Eight-hour token expiry with configurable override via environment variable.
- SQLite audit log persisting every scoring decision with username, PD score, risk tier, decision, loan amount, Expected Loss, and UTC timestamp.
- `GET /audit` endpoint returns the 100 most recent decisions for review.

---

## Technology Stack

### Backend

| Component | Library / Version |
|-----------|-------------------|
| API framework | FastAPI >= 0.115.0 |
| ASGI server | Uvicorn (standard) >= 0.30.0 |
| Data validation | Pydantic >= 2.7.0 |
| Data processing | Pandas >= 2.2.3, NumPy >= 2.1.0 |
| Machine learning | LightGBM >= 4.5.0, scikit-learn >= 1.5.0 |
| Explainability | SHAP >= 0.46.0 |
| Authentication | python-jose[cryptography] >= 3.3.0, passlib[bcrypt] >= 1.7.4 |
| Database ORM | SQLModel >= 0.0.21, aiosqlite >= 0.20.0 |
| File upload | python-multipart >= 0.0.9 |

### Frontend

| Component | Library / Version |
|-----------|-------------------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Icons | Lucide React |
| HTTP client | Native Fetch API |

### Infrastructure

| Component | Tool |
|-----------|------|
| Containerisation | Docker |
| Orchestration | Docker Compose 3.9 |
| Database | SQLite (audit log) |

---

## Model Design

### Objective

The model estimates the probability that a given loan will default (charge-off) over its lifetime, calibrated to produce reliable probability estimates rather than raw scores. This supports both binary decision rules and continuous risk-pricing applications.

### Training Data

The model is trained on historical Lending Club origination data. The dataset covers a multi-year origination window, with a defined out-of-time validation and test split to prevent data leakage.

### Feature Engineering

The model bundle includes a `ColumnTransformer` preprocessor that handles encoding and imputation. The following engineered features are constructed from raw applicant inputs before preprocessing:

| Feature | Derivation |
|---------|------------|
| `fico_score` | Average of `fico_range_low` and `fico_range_high` |
| `log_annual_inc` | log10 of annual income (floored at 1) |
| `payment_to_income` | Monthly installment divided by monthly income |
| `loan_to_income` | Loan amount divided by annual income |
| `open_acc_ratio` | Open accounts divided by total accounts |
| `log_revol_bal` | log1p of revolving balance |
| `log_loan_amnt` | log1p of loan amount |
| `log_installment` | log1p of monthly installment |

### Model Pipeline

1. **ColumnTransformer** — applies ordinal encoding to grade/sub-grade, one-hot encoding to categorical fields, and median imputation to optional numeric fields.
2. **LightGBM Classifier** — gradient-boosted tree ensemble optimised for ranking and binary cross-entropy loss.
3. **CalibratedClassifier** — Platt scaling (sigmoid calibration) applied post-hoc to align predicted probabilities with observed default rates.

### Explainability

SHAP `TreeExplainer` is initialised at startup against the underlying LightGBM model. For every scoring request, the top five features by absolute SHAP value are returned, along with their direction of influence (risk-increasing or risk-decreasing). If the SHAP library is unavailable, the system falls back to a rule-based heuristic explanation set.

### Expected Loss Formula

```
EL = PD x LGD x EAD

Where:
  PD  = calibrated probability of default (model output)
  LGD = 0.87  (conservative empirical estimate for unsecured consumer loans)
  EAD = funded loan amount
```

The LGD constant of 87% reflects empirical recovery rates on charged-off unsecured Lending Club loans. It is configurable via the `LGD` constant in `backend/main.py`.

---

## Risk Framework

Applicants are assigned to one of five risk tiers based on the calibrated PD score. Each tier maps to a lending decision that governs straight-through processing, referral, or automatic decline.

| Tier | PD Range | Decision | Recommended Action |
|------|----------|----------|--------------------|
| Low | 0 – 10% | APPROVE | Straight-through processing at standard terms |
| Medium | 10 – 20% | APPROVE | Standard terms; monitor early payment behaviour |
| Medium-High | 20 – 30% | REFER | Manual review; consider pricing uplift |
| High | 30 – 45% | REFER | Senior credit officer sign-off required |
| Very High | > 45% | DECLINE | Automatic decline |

Thresholds are defined in `RISK_TIERS` in `backend/main.py` and can be adjusted without retraining the model.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on the host machine.
- The trained model bundle file: `loan_default_model_v2.pkl`.

### Option A — Docker Compose (Recommended)

```bash
# 1. Place the model bundle in the project root
cp /path/to/loan_default_model_v2.pkl ./loan-analysis-system/

# 2. Build and start all services
cd loan-analysis-system
docker-compose up --build

# Frontend    →  http://localhost:3000
# Backend API →  http://localhost:8000
# API docs    →  http://localhost:8000/docs
```

### Option B — Manual Local Setup

**Backend**

```bash
cd backend
pip install -r requirements.txt
cp /path/to/loan_default_model_v2.pkl .
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

The frontend will be available at `http://localhost:5173` by default when running via Vite dev server.

### Verifying the Installation

```bash
# Health check
curl http://localhost:8000/health

# Expected response (production mode)
{
  "status": "ok",
  "model_loaded": true,
  "shap_enabled": true,
  "mode": "production",
  "timestamp": "2025-01-15T09:00:00.000000"
}
```

### Running the Diagnostic Script

The `backend/diag.py` script validates the full scoring pipeline end-to-end, including model loading, feature engineering, preprocessing, single-row scoring, and batch row simulation. Run it before deploying to a new environment:

```bash
cd backend
python diag.py
```

---

## API Reference

### Authentication

#### `POST /auth/login`

Obtain a JWT Bearer token.

**Request body:**
```json
{ "username": "admin", "password": "creditengine2024" }
```

**Response:**
```json
{ "access_token": "<token>", "token_type": "bearer" }
```

Pass the token in subsequent requests as: `Authorization: Bearer <token>`

---

### Scoring

#### `POST /score`

Score a single applicant.

**Required fields (excerpt):** `loan_amnt`, `term`, `int_rate`, `installment`, `grade`, `sub_grade`, `annual_inc`, `dti`, `fico_range_low`, `fico_range_high`, `home_ownership`, `verification_status`, `purpose`

**Example response:**
```json
{
  "pd_score": 0.1823,
  "pd_pct": 18.23,
  "risk_tier": "Medium",
  "tier_color": "#f59e0b",
  "decision": "APPROVE",
  "expected_loss": 1584.41,
  "el_pct": 15.86,
  "funded_amnt": 10000,
  "lgd_assumption": 0.87,
  "shap_reasons": [
    { "feature": "FICO Credit Score",     "direction": "decreases", "magnitude": 0.0821 },
    { "feature": "Debt-to-Income Ratio",  "direction": "increases", "magnitude": 0.0512 },
    { "feature": "Interest Rate",         "direction": "increases", "magnitude": 0.0344 },
    { "feature": "Revolving Utilisation", "direction": "increases", "magnitude": 0.0211 },
    { "feature": "Annual Income",         "direction": "decreases", "magnitude": 0.0188 }
  ],
  "scored_at": "2025-01-15T09:23:11.042Z",
  "model_version": "2.0"
}
```

---

#### `POST /score/batch`

Score a CSV file of applicants. Returns JSON with a `results` array.

**Required CSV columns (minimum):**
```
loan_amnt, term, int_rate, installment, grade, sub_grade, annual_inc,
home_ownership, verification_status, dti, fico_range_low, fico_range_high,
pub_rec, purpose
```

**Appended output columns:**
```
pd_score, pd_pct, risk_tier, decision, expected_loss, top_reason, error
```

---

#### `POST /score/batch/csv`

Identical to `POST /score/batch` but streams the scored output directly as a downloadable CSV file.

---

### System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API root and version info | No |
| GET | `/health` | Model load status and system mode | No |
| GET | `/model/card` | Full model card from bundle | No |
| GET | `/audit` | Last 100 scoring decisions | No |
| POST | `/api/contact` | Submit a contact or demo request | No |
| POST | `/api/subscribe` | Newsletter subscription | No |

Interactive API documentation is available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc).

---

## Project Structure

```
loan-analysis-system/
├── backend/
│   ├── main.py                   # FastAPI application, scoring logic, API endpoints
│   ├── diag.py                   # End-to-end diagnostic and validation script
│   ├── loan_default_model_v2.pkl # Trained model bundle (not included in repo)
│   ├── requirements.txt          # Python dependencies
│   ├── test_batch.py             # Batch endpoint test harness
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Root component and routing
│   │   ├── components/           # Page-level and UI components
│   │   └── App.css
│   ├── public/
│   │   ├── images/               # Static image assets
│   │   └── creditengine.html     # Landing page
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile (via node:20-alpine in compose)
├── LoanDefaultProbability_v2.ipynb  # Model development notebook
├── docker-compose.yml
└── README.md
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | Auto-generated hex | JWT signing key — always override in production |
| `TOKEN_EXPIRE_MINUTES` | `480` | JWT token lifetime in minutes (default: 8 hours) |
| `FRONTEND_URL` | `*` | Allowed CORS origin — set to your domain in production |
| `MODEL_PATH` | `loan_default_model_v2.pkl` | Path to the model bundle file |
| `DATABASE_URL` | `sqlite:///./audit.db` | SQLAlchemy connection string for audit database |
| `ADMIN_USER` | `admin` | Default admin username |
| `ADMIN_PASS` | `creditengine2024` | Default admin password — always override in production |
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL for the frontend build |

### Risk Tier Thresholds

Risk tier boundaries are defined as a list of `(threshold, tier_name, hex_color, decision)` tuples in `RISK_TIERS` within `backend/main.py`. To adjust any threshold, modify the relevant tuple and restart the backend — no model retraining is required.

### LGD Override

The Loss Given Default assumption used in Expected Loss calculations is the `LGD` constant in `backend/main.py`. Replace the default value of `0.87` with an institution-specific estimate as appropriate.

---

## Demo Mode

If `loan_default_model_v2.pkl` is not present at the configured path, the backend starts in **demo mode**. In this mode:

- All API endpoints remain fully functional.
- Scores are generated from a rule-based heuristic derived from FICO score, DTI, and public derogatory records, with a small random perturbation.
- The `/health` endpoint returns `"mode": "demo"`.
- The Model Card page displays a "Demo Mode" indicator.

Demo mode allows the full application to be evaluated and demonstrated without access to the proprietary model bundle.

---

## Production Deployment Checklist

Before deploying to a production environment, complete the following steps:

- Copy `loan_default_model_v2.pkl` into the project root.
- Set `SECRET_KEY` to a cryptographically random value (minimum 32 bytes).
- Override `ADMIN_USER` and `ADMIN_PASS` with strong, unique credentials.
- Set `FRONTEND_URL` to the exact origin of the production frontend (no wildcard).
- Set `VITE_API_URL` in the frontend `.env.production` file to the production API domain.
- Enable HTTPS via a reverse proxy (nginx or Caddy recommended).
- Schedule monthly PSI monitoring by calling `GET /model/card` and comparing `reference_score_distribution` against the current month's cohort.
- Review and extend the users database (`USERS_DB`) or replace with a persistent user store for multi-user deployments.
- Consider replacing the SQLite audit database with PostgreSQL for high-throughput environments.

---

## Roadmap

The following enhancements are planned for future releases:

1. **LGD Model** — Replace the fixed 87% assumption with a regression model that produces loan-type-specific LGD estimates, enabling more precise Expected Loss calculations.
2. **PSI Monitoring Dashboard** — A live drift monitoring tab that computes the Population Stability Index across weekly scoring cohorts and raises alerts when drift exceeds a configurable threshold.
3. **Stress Testing Module** — Apply macro-economic scenario overlays (recession, rate shock, unemployment spike) to a scored portfolio and report the change in aggregate Expected Loss.
4. **Role-Based Access Control** — Distinguish between loan officer (scoring only), analyst (batch + audit), and administrator (model card + configuration) roles with granular endpoint permissions.
5. **LGD and EAD Parameter API** — Expose LGD and EAD overrides as request-level parameters in the scoring endpoints, enabling scenario analysis without backend changes.
6. **Persistent User Management** — Replace the in-memory user dictionary with a database-backed user store supporting password hashing, account lockout, and audit trail for authentication events.

---

## License

This project is proprietary. All rights reserved. Redistribution or use in any form without written permission is prohibited.

---

## Contact

To request a demonstration or discuss integration options, submit an enquiry via the contact form at the application frontend or use the `POST /api/contact` endpoint directly.
