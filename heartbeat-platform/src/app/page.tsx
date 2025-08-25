'use client'

import { useState } from 'react'
import { AudioGenerationResponse, ProcessingState } from '@/types'
import { GPTUltrasoundAnalyzer } from '@/lib/gpt-ultrasound-analyzer'
import { NoiseBurstDopplerSynthesizer } from '@/lib/noise-burst-doppler'
import ImageUpload from '@/components/ImageUpload'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [result, setResult] = useState<AudioGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  });

  // Handle image selection and processing
  const handleImageSelect = async (file: File) => {
    console.log('🔄 Starting ultrasound image processing...');
    setSelectedImage(file);
    setError(null);
    setResult(null);
    setProcessingState({
      isProcessing: true,
      step: 'analyzing',
      progress: 25
    });

    try {
      // Step 1: Analyze image for BPM
      console.log('🔍 Analyzing ultrasound image...');
      const analysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file);
      console.log('🔍 Analysis result:', analysis);

      setProcessingState({
        isProcessing: true,
        step: 'generating',
        progress: 75
      });

      // Step 2: Generate noise-burst fetal Doppler audio
      console.log('🎵 Generating noise-burst fetal Doppler audio...');
      const dopplerOptions = {
        bpm: analysis.bpm,
        duration: 8.0,
        sampleRate: 44100,
        beatTimesSec: analysis.beat_times_sec || [],
        doublePulseOffsetMs: analysis.double_pulse_offset_ms,
        amplitudeScalars: analysis.amplitude_scalars || []
      };

      const dopplerResult = await NoiseBurstDopplerSynthesizer.generateNoiseBurstDoppler(dopplerOptions);
      console.log('🎵 Audio generation successful:', dopplerResult);

      // Create result
      const audioResult: AudioGenerationResponse = {
        audioUrl: dopplerResult.audioUrl,
        bpm: dopplerResult.bpm,
        isWatermarked: false,
        confidence: analysis.confidence,
        method: 'noise-burst-doppler',
        source: 'Ultrasound image analysis',
        analysis: analysis.analysis
      };

      setResult(audioResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });

      console.log('✅ Processing completed successfully!');

    } catch (error) {
      console.error('❌ Processing failed:', error);
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fetal Doppler Audio Generator
          </h1>
          <p className="text-lg text-gray-600">
            Upload your ultrasound image to generate realistic fetal heartbeat sounds
          </p>
        </div>

        {/* Main Upload Area */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Upload Ultrasound Image
          </h2>
          <ImageUpload onImageSelect={handleImageSelect} />
        </div>

        {/* Processing Status */}
        {processingState.isProcessing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg font-medium text-gray-900">
                {processingState.step === 'analyzing' ? 'Analyzing image...' : 'Generating audio...'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingState.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Generated Audio
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Heart Rate:</span>
                <span className="text-xl font-semibold text-gray-900">{result.bpm} BPM</span>
              </div>
                             <div className="flex justify-between items-center">
                 <span className="text-gray-600">Confidence:</span>
                 <span className="text-gray-900">{((result.confidence || 0) * 100).toFixed(1)}%</span>
               </div>
            </div>

            <audio controls className="w-full mb-4">
              <source src={result.audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Analysis Details</h3>
              <p className="text-blue-800 text-sm">{result.analysis}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-xl">📷</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Upload Image</h3>
              <p className="text-sm text-gray-600">Upload your ultrasound image (JPEG or PNG)</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">🔍</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">AI analyzes the image to detect BPM and patterns</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 text-xl">🎵</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Generate Audio</h3>
              <p className="text-sm text-gray-600">Create realistic fetal Doppler heartbeat sounds</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
