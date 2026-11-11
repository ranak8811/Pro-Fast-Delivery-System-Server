export interface AITrackingExplainRequest {
  trackingId: string;
}

export interface AITrackingExplainResponse {
  success?: boolean;
  tracking_id: string;
  delivery_status: string;
  explanation: string;
  is_fallback: boolean;
  model_used: string;
  generated_at: string;
  from_cache?: boolean;
}

