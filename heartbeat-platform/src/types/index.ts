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
  imageFile: File;
  userId?: string;
}

export interface AudioGenerationResponse {
  audioUrl: string;
  bpm: number;
  isWatermarked: boolean;
  confidence?: number;
  method?: 'gpt-vision' | 'ocr' | 'waveform' | 'manual';
  source?: string;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
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
