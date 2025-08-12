'use client'

import React, { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import ProcessingStatus from '@/components/ProcessingStatus'
import AudioPlayer from '@/components/AudioPlayer'
import { ProcessingState, AudioGenerationResponse } from '@/types'

export default function Home() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  })
  const [result, setResult] = useState<AudioGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = async (file: File) => {
    setError(null)
    setResult(null)
    setProcessingState({
      isProcessing: true,
      step: 'uploading',
      progress: 25
    })

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProcessingState({
        isProcessing: true,
        step: 'analyzing',
        progress: 50
      })

      // Simulate BPM analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setProcessingState({
        isProcessing: true,
        step: 'generating',
        progress: 75
      })

      // Simulate audio generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For demo purposes, generate a mock result
      const mockResult: AudioGenerationResponse = {
        audioUrl: '/demo-heartbeat.mp3', // This would be the actual generated audio URL
        bpm: Math.floor(Math.random() * 40) + 120, // Random BPM between 120-160
        isWatermarked: true
      }

      setResult(mockResult)
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      })

    } catch {
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: 'Failed to process image. Please try again.'
      })
      setError('Failed to process image. Please try again.')
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleUpgrade = () => {
    // This would integrate with Stripe for payment
    alert('Upgrade functionality will be implemented with Stripe integration')
  }

  const handleDownload = () => {
    // This would handle the actual download
    alert('Download functionality will be implemented with Supabase storage')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Baby Heartbeat</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Hear Your Baby&apos;s
            <span className="text-pink-600"> Heartbeat</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your ultrasound image and we&apos;ll convert it into a beautiful, realistic heartbeat audio file. 
            Experience the joy of hearing your baby&apos;s heartbeat anytime, anywhere.
          </p>
        </div>

        {/* Upload Section */}
        {!processingState.isProcessing && !result && (
          <div className="mb-12">
            <ImageUpload
              onImageSelect={handleImageSelect}
              onError={handleError}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Processing Status */}
        {processingState.isProcessing && (
          <div className="mb-12">
            <ProcessingStatus
              state={processingState}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Error Display */}
        {error && !processingState.isProcessing && (
          <div className="mb-12 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mb-12">
            <AudioPlayer
              audioUrl={result.audioUrl}
              bpm={result.bpm}
              isWatermarked={result.isWatermarked}
              onDownload={handleDownload}
              onUpgrade={handleUpgrade}
              className="max-w-2xl mx-auto"
            />
            
            {/* Try Again Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setResult(null)
                  setError(null)
                  setProcessingState({
                    isProcessing: false,
                    step: 'uploading',
                    progress: 0
                  })
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Process Another Image
              </button>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart BPM Detection</h3>
            <p className="text-gray-600">Our AI automatically detects the BPM from your ultrasound image text or analyzes the waveform.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Realistic Audio</h3>
            <p className="text-gray-600">Generate authentic Doppler-style heartbeat sounds that match your baby&apos;s actual BPM.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600">Your ultrasound images are processed securely and never stored permanently without your consent.</p>
          </div>
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">1</div>
              <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
              <p className="text-gray-600">Upload your ultrasound image in JPEG or PNG format</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">2</div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI detects BPM from text or analyzes the waveform</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">3</div>
              <h3 className="text-lg font-semibold mb-2">Generate Audio</h3>
              <p className="text-gray-600">Create realistic 8-second heartbeat audio file</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">4</div>
              <h3 className="text-lg font-semibold mb-2">Download & Share</h3>
              <p className="text-gray-600">Download your audio file and share with loved ones</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Baby Heartbeat Platform</h3>
            <p className="text-gray-400 mb-6">
              Bringing the joy of your baby&apos;s heartbeat to life through technology
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
