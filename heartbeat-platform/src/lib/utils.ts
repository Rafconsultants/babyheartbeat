import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format BPM value for display
export function formatBPM(bpm: number): string {
  return `${Math.round(bpm)} BPM`
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Validate image file
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please upload a JPEG or PNG image' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  return { isValid: true }
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Calculate processing progress based on step
export function calculateProgress(step: string): number {
  const steps = ['uploading', 'analyzing', 'generating', 'complete']
  const currentIndex = steps.indexOf(step)
  return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0
}

// Format timestamp for display
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Validate BPM is within reasonable fetal range
export function validateBPM(bpm: number): number {
  return Math.max(100, Math.min(200, bpm))
}

// Get BPM description based on value
export function getBPMDescription(bpm: number): string {
  if (bpm < 110) return "Slow fetal heart rate"
  if (bpm > 160) return "Fast fetal heart rate"
  return "Normal fetal heart rate"
}

// Get physiologically plausible BPM range
export function getPlausibleBPMRange(): { min: number; max: number; default: number } {
  return {
    min: 110,
    max: 160,
    default: 140
  }
}

// Format confidence as percentage
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

// Get confidence level description
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.8) return "High confidence"
  if (confidence >= 0.6) return "Medium confidence"
  if (confidence >= 0.4) return "Low confidence"
  return "Very low confidence"
}

// Format waveform extraction status
export function formatWaveformStatus(hasWaveform: boolean, confidence: number): string {
  if (hasWaveform) {
    return `Waveform extracted (${formatConfidence(confidence)} confidence)`
  }
  return "No waveform detected - using fallback pattern"
}

// Get audio quality description based on sample rate and stereo
export function getAudioQualityDescription(sampleRate: number, stereo: boolean): string {
  const quality = sampleRate >= 48000 ? "High" : "Standard"
  const channels = stereo ? "Stereo" : "Mono"
  return `${quality} quality ${channels}`
}

// Calculate expected file size for audio
export function calculateExpectedFileSize(duration: number, sampleRate: number, stereo: boolean): number {
  const channels = stereo ? 2 : 1
  const bitsPerSample = 16
  const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8
  return Math.round(duration * bytesPerSecond)
}

// Format duration in seconds to MM:SS format
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
