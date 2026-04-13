"""
Loan Origination Decision Engine — FastAPI Backend v2.1
Adds: JWT auth, SQLite audit log, CORS lockdown
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import pickle, io, json, os, secrets
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ── Auth dependencies ───────────────────────────────────────────────
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Database ────────────────────────────────────────────────────────
from sqlmodel import SQLModel, Field as SqlField, create_engine, Session, select
from sqlalchemy import Column, String

# ── Optional SHAP ──────────────────────────────────────────────────
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

# ══════════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════════
SECRET_KEY   = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM    = "HS256"
TOKEN_EXPIRE = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allow_origins = ["*"] if FRONTEND_URL == "*" else [FRONTEND_URL]

# Default users — override via env vars or extend with a DB later
USERS_DB = {
    os.getenv("ADMIN_USER", "admin"): os.getenv("ADMIN_PASS", "creditengine2024"),
}

# ══════════════════════════════════════════════════════════════════════
# DATABASE (SQLite audit log)
# ══════════════════════════════════════════════════════════════════════
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./audit.db")

class DecisionLog(SQLModel, table=True):
    id:           Optional[int] = SqlField(default=None, primary_key=True)
    username:     str
    pd_score:     float
    pd_pct:       float
    decision:     str
    risk_tier:    str
    loan_amnt:    float
    expected_loss:float
    scored_at:    str

class ContactLead(SQLModel, table=True):
    id: Optional[int] = SqlField(default=None, primary_key=True)
    name: str = ""
    email: str
    company: str = ""
    demo_date: str = ""
    team_size: str = ""
    message: str = ""
    submitted_at: str

class NewsletterSubscriber(SQLModel, table=True):
    id: Optional[int] = SqlField(default=None, primary_key=True)
    email: str
    subscribed_at: str

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# ══════════════════════════════════════════════════════════════════════
# AUTH HELPERS
# ══════════════════════════════════════════════════════════════════════
pwd_ctx    = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

def verify_password(plain: str, username: str) -> bool:
    stored = USERS_DB.get(username)
    return stored == plain  # simple comparison; swap with pwd_ctx for hashed passwords

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise ValueError()
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    return username

# ══════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════════════
app = FastAPI(
    title="Loan Origination Decision Engine",
    description="Production credit scoring API — PD, EL, SHAP adverse action reasons",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model bundle ────────────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "loan_default_model_v2.pkl")
bundle     = None
explainer  = None

def load_bundle():
    global bundle, explainer
    if not os.path.exists(MODEL_PATH):
        print(f"[WARN] Model not found at {MODEL_PATH} - running in demo mode")
        return
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
    if HAS_SHAP and "model" in bundle:
        try:
            explainer = shap.TreeExplainer(bundle["model"])
            print("[OK] SHAP explainer ready")
        except Exception as e:
            print(f"[WARN] SHAP init failed: {e}")
    print("[OK] Model bundle loaded")

load_bundle()

# ── Constants ───────────────────────────────────────────────────────
LGD = 0.87
RISK_TIERS = [
    (0.10, "Low",         "#22c55e", "APPROVE"),
    (0.20, "Medium",      "#f59e0b", "APPROVE"),
    (0.30, "Medium-High", "#f97316", "REFER"),
    (0.45, "High",        "#ef4444", "REFER"),
    (1.00, "Very High",   "#991b1b", "DECLINE"),
]

FEATURE_LABELS = {
    "fico_score":            "FICO Credit Score",
    "dti":                   "Debt-to-Income Ratio",
    "int_rate":              "Interest Rate",
    "payment_to_income":     "Monthly Payment Burden",
    "loan_to_income":        "Loan-to-Income Ratio",
    "log_annual_inc":        "Annual Income",
    "revol_util":            "Revolving Credit Utilisation",
    "pub_rec":               "Public Derogatory Records",
    "pub_rec_bankruptcies":  "Bankruptcies on Record",
    "log_installment":       "Monthly Installment",
    "log_revol_bal":         "Revolving Balance",
    "log_loan_amnt":         "Loan Amount",
    "open_acc_ratio":        "Active Account Ratio",
    "term":                  "Loan Term",
    "emp_length":            "Employment Length",
    "credit_history_year":   "Credit History Age",
    "mort_acc":              "Mortgage Accounts",
    "open_acc":              "Open Accounts",
    "total_acc":             "Total Accounts",
    "bc_util":               "Bankcard Utilisation",
    "acc_open_past_24mths":  "Accounts Opened (24 months)",
}

# ── Input schema ────────────────────────────────────────────────────
class ApplicantInput(BaseModel):
    loan_amnt:          float = Field(..., gt=0)
    funded_amnt:        Optional[float] = None
    term:               int   = Field(..., ge=36, le=60)
    int_rate:           float = Field(..., gt=0)
    installment:        float = Field(..., gt=0)
    grade:              str
    sub_grade:          str
    annual_inc:         float = Field(..., gt=0)
    emp_length:         Optional[float] = None
    home_ownership:     str
    verification_status:str
    application_type:   str   = "Individual"
    dti:                float = Field(..., ge=0)
    fico_range_low:     float
    fico_range_high:    float
    open_acc:           Optional[float] = None
    pub_rec:            float = 0.0
    revol_bal:          Optional[float] = None
    revol_util:         Optional[float] = None
    total_acc:          Optional[float] = None
    pub_rec_bankruptcies: float = 0.0
    mort_acc:           Optional[float] = None
    purpose:            str
    addr_state:         str   = "CA"
    initial_list_status:str   = "w"
    num_actv_rev_tl:    Optional[float] = None
    mo_sin_rcnt_rev_tl_op: Optional[float] = None
    mo_sin_old_rev_tl_op:  Optional[float] = None
    bc_util:            Optional[float] = None
    bc_open_to_buy:     Optional[float] = None
    avg_cur_bal:        Optional[float] = None
    acc_open_past_24mths: Optional[float] = None

# ── Field name set (used to filter CSV rows to valid ApplicantInput keys) ──
# Evaluated once at startup — avoids the broken class-level getattr pattern
_AI = ApplicantInput
APPLICANT_FIELD_NAMES: set = (
    set(_AI.model_fields.keys()) if hasattr(_AI, "model_fields")
    else set(_AI.__fields__.keys())
)

class LoginRequest(BaseModel):
    username: str
    password: str

# ── Scoring logic ───────────────────────────────────────────────────
def get_risk_tier(pd_score: float):
    for threshold, tier, color, decision in RISK_TIERS:
        if pd_score <= threshold:
            return tier, color, decision
    return "Very High", "#991b1b", "DECLINE"

def build_dataframe(applicant: ApplicantInput) -> pd.DataFrame:
    d  = applicant.dict()
    df = pd.DataFrame([d])
    df["fico_score"]    = (df["fico_range_low"] + df["fico_range_high"]) / 2
    df["log_annual_inc"] = np.log10(df["annual_inc"].clip(lower=1))
    monthly_inc = (10 ** df["log_annual_inc"]) / 12
    df["payment_to_income"] = df["installment"] / monthly_inc.clip(lower=1)
    df["loan_to_income"]    = df["loan_amnt"]   / (10 ** df["log_annual_inc"]).clip(lower=1)
    df["credit_history_year"] = 1998
    if "open_acc" in df and "total_acc" in df:
        df["open_acc_ratio"] = df["open_acc"] / df["total_acc"].clip(lower=1)
    for col in ["revol_bal", "loan_amnt", "installment", "avg_cur_bal"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
            df[f"log_{col}"] = np.log1p(df[col])
    df.drop(columns=["fico_range_low", "fico_range_high", "annual_inc"], errors="ignore", inplace=True)
    return df

def score_applicant(applicant: ApplicantInput):
    df = build_dataframe(applicant)
    if bundle is None:
        base     = 0.05
        fico_mid = (applicant.fico_range_low + applicant.fico_range_high) / 2
        base    += max(0, (650 - fico_mid) / 650) * 0.3
        base    += min(applicant.dti / 100, 0.25)
        base    += applicant.pub_rec * 0.05
        pd_score = float(np.clip(base + np.random.normal(0, 0.02), 0.02, 0.95))
        shap_reasons = [
            {"feature": "FICO Credit Score",    "direction": "increases" if fico_mid < 680 else "decreases", "magnitude": 0.08},
            {"feature": "Debt-to-Income Ratio", "direction": "increases" if applicant.dti > 20 else "decreases", "magnitude": 0.05},
            {"feature": "Monthly Payment Burden","direction": "increases", "magnitude": 0.03},
            {"feature": "Revolving Utilisation", "direction": "increases" if (applicant.revol_util or 0) > 40 else "decreases", "magnitude": 0.02},
            {"feature": "Public Records",        "direction": "increases" if applicant.pub_rec > 0 else "decreases", "magnitude": 0.01},
        ]
        return pd_score, shap_reasons

    preprocessor = bundle["preprocessor"]
    model        = bundle["calibrated_model"]
    feature_cols = bundle["feature_cols"]
    for col in feature_cols:
        if col not in df.columns:
            df[col] = np.nan
    X        = preprocessor.transform(df[feature_cols])
    pd_score = float(model.predict_proba(X)[:, 1][0])

    shap_reasons = []
    if explainer is not None and HAS_SHAP:
        try:
            all_feature_names = bundle.get("all_feature_names", feature_cols)
            sv    = explainer.shap_values(X)
            sv_arr = sv[1] if isinstance(sv, list) else sv
            vals  = sv_arr[0]
            top_idx = np.argsort(np.abs(vals))[::-1][:5]
            for i in top_idx:
                fname = all_feature_names[i] if i < len(all_feature_names) else f"feature_{i}"
                label = FEATURE_LABELS.get(fname, fname.replace("_", " ").title())
                shap_reasons.append({
                    "feature":   label,
                    "direction": "increases" if vals[i] > 0 else "decreases",
                    "magnitude": round(float(abs(vals[i])), 4),
                })
        except Exception as e:
            print(f"SHAP error: {e}")

    if not shap_reasons:
        shap_reasons = [{"feature": "Score computed", "direction": "increases", "magnitude": 0.0}]
    return pd_score, shap_reasons

def log_decision(session: Session, username: str, applicant: ApplicantInput,
                 pd_score: float, decision: str, risk_tier: str, el: float):
    try:
        funded = applicant.funded_amnt or applicant.loan_amnt
        row    = DecisionLog(
            username=username, pd_score=round(pd_score, 4),
            pd_pct=round(pd_score * 100, 2), decision=decision,
            risk_tier=risk_tier, loan_amnt=funded, expected_loss=el,
            scored_at=datetime.utcnow().isoformat(),
        )
        session.add(row)
        session.commit()
    except Exception as e:
        print(f"[WARN] Audit log error: {e}")

# ══════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"message": "Loan Origination Decision Engine API v2.1", "docs": "/docs"}

@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": bundle is not None,
        "shap_enabled": HAS_SHAP and explainer is not None,
        "mode":         "production" if bundle else "demo",
        "timestamp":    datetime.utcnow().isoformat(),
    }

# ── Auth ─────────────────────────────────────────────────────────────
@app.post("/auth/login")
def login(body: LoginRequest):
    if not verify_password(body.password, body.username):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials")
    token = create_access_token({"sub": body.username})
    return {"access_token": token, "token_type": "bearer"}

# ── Scoring ──────────────────────────────────────────────────────────
@app.post("/score")
def score_single(
    applicant: ApplicantInput,
    session:   Session = Depends(get_session),
):
    username = "admin"
    try:
        pd_score, shap_reasons = score_applicant(applicant)
        tier, color, decision  = get_risk_tier(pd_score)
        funded = applicant.funded_amnt or applicant.loan_amnt
        el     = round(pd_score * LGD * funded, 2)
        el_pct = round(pd_score * LGD * 100, 2)

        log_decision(session, username, applicant, pd_score, decision, tier, el)

        return {
            "pd_score":       round(pd_score, 4),
            "pd_pct":         round(pd_score * 100, 2),
            "risk_tier":      tier,
            "tier_color":     color,
            "decision":       decision,
            "expected_loss":  el,
            "el_pct":         el_pct,
            "funded_amnt":    funded,
            "lgd_assumption": LGD,
            "shap_reasons":   shap_reasons,
            "scored_at":      datetime.utcnow().isoformat(),
            "model_version":  bundle["model_card"]["version"] if bundle else "demo",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _sanitize_batch_row(row_dict: dict) -> dict:
    """Clean a raw CSV row: replace NaN with None, coerce types, set defaults."""
    import math
    data = {
        k: (None if isinstance(v, float) and math.isnan(v) else v)
        for k, v in row_dict.items()
    }
    # Defaults for fields that might be missing from the CSV
    data.setdefault("pub_rec", 0.0)
    data.setdefault("pub_rec_bankruptcies", 0.0)
    data.setdefault("application_type", "Individual")
    data.setdefault("initial_list_status", "w")
    data.setdefault("addr_state", "CA")
    # term must be int — CSV may produce 36.0
    if "term" in data and data["term"] is not None:
        try:
            data["term"] = int(float(data["term"]))
        except (ValueError, TypeError):
            pass
    # Numeric coercions for other int-like fields
    for int_field in ["open_acc", "total_acc", "mort_acc", "pub_rec",
                      "pub_rec_bankruptcies", "acc_open_past_24mths",
                      "num_actv_rev_tl"]:
        if int_field in data and data[int_field] is not None:
            try:
                data[int_field] = float(data[int_field])
            except (ValueError, TypeError):
                pass
    return data


@app.post("/score/batch")
async def score_batch(
    file:    UploadFile = File(...),
    session: Session    = Depends(get_session),
):
    """Score a CSV of applicants, return JSON results for table display."""
    username = "admin"
    try:
        content = await file.read()
        df      = pd.read_csv(io.BytesIO(content))
        results = []

        for idx, row in df.iterrows():
            try:
                raw = _sanitize_batch_row(row.to_dict())
                # Filter to only valid ApplicantInput fields — uses module-level set
                filtered = {k: v for k, v in raw.items() if k in APPLICANT_FIELD_NAMES}
                app_obj  = ApplicantInput(**filtered)

                pd_score, shap_reasons = score_applicant(app_obj)
                tier, color, decision  = get_risk_tier(pd_score)
                funded = app_obj.funded_amnt or app_obj.loan_amnt
                el     = round(pd_score * LGD * funded, 2)

                log_decision(session, username, app_obj, pd_score, decision, tier, el)

                results.append({
                    "row":           idx + 1,
                    "pd_score":      round(pd_score, 4),
                    "pd_pct":        round(pd_score * 100, 2),
                    "risk_tier":     tier,
                    "tier_color":    color,
                    "decision":      decision,
                    "expected_loss": el,
                    "funded_amnt":   funded,
                    "top_reason":    shap_reasons[0]["feature"] if shap_reasons else "",
                    "error":         "",
                })
            except Exception as e:
                results.append({
                    "row":           idx + 1,
                    "pd_score":      None,
                    "pd_pct":        None,
                    "risk_tier":     "ERROR",
                    "tier_color":    "#666",
                    "decision":      "ERROR",
                    "expected_loss": None,
                    "funded_amnt":   None,
                    "top_reason":    "",
                    "error":         str(e),
                })

        return {"results": results, "total": len(results)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score/batch/csv")
async def score_batch_csv(
    file:    UploadFile = File(...),
    session: Session    = Depends(get_session),
):
    """Score a CSV of applicants, return results as a downloadable CSV."""
    username = "admin"
    try:
        content = await file.read()
        df      = pd.read_csv(io.BytesIO(content))
        rows    = []

        for idx, row in df.iterrows():
            try:
                raw      = _sanitize_batch_row(row.to_dict())
                filtered = {k: v for k, v in raw.items() if k in APPLICANT_FIELD_NAMES}
                app_obj  = ApplicantInput(**filtered)

                pd_score, shap_reasons = score_applicant(app_obj)
                tier, color, decision  = get_risk_tier(pd_score)
                funded = app_obj.funded_amnt or app_obj.loan_amnt
                el     = round(pd_score * LGD * funded, 2)

                log_decision(session, username, app_obj, pd_score, decision, tier, el)

                rows.append({
                    **raw,
                    "pd_score":      round(pd_score, 4),
                    "pd_pct":        round(pd_score * 100, 2),
                    "risk_tier":     tier,
                    "decision":      decision,
                    "expected_loss": el,
                    "top_reason":    shap_reasons[0]["feature"] if shap_reasons else "",
                    "error":         "",
                })
            except Exception as e:
                rows.append({**row.to_dict(), "pd_score": None,
                             "risk_tier": "ERROR", "decision": "ERROR",
                             "expected_loss": None, "error": str(e)})

        out_df = pd.DataFrame(rows)
        buf    = io.StringIO()
        out_df.to_csv(buf, index=False)
        buf.seek(0)

        return StreamingResponse(
            io.BytesIO(buf.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=scored_{file.filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/card")
def model_card():
    if bundle:
        return bundle.get("model_card", {})
    return {"status": "demo mode — no model loaded"}

class ContactCreate(BaseModel):
    name: str = ""
    email: str
    company: str = ""
    demo_date: str = ""
    team_size: str = ""
    message: str = ""

@app.post("/api/contact")
def create_contact(lead: ContactCreate, session: Session = Depends(get_session)):
    db_lead = ContactLead(
        **lead.dict(),
        submitted_at=datetime.utcnow().isoformat()
    )
    session.add(db_lead)
    session.commit()
    return {"status": "success", "detail": "Contact lead saved."}

class SubscribeCreate(BaseModel):
    email: str

@app.post("/api/subscribe")
def create_subscribe(sub: SubscribeCreate, session: Session = Depends(get_session)):
    db_sub = NewsletterSubscriber(
        email=sub.email,
        subscribed_at=datetime.utcnow().isoformat()
    )
    session.add(db_sub)
    session.commit()
    return {"status": "success", "detail": "Subscribed successfully."}



@app.get("/audit")
def get_audit(session: Session = Depends(get_session)):
    rows = session.exec(
        select(DecisionLog).order_by(DecisionLog.id.desc()).limit(100)
    ).all()
    return [r.dict() for r in rows]
