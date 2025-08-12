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
