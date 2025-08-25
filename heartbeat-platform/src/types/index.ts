// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Upload-related types
export interface Upload {
  id: string;
  userId: string;
  imageUrl: string;
  bpm: number;
  audioUrl: string;
  isWatermarked: boolean;
  createdAt: Date;
}

// Audio generation types
export interface AudioGenerationRequest {
  imageFile: File;
  bpm?: number;
}

export interface AudioGenerationResponse {
  audioUrl: string;
  bpm: number;
  isWatermarked: boolean;
  confidence?: number;
  method?: 'gpt-vision' | 'ocr' | 'waveform' | 'manual' | 'reference-matched' | 'simple-doppler' | 'enhanced-doppler';
  source?: string;
  analysis?: string; // Enhanced GPT analysis details
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
