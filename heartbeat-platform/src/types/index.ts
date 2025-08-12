// User-related types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Upload-related types
export interface Upload {
  id: string;
  user_id?: string;
  image_url: string;
  bpm_value: number;
  audio_url: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

// Audio generation types
export interface AudioGenerationRequest {
  imageUrl: string;
  bpm?: number;
}

export interface AudioGenerationResponse {
  audioUrl: string;
  bpm: number;
  isWatermarked: boolean;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  upload_id: string;
}

// UI State types
export interface ProcessingState {
  isProcessing: boolean;
  step: 'uploading' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
