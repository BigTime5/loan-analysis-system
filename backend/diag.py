"""
Clean ASCII diagnostic - no unicode symbols.
Run: .\\venv\\Scripts\\python.exe diag.py
"""
import sys, io, math
import numpy as np
import pandas as pd
import pickle

MODEL_PATH = "loan_default_model_v2.pkl"
LGD = 0.87

# ── 1. Load model ─────────────────────────────────────────────────────
print("=== Loading model ===")
try:
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
    print("OK  Model loaded. Keys:", list(bundle.keys()))
    feature_cols = bundle.get("feature_cols", [])
    print("OK  feature_cols count:", len(feature_cols))
    print("    feature_cols:", feature_cols)
except Exception as e:
    print("ERR  Failed to load model:", e)
    sys.exit(1)

# ── 2. Build test row exactly as main.py does ─────────────────────────
print("\n=== Build DataFrame test ===")
raw = {
    "loan_amnt": 15000.0,
    "funded_amnt": None,
    "term": 36,
    "int_rate": 12.5,
    "installment": 501.0,
    "grade": "C",
    "sub_grade": "C1",
    "annual_inc": 72000.0,
    "emp_length": 5.0,
    "home_ownership": "RENT",
    "verification_status": "Verified",
    "application_type": "Individual",
    "dti": 18.5,
    "fico_range_low": 690.0,
    "fico_range_high": 694.0,
    "open_acc": 8.0,
    "pub_rec": 0.0,
    "revol_bal": 12000.0,
    "revol_util": 45.0,
    "total_acc": 20.0,
    "pub_rec_bankruptcies": 0.0,
    "mort_acc": 0.0,
    "purpose": "debt_consolidation",
    "addr_state": "CA",
    "initial_list_status": "w",
}

def build_dataframe(d):
    df = pd.DataFrame([d])
    df["fico_score"] = (df["fico_range_low"] + df["fico_range_high"]) / 2
    df["log_annual_inc"] = np.log10(df["annual_inc"].clip(lower=1))
    monthly_inc = (10 ** df["log_annual_inc"]) / 12
    df["payment_to_income"] = df["installment"] / monthly_inc.clip(lower=1)
    df["loan_to_income"] = df["loan_amnt"] / (10 ** df["log_annual_inc"]).clip(lower=1)
    df["credit_history_year"] = 1998
    if "open_acc" in df and "total_acc" in df:
        df["open_acc_ratio"] = df["open_acc"] / df["total_acc"].clip(lower=1)
    for col in ["revol_bal", "loan_amnt", "installment", "avg_cur_bal"]:
        if col in df.columns:
            df[f"log_{col}"] = np.log1p(df[col].fillna(0))
    df.drop(columns=["fico_range_low", "fico_range_high", "annual_inc"], errors="ignore", inplace=True)
    return df

try:
    df = build_dataframe(raw)
    print("OK  DataFrame built. Columns:", list(df.columns))

    missing = [c for c in feature_cols if c not in df.columns]
    extras  = [c for c in df.columns if c not in feature_cols]
    print("    Missing from df (will be NaN):", missing)
    print("    Extra cols ignored:            ", extras)

    preprocessor = bundle["preprocessor"]
    model        = bundle["calibrated_model"]

    for col in feature_cols:
        if col not in df.columns:
            df[col] = np.nan

    X        = preprocessor.transform(df[feature_cols])
    pd_score = float(model.predict_proba(X)[:, 1][0])
    print(f"OK  Single score: PD={pd_score:.4f}  ({pd_score*100:.2f}%)")
except Exception as e:
    import traceback
    print("ERR  Scoring failed:", type(e).__name__, str(e))
    traceback.print_exc()

# ── 3. Simulate batch row processing (same logic as main.py) ──────────
print("\n=== Simulate batch endpoint row processing ===")

# This mirrors what main.py does in /score/batch
# It uses ApplicantInput field filtering
APPLICANT_FIELDS = {
    "loan_amnt","funded_amnt","term","int_rate","installment","grade","sub_grade",
    "annual_inc","emp_length","home_ownership","verification_status","application_type",
    "dti","fico_range_low","fico_range_high","open_acc","pub_rec","revol_bal","revol_util",
    "total_acc","pub_rec_bankruptcies","mort_acc","purpose","addr_state","initial_list_status",
    "num_actv_rev_tl","mo_sin_rcnt_rev_tl_op","mo_sin_old_rev_tl_op","bc_util",
    "bc_open_to_buy","avg_cur_bal","acc_open_past_24mths"
}

# Build a valid CSV-style row (what the template should look like)
csv_row = {k: v for k, v in raw.items() if k in APPLICANT_FIELDS}
csv_row.setdefault("pub_rec", 0)
csv_row.setdefault("pub_rec_bankruptcies", 0)
csv_row.setdefault("application_type", "Individual")
csv_row.setdefault("initial_list_status", "w")
csv_row.setdefault("addr_state", "CA")

# Filter to only ApplicantInput fields - key step in main.py
filtered = {k: v for k, v in csv_row.items() if k in APPLICANT_FIELDS}
print("    Filtered row keys:", list(filtered.keys()))
print("    Required fields present: loan_amnt=%s, term=%s, int_rate=%s" % (
    filtered.get("loan_amnt"), filtered.get("term"), filtered.get("int_rate")))

# Now test validation manually
try:
    # Simulate what ApplicantInput(**filtered) does
    required = {"loan_amnt", "term", "int_rate", "installment", "grade", "sub_grade",
                "annual_inc", "dti", "fico_range_low", "fico_range_high", "home_ownership",
                "verification_status", "purpose"}
    missing_req = [r for r in required if r not in filtered or filtered[r] is None]
    if missing_req:
        print("WARN  Missing required fields in row:", missing_req)
    else:
        print("OK   All required fields present in batch row")
except Exception as e:
    print("ERR  Validation check failed:", e)

# ── 4. Print the correct CSV template ────────────────────────────────
print("\n=== Correct CSV template columns ===")
template_cols = [
    "loan_amnt","term","int_rate","installment","grade","sub_grade",
    "annual_inc","emp_length","home_ownership","verification_status",
    "application_type","dti","fico_range_low","fico_range_high",
    "open_acc","pub_rec","revol_bal","revol_util","total_acc",
    "pub_rec_bankruptcies","mort_acc","purpose","addr_state",
    "initial_list_status","bc_util","avg_cur_bal","acc_open_past_24mths"
]
print(",".join(template_cols))
# Sample row 1
r1 = "15000,36,12.5,501,C,C1,72000,5,RENT,Verified,Individual,18.5,690,694,8,0,12000,45,20,0,0,debt_consolidation,CA,w,42,8000,3"
print(r1)
# Sample row 2
r2 = "25000,60,18.0,640,D,D2,55000,2,MORTGAGE,Not Verified,Individual,28.0,640,644,12,1,22000,72,25,0,1,credit_card,NY,w,65,15000,5"
print(r2)
# Sample row 3
r3 = "8000,36,7.5,250,A,A2,95000,10,OWN,Source Verified,Individual,12.0,750,754,6,0,3000,18,30,0,0,home_improvement,TX,f,15,4500,1"
print(r3)

print("\n=== Diagnostic complete ===")
