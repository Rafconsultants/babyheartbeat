'use client'

import React, { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'
import ProcessingStatus from '@/components/ProcessingStatus'
import AudioPlayer from '@/components/AudioPlayer'
import { ProcessingState, AudioGenerationResponse } from '@/types'
import { GPTUltrasoundAnalyzer } from '@/lib/gpt-ultrasound-analyzer' // Updated import
import { AudioGenerator } from '@/lib/audio-generator' // Updated import
import { testOpenAIAPI } from '@/lib/api-test' // Add API test import

export default function Home() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  })
  const [result, setResult] = useState<AudioGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  // Check API status on component mount
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const success = await testOpenAIAPI()
        setApiStatus(success ? 'available' : 'unavailable')
      } catch (error) {
        console.error('API check failed:', error)
        // Don't block the app if API check fails
        setApiStatus('available') // Assume available and let individual operations handle errors
      }
    }
    
    checkAPIStatus()
  }, [])

  const handleImageSelect = async (file: File) => {
    console.log('🚀 Starting image processing for file:', file.name, 'Size:', file.size);
    setError(null)
    setResult(null)
    
    try {
      // Step 1: Upload and analyze image with GPT-4 Vision
      console.log('🚀 Step 1: Starting image analysis...');
      setProcessingState({
        isProcessing: true,
        step: 'uploading',
        progress: 20
      })

      // Enhanced GPT-4 Vision analysis with detailed audio characteristics
      console.log('🚀 Calling GPTUltrasoundAnalyzer.analyzeUltrasound...');
      const gptAnalysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file)
      console.log('🚀 GPT Analysis completed:', gptAnalysis);

      // Step 2: Generate audio based on detailed GPT analysis
      console.log('🚀 Step 2: Starting audio generation...');
      setProcessingState({
        isProcessing: true,
        step: 'generating',
        progress: 70
      })

      // Generate authentic fetal Doppler ultrasound heartbeat audio using GPT-4 Vision analysis
      console.log('🚀 Calling AudioGenerator.generateFetalDopplerHeartbeat...');
      const audioUrl = await AudioGenerator.generateFetalDopplerHeartbeat(gptAnalysis.bpm, 8, gptAnalysis)
      console.log('🚀 Audio generation completed, URL:', audioUrl);

      // Create the result with enhanced GPT analysis
      const finalResult: AudioGenerationResponse = {
        audioUrl: audioUrl,
        bpm: gptAnalysis.bpm,
        isWatermarked: true, // For now, all generated audio is watermarked
        confidence: gptAnalysis.confidence,
        method: 'gpt-vision',
        source: 'Enhanced GPT-4 Vision analysis with audio characteristics',
        analysis: gptAnalysis.analysis // Pass detailed GPT analysis to result
      }

      console.log('🚀 Final result created:', finalResult);
      setResult(finalResult)
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      })

      console.log('🚀 Processing completed successfully!');

    } catch (err) {
      console.error('❌ Processing failed:', err);
      setError('Unable to process your image at this time. Please try again.')
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: 'Unable to process your image at this time. Please try again.'
      })
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setProcessingState({ isProcessing: false, step: 'error', progress: 0, error: errorMessage })
  }

  const handleUpgrade = () => {
    alert('Upgrade to remove watermark functionality will be implemented with Stripe.')
  }

  const handleDownload = () => {
    if (result?.audioUrl) {
      const link = document.createElement('a')
      link.href = result.audioUrl
      link.download = `heartbeat-${result.bpm}bpm.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Ultrasound to Heartbeat Audio</h1>
                <p className="text-sm text-gray-500">GPT-4 Vision Powered Fetal Doppler Ultrasound</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Authentic Fetal Doppler Ultrasound
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your ultrasound image and let GPT-4 Vision create authentic fetal heartbeat sounds with the characteristic "THUMP-tap" pattern, soft and muffled like it's coming from inside the body.
          </p>
        </div>

        {/* Upload Section */}
        {!processingState.isProcessing && !result && (
          <div className="mb-12">
            <ImageUpload onImageSelect={handleImageSelect} onError={handleError} className="max-w-2xl mx-auto" />
          </div>
        )}

        {/* Processing Status */}
        {processingState.isProcessing && (
          <div className="mb-12">
            <ProcessingStatus state={processingState} className="max-w-2xl mx-auto" />
          </div>
        )}

        {/* Error Display */}
        {error && !processingState.isProcessing && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => { 
                setResult(null); 
                setError(null); 
                setProcessingState({ isProcessing: false, step: 'uploading', progress: 0 }) 
              }} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Section */}
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

            {/* Enhanced GPT Analysis Info */}
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Enhanced GPT-4 Vision Analysis</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Method: {result.method} • Confidence: {Math.round((result.confidence || 0) * 100)}% • Source: {result.source}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Try Again Button */}
            <div className="text-center mt-8">
              <button 
                onClick={() => { 
                  setResult(null); 
                  setError(null); 
                  setProcessingState({ isProcessing: false, step: 'uploading', progress: 0 }) 
                }} 
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Process Another Image
              </button>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">GPT-4 Vision Analysis</h3>
            <p className="text-gray-600">Advanced AI analyzes your ultrasound image to detect BPM and extract detailed audio characteristics for authentic sound generation.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentic THUMP-tap Pattern</h3>
            <p className="text-gray-600">Creates the characteristic fetal Doppler ultrasound sound with deep "THUMP" followed by soft "tap", muffled and warm like it's coming from inside the body.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Precise BPM Matching</h3>
            <p className="text-gray-600">Generates heartbeat audio that perfectly matches the detected BPM (110-160 range) with authentic timing and rhythm variations.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
              <h4 className="font-semibold text-gray-900 mb-2">Upload Image</h4>
              <p className="text-sm text-gray-600">Upload your ultrasound image (JPEG or PNG format)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">GPT-4 Vision analyzes the image for BPM and audio characteristics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
              <h4 className="font-semibold text-gray-900 mb-2">Generate Audio</h4>
              <p className="text-sm text-gray-600">Create authentic ultrasound heartbeat sounds based on analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
              <h4 className="font-semibold text-gray-900 mb-2">Download & Share</h4>
              <p className="text-sm text-gray-600">Download your personalized heartbeat audio file</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">&copy; 2024 Baby Heartbeat Audio Platform. Created with ❤️ for expecting parents.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
