# CreditEngine — Loan Origination Decision System

A production-grade credit scoring application built on the Lending Club PD model.
Scores single applicants and batches. Returns calibrated PD, Expected Loss, risk tier, and SHAP-powered adverse action reasons.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│   Single Score   │   Batch Upload   │   Model Card       │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / REST
┌───────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                        │
│  POST /score  │  POST /score/batch  │  GET /model/card   │
└───────────────────────────┬─────────────────────────────┘
                            │ pickle.load
┌───────────────────────────▼─────────────────────────────┐
│              loan_default_model_v2.pkl                    │
│  preprocessor │ LightGBM │ CalibratedModel │ SHAP        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
# 1. Copy your model bundle into the project root
cp /path/to/loan_default_model_v2.pkl ./loan-engine/

# 2. Start everything
cd loan-engine
docker-compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# API Docs → http://localhost:8000/docs
```

### Option B — Manual

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

---

## Features

### Single Applicant Scoring
- Full applicant form with 25 input fields
- Instant PD score with animated ring gauge
- Decision: APPROVE / REFER / DECLINE
- Expected Loss in dollars (PD × LGD × EAD)
- SHAP attribution bars — top 5 risk factors with direction
- Regulatory adverse action notice basis (FCRA/ECOA)

### Batch Scoring
- Drag-and-drop CSV upload
- Progress bar during scoring
- Summary stats: Approve/Refer/Decline counts + total portfolio EL
- Results table with tier badges and decision icons
- Download scored CSV
- Template CSV generator

### Model Card
- Live performance metrics from model bundle
- Benchmark comparison bars
- Radar chart: Gini, KS, Calibration, Stability, Coverage
- Risk tier configuration table
- Training/validation/test period details
- System health indicator

---

## API Reference

### `POST /score`
Score a single applicant.

**Request body:** `ApplicantInput` (see `/docs` for full schema)

**Response:**
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
    { "feature": "FICO Credit Score",    "direction": "decreases", "magnitude": 0.0821 },
    { "feature": "Debt-to-Income Ratio", "direction": "increases", "magnitude": 0.0512 },
    { "feature": "Interest Rate",        "direction": "increases", "magnitude": 0.0344 },
    { "feature": "Revolving Utilisation","direction": "increases", "magnitude": 0.0211 },
    { "feature": "Annual Income",        "direction": "decreases", "magnitude": 0.0188 }
  ],
  "scored_at": "2025-01-15T09:23:11.042Z",
  "model_version": "2.0"
}
```

### `POST /score/batch`
Score a CSV file. Returns enriched CSV with scoring columns appended.

**Required CSV columns:**
`loan_amnt, term, int_rate, installment, grade, sub_grade, annual_inc,
home_ownership, verification_status, dti, fico_range_low, fico_range_high,
pub_rec, purpose`

**Added columns in output:**
`pd_score, pd_pct, risk_tier, decision, expected_loss, top_reason, error`

### `GET /health`
Returns model load status, SHAP availability, and mode (production/demo).

### `GET /model/card`
Returns full model card from the pkl bundle.

---

## Risk Tier Logic

| Tier        | PD Range  | Decision | Use Case                        |
|-------------|-----------|----------|---------------------------------|
| Low         | 0–10%     | APPROVE  | Straight-through processing     |
| Medium      | 10–20%    | APPROVE  | Standard terms                  |
| Medium-High | 20–30%    | REFER    | Manual review, pricing uplift   |
| High        | 30–45%    | REFER    | Senior credit officer sign-off  |
| Very High   | 45%+      | DECLINE  | Automatic decline               |

These thresholds are configurable in `backend/main.py` → `RISK_TIERS`.

---

## Demo Mode
If `loan_default_model_v2.pkl` is not found, the backend runs in **demo mode** — generating synthetic scores from a rule-based heuristic (FICO, DTI, public records). All API endpoints remain functional. The Model Card page shows "Demo Mode" in the health strip.

---

## Expected Loss Formula
```
EL = PD × LGD × EAD
   = pd_score × 0.87 × funded_amnt
```
LGD of 87% is the conservative empirical estimate for unsecured Lending Club loans.
Override via `LGD` constant in `backend/main.py`.

---

## Production Checklist
- [ ] Copy `loan_default_model_v2.pkl` into project root before deploying
- [ ] Set `VITE_API_URL` to your production API domain in frontend `.env`
- [ ] Add authentication middleware to FastAPI (JWT recommended)
- [ ] Configure CORS `allow_origins` to your domain only
- [ ] Set up PSI monitoring — call `GET /model/card` and compare reference scores monthly
- [ ] Enable HTTPS via reverse proxy (nginx / Caddy)

---

## Roadmap
1. **Authentication** — JWT login, role-based access (loan officer vs. analyst)
2. **Audit log** — persist every scoring decision with timestamp and inputs
3. **LGD model** — replace fixed 87% with a regression model per loan type
4. **Stress testing** — apply macro scenarios (recession, rate shock) to portfolio EL
5. **PSI dashboard** — live drift monitoring tab with weekly cohort comparisons
# loan-analysis-system
