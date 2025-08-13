'use client'

import React, { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import ProcessingStatus from '@/components/ProcessingStatus'
import AudioPlayer from '@/components/AudioPlayer'
import { ProcessingState, AudioGenerationResponse } from '@/types'
import { GPTUltrasoundAnalyzer } from '@/lib/gpt-ultrasound-analyzer' // Updated import
import { AudioGenerator } from '@/lib/audio-generator' // Updated import
import { testOpenAIAPI, testAvailableModels } from '@/lib/api-test' // Add API test import

export default function Home() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  })
  const [result, setResult] = useState<AudioGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiTestResult, setApiTestResult] = useState<string | null>(null)
  const [modelsResult, setModelsResult] = useState<string | null>(null)

  const handleImageSelect = async (file: File) => {
    setError(null)
    setResult(null)
    try {
      // Step 1: Upload and analyze image with GPT-4 Vision
      setProcessingState({
        isProcessing: true,
        step: 'uploading',
        progress: 20
      })

      // Enhanced GPT-4 Vision analysis with detailed audio characteristics
      const gptAnalysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file)
      console.log('Enhanced GPT-4 Vision Analysis:', gptAnalysis)

      // Step 2: Generate audio based on detailed GPT analysis
      setProcessingState({
        isProcessing: true,
        step: 'generating',
        progress: 70
      })

      // Generate realistic heartbeat audio using detailed GPT analysis
      const audioUrl = await AudioGenerator.generateSimpleHeartbeat(gptAnalysis.bpm, 8, gptAnalysis)

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

      setResult(finalResult)
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      })

    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.')
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'An unknown error occurred.'
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

  const handleAPITest = async () => {
    setApiTestResult('Testing...')
    try {
      const success = await testOpenAIAPI()
      setApiTestResult(success ? '✅ API Test Successful!' : '❌ API Test Failed')
    } catch (error) {
      setApiTestResult('❌ API Test Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleModelsTest = async () => {
    setModelsResult('Testing...')
    try {
      const models = await testAvailableModels()
      setModelsResult(`✅ Available Models: ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`)
    } catch (error) {
      setModelsResult('❌ Models Test Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
                <h1 className="text-2xl font-bold text-gray-900">Baby Heartbeat Audio</h1>
                <p className="text-sm text-gray-500">AI-Powered Ultrasound to Audio Conversion</p>
              </div>
            </div>
            {/* API Test Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAPITest}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Test API
              </button>
              <button
                onClick={handleModelsTest}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Test Models
              </button>
              {apiTestResult && (
                <span className={`text-sm font-medium ${apiTestResult.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {apiTestResult}
                </span>
              )}
              {modelsResult && (
                <span className={`text-sm font-medium ${modelsResult.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {modelsResult}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Ultrasound Images into Beautiful Heartbeat Audio
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Upload your baby&apos;s ultrasound image and our advanced AI will analyze it to create authentic, 
            realistic heartbeat sounds that capture the magic of your little one&apos;s heartbeat.
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
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">Advanced GPT-4 Vision technology analyzes your ultrasound images with incredible precision.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentic Audio</h3>
            <p className="text-gray-600">Generate realistic Doppler-style heartbeat sounds that match real ultrasound audio.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Download</h3>
            <p className="text-gray-600">Download your generated heartbeat audio in high-quality WAV format for keepsakes.</p>
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
