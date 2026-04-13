"""
Quick backend diagnostic — run this from the backend/ folder:
  python test_batch.py
"""
import pickle, io, math
import numpy as np
import pandas as pd

MODEL_PATH = "loan_default_model_v2.pkl"
LGD = 0.87

# --- Load model ---
try:
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
    print("✔  Model loaded. Keys:", list(bundle.keys()))
    print("   feature_cols count:", len(bundle.get("feature_cols", [])))
    print("   feature_cols:", bundle.get("feature_cols", [])[:10], "...")
except Exception as e:
    print("✘  Failed to load model:", e)
    bundle = None

# --- Build test applicant exactly as main.py does ---
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

if bundle:
    try:
        df = build_dataframe(raw)
        preprocessor = bundle["preprocessor"]
        model = bundle["calibrated_model"]
        feature_cols = bundle["feature_cols"]
        print("\n--- Feature check ---")
        missing = [c for c in feature_cols if c not in df.columns]
        print(f"   Missing features: {missing}")
        extras = [c for c in df.columns if c not in feature_cols]
        print(f"   Extra (ignored): {extras}")
        for col in feature_cols:
            if col not in df.columns:
                df[col] = np.nan
        X = preprocessor.transform(df[feature_cols])
        pd_score = float(model.predict_proba(X)[:, 1][0])
        print(f"\n✔  Score successful: PD={pd_score:.4f} ({pd_score*100:.2f}%)")
    except Exception as e:
        print(f"\n✘  Scoring failed: {type(e).__name__}: {e}")
        import traceback; traceback.print_exc()
