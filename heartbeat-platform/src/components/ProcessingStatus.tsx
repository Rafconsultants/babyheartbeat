'use client'

import React from 'react'
import { ProcessingState } from '@/types'

interface ProcessingStatusProps {
  state: ProcessingState
  className?: string
}

export default function ProcessingStatus({ state, className = '' }: ProcessingStatusProps) {
  const steps = [
    { key: 'uploading', label: 'Uploading Image', icon: '📤' },
    { key: 'analyzing', label: 'Analyzing BPM', icon: '🔍' },
    { key: 'generating', label: 'Generating Audio', icon: '🎵' },
    { key: 'complete', label: 'Complete', icon: '✅' }
  ]

  const currentStepIndex = steps.findIndex(step => step.key === state.step)
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  if (state.step === 'error') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
            <p className="text-sm text-red-700 mt-1">{state.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-pink-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex

            return (
              <div key={step.key} className="text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-pink-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <p
                  className={`text-xs font-medium ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-pink-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Current Status */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {state.step === 'uploading' && 'Uploading your ultrasound image...'}
            {state.step === 'analyzing' && 'Detecting BPM from your image...'}
            {state.step === 'generating' && 'Creating your heartbeat audio...'}
            {state.step === 'complete' && 'Your heartbeat audio is ready!'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This usually takes about 10 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
