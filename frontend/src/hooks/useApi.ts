import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ApplicantInput {
  loan_amnt: number;
  term: number;
  int_rate: number;
  installment: number;
  grade: string;
  sub_grade: string;
  annual_inc: number;
  emp_length?: number;
  home_ownership: string;
  verification_status: string;
  application_type: string;
  dti: number;
  fico_range_low: number;
  fico_range_high: number;
  open_acc?: number;
  pub_rec: number;
  revol_bal?: number;
  revol_util?: number;
  total_acc?: number;
  pub_rec_bankruptcies: number;
  mort_acc?: number;
  purpose: string;
  addr_state: string;
  initial_list_status: string;
  num_actv_rev_tl?: number;
  bc_util?: number;
  avg_cur_bal?: number;
  acc_open_past_24mths?: number;
}

export interface ShapReason {
  feature: string;
  direction: 'increases' | 'decreases';
  magnitude: number;
}

export interface ScoreResult {
  pd_score: number;
  pd_pct: number;
  risk_tier: string;
  tier_color: string;
  decision: 'APPROVE' | 'REFER' | 'DECLINE';
  expected_loss: number;
  el_pct: number;
  funded_amnt: number;
  lgd_assumption: number;
  shap_reasons: ShapReason[];
  scored_at: string;
  model_version: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  shap_enabled: boolean;
  mode: string;
  timestamp: string;
}

export interface ModelCardData {
  version?: string;
  engine?: string;
  gini?: number;
  ks_statistic?: number;
  brier_score?: number;
  avg_precision?: number;
  calibration?: string;
  training_period?: string;
  validation_period?: string;
  test_period?: string;
  class_balance?: string;
  lgd_assumption?: number;
}

export interface BatchScoreResult {
  results: {
    row: number;
    pd_score: number | null;
    pd_pct: number | null;
    risk_tier: string;
    tier_color: string;
    decision: 'APPROVE' | 'REFER' | 'DECLINE' | 'ERROR';
    expected_loss: number | null;
    funded_amnt: number | null;
    top_reason: string;
    error: string;
  }[];
  total: number;
}

// API Functions
export const scoreApplicant = async (data: ApplicantInput): Promise<ScoreResult> => {
  const response = await api.post('/score', data);
  return response.data;
};

export const scoreBatch = async (file: File): Promise<BatchScoreResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/score/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const scoreBatchCsv = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/score/batch/csv', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getHealth = async (): Promise<HealthStatus> => {
  const response = await api.get('/health');
  return response.data;
};

export const getModelCard = async (): Promise<ModelCardData> => {
  const response = await api.get('/model/card');
  return response.data;
};
