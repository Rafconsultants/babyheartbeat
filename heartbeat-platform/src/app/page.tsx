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
import { DopplerHeartbeatSynthesizer } from '@/lib/doppler-heartbeat-synthesizer' // New specialized synthesizer

export default function Home() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  })
  const [result, setResult] = useState<AudioGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [referenceAudio, setReferenceAudio] = useState<ReferenceAudioInfo | null>(null)
  const [useReferenceAudio, setUseReferenceAudio] = useState(false)
  const [isTestMode, setIsTestMode] = useState(true) // Start in test mode
  const [testModeType, setTestModeType] = useState<'analysis' | 'simple-audio' | 'full'>('analysis') // Test mode type
  const [manualBPM, setManualBPM] = useState(155) // Manual BPM input
  const [useManualBPM, setUseManualBPM] = useState(false) // Use manual BPM instead of analysis

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
        hasDoublePulse: true, // Enable double-pulse for realism
        doublePulseOffset: 55, // 55ms between primary and secondary pulse
        timingVariability: 15, // ±15ms timing variation
        amplitudeVariation: 0.1 // 10% amplitude variation
      };
      
      console.log('🧪 Doppler options:', dopplerOptions);
      
      const dopplerResult = await DopplerHeartbeatSynthesizer.generateDopplerHeartbeat(dopplerOptions);
      
      console.log('🧪 Doppler heartbeat generation successful:', dopplerResult);
      console.log('🧪 Audio blob size:', dopplerResult.fileSize, 'bytes');

      // Create result
      const simpleResult: AudioGenerationResponse = {
        audioUrl: dopplerResult.audioUrl,
        bpm: dopplerResult.bpm,
        isWatermarked: false,
        confidence: confidence,
        method: 'gpt-vision',
        source: 'Authentic Doppler heartbeat synthesis with noise bursts',
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
    console.log('🧪 Testing Doppler synthesizer directly...');
    
    try {
      const dopplerOptions = {
        bpm: 155,
        duration: 8.0,
        sampleRate: 44100,
        hasDoublePulse: true,
        doublePulseOffset: 55,
        timingVariability: 15,
        amplitudeVariation: 0.1
      };
      
      console.log('🧪 Testing with options:', dopplerOptions);
      
      const dopplerResult = await DopplerHeartbeatSynthesizer.generateDopplerHeartbeat(dopplerOptions);
      
      console.log('🧪 Doppler test successful:', dopplerResult);
      
      // Create result for display
      const testResult: AudioGenerationResponse = {
        audioUrl: dopplerResult.audioUrl,
        bpm: dopplerResult.bpm,
        isWatermarked: false,
        confidence: 0.9,
        method: 'gpt-vision',
        source: 'Direct Doppler synthesizer test',
        analysis: 'Test audio generated successfully'
      };
      
      setResult(testResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });
      
      console.log('🧪 Doppler synthesizer test completed successfully!');
      
    } catch (error) {
      console.error('🧪 Doppler synthesizer test failed:', error);
      setError(`Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: `Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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

  const handleReferenceAudioSelect = async (file: File) => {
    console.log('🎵 Loading reference audio file:', file.name);
    setError(null);
    
    try {
      const audioInfo = await ReferenceAudioLoader.loadReferenceAudio(file);
      
      if (audioInfo.isValid) {
        setReferenceAudio(audioInfo);
        setUseReferenceAudio(true);
        console.log('🎵 Reference audio loaded successfully:', audioInfo);
      } else {
        setError(audioInfo.errorMessage || 'Failed to load reference audio');
        console.error('❌ Reference audio loading failed:', audioInfo.errorMessage);
      }
    } catch (err) {
      console.error('❌ Reference audio loading failed:', err);
      setError('Failed to load reference audio file');
    }
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
      let referenceMatched = false;
      try {
        if (useReferenceAudio && referenceAudio?.audioBuffer) {
          console.log('🎵 Using reference audio for enhanced synthesis');
          const audioResult = await AudioGenerator.generateWithReferenceMatching(
            { bpm: gptAnalysis.bpm, duration: 8, sampleRate: 44100, isWatermarked: true, gptAnalysis: gptAnalysis, stereo: true },
            referenceAudio.audioBuffer
          );
          audioUrl = audioResult.audioUrl;
          referenceMatched = audioResult.referenceMatched;
        } else {
          console.log('🎵 Using standard noise burst synthesis');
          console.log('🎵 Options being passed:', { bpm: gptAnalysis.bpm, duration: 8, sampleRate: 44100, isWatermarked: true, gptAnalysis: gptAnalysis, stereo: true });
          const audioResult = await AudioGenerator.generateHeartbeatAudio({
            bpm: gptAnalysis.bpm, duration: 8, sampleRate: 44100, isWatermarked: true, gptAnalysis: gptAnalysis, stereo: true
          });
          audioUrl = audioResult.audioUrl;
        }
        console.log('🚀 Audio generation completed, URL:', audioUrl);
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
        method: referenceMatched ? 'reference-matched' : 'gpt-vision',
        source: referenceMatched ? 'Enhanced GPT-4 Vision analysis with reference audio matching' : 'Enhanced GPT-4 Vision analysis with audio characteristics',
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

        {/* Reference Audio Upload Section */}
        {!processingState.isProcessing && !result && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">🎵 Reference Audio (Optional)</h3>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Upload a real Doppler audio sample to match its acoustic characteristics for ultra-realistic synthesis
              </p>
              
              <div className="max-w-md mx-auto">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReferenceAudioSelect(file);
                    }}
                    className="hidden"
                    id="reference-audio-upload"
                  />
                  <label htmlFor="reference-audio-upload" className="cursor-pointer">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {referenceAudio ? `Reference loaded: ${referenceAudio.audioBuffer.duration.toFixed(1)}s` : 'Click to upload reference audio'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">WAV, MP3, OGG (min 10s)</p>
                  </label>
                </div>
                
                {referenceAudio && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-2 text-sm text-green-800">
                          Reference audio loaded ({referenceAudio.audioBuffer.duration.toFixed(1)}s)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setReferenceAudio(null);
                          setUseReferenceAudio(false);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!processingState.isProcessing && !result && (
          <div className="mb-12">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Mode Toggle */}
              <div className="text-center">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setIsTestMode(true); setTestModeType('analysis'); }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isTestMode && testModeType === 'analysis'
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🧪 Analysis Only
                  </button>
                  <button
                    onClick={() => { setIsTestMode(true); setTestModeType('simple-audio'); }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isTestMode && testModeType === 'simple-audio'
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🎵 Authentic Doppler
                  </button>
                  <button
                    onClick={() => { setIsTestMode(false); setTestModeType('full'); }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      !isTestMode
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🚀 Full Mode
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {testModeType === 'analysis' && 'Analysis only: No audio generation'}
                  {testModeType === 'simple-audio' && 'Authentic Doppler: Noise-burst based fetal heartbeat synthesis'}
                  {testModeType === 'full' && 'Full mode: Complete noise burst audio generation'}
                </p>
                
                {/* Prominent message for audio issues */}
                {testModeType === 'analysis' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Need authentic Doppler audio?</strong> Switch to "🎵 Authentic Doppler" mode below and use manual BPM input for guaranteed authentic fetal heartbeat sounds!
                    </p>
                  </div>
                )}
              </div>

              {/* Test Buttons */}
              {isTestMode && (
                <div className="text-center space-y-2">
                  <button
                    onClick={testBasicFunctionality}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    🧪 Test System Functionality
                  </button>
                  <button
                    onClick={testDopplerSynthesizer}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ml-2"
                  >
                    🎵 Test Doppler Synthesizer
                  </button>
                  <p className="text-xs text-gray-500">Check browser console for test results</p>
                </div>
              )}

              {/* Manual BPM Input */}
              {isTestMode && testModeType === 'simple-audio' && (
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">🎯 Manual BPM Input</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="useManualBPM"
                        checked={useManualBPM}
                        onChange={(e) => setUseManualBPM(e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="useManualBPM" className="text-sm font-medium text-gray-700">
                        Use manual BPM instead of image analysis
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="manualBPM" className="block text-sm font-medium text-gray-700">
                        BPM Value (110-160)
                      </label>
                      <input
                        type="number"
                        id="manualBPM"
                        min="110"
                        max="160"
                        value={manualBPM}
                        onChange={(e) => setManualBPM(parseInt(e.target.value) || 155)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="155"
                      />
                      <p className="text-xs text-gray-500">
                        Enter the BPM value you see in the ultrasound image
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <ImageUpload 
                onImageSelect={
                  testModeType === 'analysis' ? testImageAnalysisOnly :
                  testModeType === 'simple-audio' ? testSimpleAudioGeneration :
                  handleImageSelect
                } 
                onError={handleError} 
                className="max-w-2xl mx-auto" 
              />
            </div>
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
