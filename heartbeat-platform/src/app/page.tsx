'use client'

import React, { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'
import ProcessingStatus from '@/components/ProcessingStatus'
import AudioPlayer from '@/components/AudioPlayer'
import { ProcessingState, AudioGenerationResponse } from '@/types'
import { GPTUltrasoundAnalyzer } from '@/lib/gpt-ultrasound-analyzer' // Updated import
import { AudioGenerator } from '@/lib/audio-generator' // Updated import
import { ReferenceAudioLoader, ReferenceAudioInfo } from '@/lib/reference-audio-loader' // Reference audio support
import { testOpenAIAPI } from '@/lib/api-test' // Add API test import
import { SimpleDopplerSynthesizer } from '@/lib/simple-doppler-synthesizer' // Simple, focused Doppler synthesizer

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [result, setResult] = useState<AudioGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  });
  const [isTestMode, setIsTestMode] = useState(false);
  const [testModeType, setTestModeType] = useState<'analysis' | 'simple-audio' | 'full'>('analysis');
  const [manualBPM, setManualBPM] = useState(155);
  const [useManualBPM, setUseManualBPM] = useState(false);

  // Check API status on component mount
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const success = await testOpenAIAPI()
        // setApiStatus(success ? 'available' : 'unavailable') // This line was removed as per the edit hint
      } catch (error) {
        console.error('API check failed:', error)
        // Don't block the app if API check fails
        // setApiStatus('available') // Assume available and let individual operations handle errors
      }
    }
    
    checkAPIStatus()
  }, [])

  // Simple test function to check basic functionality
  const testBasicFunctionality = async () => {
    console.log('🧪 Testing basic functionality...');
    
    try {
      // Test 1: Check if AudioContext is available
      console.log('🧪 Test 1: Checking AudioContext...');
      if (typeof window !== 'undefined') {
        console.log('🧪 Window object available');
        if (typeof AudioContext !== 'undefined') {
          console.log('🧪 AudioContext available');
          try {
            const testContext = new AudioContext();
            console.log('🧪 AudioContext created successfully, state:', testContext.state);
            testContext.close();
          } catch (error) {
            console.error('🧪 AudioContext creation failed:', error);
          }
        } else {
          console.error('🧪 AudioContext not available');
        }
      } else {
        console.error('🧪 Window object not available');
      }

      // Test 2: Check if GPTUltrasoundAnalyzer is available
      console.log('🧪 Test 2: Checking GPTUltrasoundAnalyzer...');
      if (GPTUltrasoundAnalyzer) {
        console.log('🧪 GPTUltrasoundAnalyzer available');
      } else {
        console.error('🧪 GPTUltrasoundAnalyzer not available');
      }

      // Test 3: Check if AudioGenerator is available
      console.log('🧪 Test 3: Checking AudioGenerator...');
      if (AudioGenerator) {
        console.log('🧪 AudioGenerator available');
        console.log('🧪 AudioGenerator methods:', Object.getOwnPropertyNames(AudioGenerator));
      } else {
        console.error('🧪 AudioGenerator not available');
      }

      // Test 4: Check environment variables
      console.log('🧪 Test 4: Checking environment variables...');
      console.log('🧪 NEXT_PUBLIC_OPENAI_API_KEY exists:', !!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
      console.log('🧪 NEXT_PUBLIC_OPENAI_API_KEY length:', process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length || 0);

    } catch (error) {
      console.error('🧪 Basic functionality test failed:', error);
    }
  };

  // Simple test function that only tests image analysis without audio generation
  const testImageAnalysisOnly = async (file: File) => {
    console.log('🧪 Testing image analysis only...');
    console.log('🧪 File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    try {
      // Test 1: Just try to analyze the image
      console.log('🧪 Step 1: Testing image analysis...');
      const analysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file);
      console.log('🧪 Image analysis successful:', analysis);
      
      // Test 2: Create a simple result without audio generation
      console.log('🧪 Step 2: Creating simple result...');
      const simpleResult: AudioGenerationResponse = {
        audioUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        bpm: analysis.bpm,
        isWatermarked: false,
        confidence: analysis.confidence,
        method: 'gpt-vision',
        source: 'Test analysis only - no audio generation',
        analysis: analysis.analysis
      };
      
      console.log('🧪 Simple result created:', simpleResult);
      setResult(simpleResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });
      
      console.log('🧪 Image analysis test completed successfully!');
      
    } catch (error) {
      console.error('🧪 Image analysis test failed:', error);
      console.error('🧪 Error type:', typeof error);
      console.error('🧪 Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('🧪 Error stack:', (error as Error)?.stack);
      
      setError(`Image analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: `Image analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Simple audio generation test that creates a basic audio file
  const testSimpleAudioGeneration = async (file: File) => {
    console.log('🧪 Testing authentic Doppler heartbeat generation...');
    console.log('🧪 File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    try {
      // Test 1: Analyze the image (or use manual BPM)
      console.log('🧪 Step 1: Getting BPM...');
      let bpm = manualBPM;
      let confidence = 0.8;
      let analysis = 'Manual BPM input';
      
      if (!useManualBPM) {
        try {
          const gptAnalysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file);
          bpm = gptAnalysis.bpm;
          confidence = gptAnalysis.confidence;
          analysis = gptAnalysis.analysis;
          console.log('🧪 GPT analysis successful:', gptAnalysis);
        } catch (analysisError) {
          console.warn('🧪 GPT analysis failed, using manual BPM:', analysisError);
          bpm = manualBPM;
          confidence = 0.6;
          analysis = 'GPT analysis failed - using manual BPM';
        }
      }
      
      console.log('🧪 Using BPM:', bpm);
      
      // Test 2: Generate authentic Doppler heartbeat audio
      console.log('🧪 Step 2: Generating authentic Doppler heartbeat...');
      
      const dopplerOptions = {
        bpm: bpm,
        duration: 8.0,
        sampleRate: 44100,
        hasDoublePulse: true,
        doublePulseOffset: 120, // 120ms between whoomp and lub
        timingVariability: 20, // ±20ms for organic feel
        amplitudeVariation: 0.15 // 15% amplitude variation
      };
      
      console.log('🧪 Doppler options:', dopplerOptions);
      
      const dopplerResult = await SimpleDopplerSynthesizer.generateSimpleDoppler(dopplerOptions);
      
      console.log('🧪 Doppler heartbeat generation successful:', dopplerResult);
      console.log('🧪 Audio blob size:', dopplerResult.fileSize, 'bytes');

      // Create result
      const simpleResult: AudioGenerationResponse = {
        audioUrl: dopplerResult.audioUrl,
        bpm: dopplerResult.bpm,
        isWatermarked: false,
        confidence: confidence,
        method: 'simple-doppler',
        source: 'Simple Doppler heartbeat synthesis',
        analysis: analysis
      };
      
      console.log('🧪 Authentic Doppler result created:', simpleResult);
      setResult(simpleResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });
      
      console.log('🧪 Authentic Doppler heartbeat generation completed successfully!');
      
    } catch (error) {
      console.error('🧪 Authentic Doppler heartbeat generation failed:', error);
      console.error('🧪 Error type:', typeof error);
      console.error('🧪 Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('🧪 Error stack:', (error as Error)?.stack);
      
      setError(`Authentic Doppler heartbeat generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: `Authentic Doppler heartbeat generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Simple test function to verify Doppler synthesizer works
  const testDopplerSynthesizer = async () => {
    console.log('🧪 Testing simple Doppler synthesizer directly...');
    
    try {
      const dopplerOptions = {
        bpm: 155,
        duration: 8.0,
        sampleRate: 44100,
        hasDoublePulse: true,
        doublePulseOffset: 120, // 120ms between whoomp and lub
        timingVariability: 20, // ±20ms for organic feel
        amplitudeVariation: 0.15 // 15% amplitude variation
      };
      
      console.log('🧪 Testing with options:', dopplerOptions);
      
      const dopplerResult = await SimpleDopplerSynthesizer.generateSimpleDoppler(dopplerOptions);
      
      console.log('🧪 Simple Doppler test successful:', dopplerResult);
      
      // Create result for display
      const testResult: AudioGenerationResponse = {
        audioUrl: dopplerResult.audioUrl,
        bpm: dopplerResult.bpm,
        isWatermarked: false,
        confidence: 0.9,
        method: 'simple-doppler',
        source: 'Direct simple Doppler synthesizer test',
        analysis: 'Simple fetal Doppler ultrasound test audio generated successfully'
      };
      
      setResult(testResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });
      
      console.log('🧪 Simple Doppler synthesizer test completed successfully!');
      
    } catch (error) {
      console.error('🧪 Simple Doppler synthesizer test failed:', error);
      setError(`Simple Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: `Simple Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Helper function to create a simple WAV file
  const createSimpleWAVFile = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // WAV file header
    let offset = 0;
    view.setUint32(offset, 0x52494646, false); // "RIFF"
    offset += 4;
    view.setUint32(offset, 36 + dataSize, true); // File size
    offset += 4;
    view.setUint32(offset, 0x57415645, false); // "WAVE"
    offset += 4;
    view.setUint32(offset, 0x666d7420, false); // "fmt "
    offset += 4;
    view.setUint32(offset, 16, true); // Chunk size
    offset += 4;
    view.setUint16(offset, 1, true); // Audio format (PCM)
    offset += 2;
    view.setUint16(offset, channels, true); // Number of channels
    offset += 2;
    view.setUint32(offset, sampleRate, true); // Sample rate
    offset += 4;
    view.setUint32(offset, byteRate, true); // Byte rate
    offset += 4;
    view.setUint16(offset, blockAlign, true); // Block align
    offset += 2;
    view.setUint16(offset, bitsPerSample, true); // Bits per sample
    offset += 2;
    view.setUint32(offset, 0x64617461, false); // "data"
    offset += 4;
    view.setUint32(offset, dataSize, true); // Data size
    offset += 4;

    // Audio data
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return buffer;
  };

  const handleImageSelect = async (file: File) => {
    console.log('🚀 Starting image processing for file:', file.name, 'Size:', file.size);
    console.log('🚀 File type:', file.type);
    console.log('🚀 File lastModified:', file.lastModified);
    setError(null)
    setResult(null)
    try {
      console.log('🚀 Step 1: Starting image analysis...');
      setProcessingState({ isProcessing: true, step: 'uploading', progress: 20 });
      console.log('🚀 Calling GPTUltrasoundAnalyzer.analyzeUltrasound...');
      console.log('🚀 GPTUltrasoundAnalyzer object:', GPTUltrasoundAnalyzer);
      console.log('🚀 GPTUltrasoundAnalyzer.analyzeUltrasound method:', typeof GPTUltrasoundAnalyzer.analyzeUltrasound);
      let gptAnalysis;
      try {
        console.log('🚀 About to call analyzeUltrasound...');
        gptAnalysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file);
        console.log('🚀 GPT Analysis completed:', gptAnalysis);
      } catch (analysisError) {
        console.error('❌ GPT Analysis failed:', analysisError);
        console.error('❌ Analysis error type:', typeof analysisError);
        console.error('❌ Analysis error constructor:', (analysisError as Error)?.constructor?.name);
        console.error('❌ Analysis error stack:', (analysisError as Error)?.stack);
        
        // Fallback to manual BPM when analysis fails
        console.log('🔄 Falling back to manual BPM:', manualBPM);
        gptAnalysis = {
          bpm: manualBPM,
          confidence: 0.6,
          beat_times_sec: [],
          double_pulse_offset_ms: null,
          amplitude_scalars: [],
          analysis: `Analysis failed - using manual BPM of ${manualBPM}`,
          waveform_extracted: false,
          waveform_confidence: 0
        };
      }
      
      console.log('🚀 Step 2: Starting audio generation...');
      setProcessingState({ isProcessing: true, step: 'generating', progress: 70 });
      console.log('🚀 Calling AudioGenerator.generateHeartbeatAudio...');
      console.log('🚀 AudioGenerator object:', AudioGenerator);
      console.log('🚀 AudioGenerator.generateHeartbeatAudio method:', typeof AudioGenerator.generateHeartbeatAudio);
      let audioUrl: string;
      try {
        console.log('🎵 Using standard noise burst synthesis');
        console.log('🎵 Options being passed:', { bpm: gptAnalysis.bpm, duration: 8, sampleRate: 44100, isWatermarked: true, gptAnalysis: gptAnalysis, stereo: true });
        const audioResult = await AudioGenerator.generateHeartbeatAudio({
          bpm: gptAnalysis.bpm, duration: 8, sampleRate: 44100, isWatermarked: true, gptAnalysis: gptAnalysis, stereo: true
        });
        audioUrl = audioResult.audioUrl;
      } catch (audioError) {
        console.error('❌ Audio generation failed:', audioError);
        console.error('❌ Audio error type:', typeof audioError);
        console.error('❌ Audio error constructor:', (audioError as Error)?.constructor?.name);
        console.error('❌ Audio error stack:', (audioError as Error)?.stack);
        
        // Try simple audio generation as fallback
        console.log('🔄 Audio generation failed, trying simple audio generation...');
        try {
          const simpleResult = await testSimpleAudioGeneration(file);
          console.log('🔄 Simple audio generation successful');
          return; // testSimpleAudioGeneration already sets the result
        } catch (simpleError) {
          console.error('❌ Simple audio generation also failed:', simpleError);
          throw new Error(`Audio generation failed: ${audioError instanceof Error ? audioError.message : 'Unknown error'}`);
        }
      }
      console.log('🚀 Creating final result...');
      const finalResult: AudioGenerationResponse = {
        audioUrl: audioUrl, bpm: gptAnalysis.bpm, isWatermarked: true, confidence: gptAnalysis.confidence,
        method: 'gpt-vision',
        source: 'Enhanced GPT-4 Vision analysis with audio characteristics',
        analysis: gptAnalysis.analysis
      };
      console.log('🚀 Final result created:', finalResult);
      setResult(finalResult);
      setProcessingState({ isProcessing: false, step: 'complete', progress: 100 });
      console.log('🚀 Processing completed successfully!');
    } catch (err) {
      console.error('❌ Processing failed:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error constructor:', (err as Error)?.constructor?.name);
      console.error('❌ Error stack:', (err as Error)?.stack);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error details:', errorMessage);
      setError(`Unable to process your image: ${errorMessage}`);
      setProcessingState({ isProcessing: false, step: 'error', progress: 0, error: `Unable to process your image: ${errorMessage}` });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setTestModeType('analysis')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                testModeType === 'analysis'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">✏️</span>
              <span>Analysis Only</span>
            </button>
            <button
              onClick={() => setTestModeType('simple-audio')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                testModeType === 'simple-audio'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">🎵</span>
              <span>♫ Authentic Doppler</span>
            </button>
            <button
              onClick={() => setTestModeType('full')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                testModeType === 'full'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">🚀</span>
              <span>Full Mode</span>
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {testModeType === 'analysis' && 'Analysis only: No audio generation'}
            {testModeType === 'simple-audio' && 'Authentic Doppler: Generate realistic fetal heartbeat audio'}
            {testModeType === 'full' && 'Full mode: Complete analysis and audio generation'}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-600 text-xl">💡</span>
            <div>
              <p className="text-yellow-800 font-medium">
                Need authentic Doppler audio? Switch to "♫ Authentic Doppler" mode below and use manual BPM input for guaranteed authentic fetal heartbeat sounds!
              </p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={testBasicFunctionality}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span className="text-lg">✏️</span>
              <span>🧪 Test System Functionality</span>
            </button>
            <button
              onClick={testDopplerSynthesizer}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              <span className="text-lg">🎵</span>
              <span>🎵 Test Doppler Synthesizer</span>
            </button>
          </div>
          <p className="text-sm text-gray-600">Check browser console for test results</p>
        </div>

        {/* Manual BPM Input */}
        {testModeType === 'simple-audio' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useManualBPM}
                  onChange={(e) => setUseManualBPM(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">Use Manual BPM</span>
              </label>
              {useManualBPM && (
                <div className="flex items-center space-x-2">
                  <label className="text-gray-700">BPM:</label>
                  <input
                    type="number"
                    value={manualBPM}
                    onChange={(e) => setManualBPM(Number(e.target.value))}
                    min="110"
                    max="160"
                    className="border border-gray-300 rounded px-3 py-1 w-20"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload your ultrasound image</h2>
          <ImageUpload
            onImageSelect={handleImageSelect}
          />
        </div>
      </div>

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
    </div>
  );
}
