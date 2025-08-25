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
import { EnhancedAudioGenerator } from '@/lib/enhanced-audio-generator' // Enhanced audio generator with waveform extraction
import { EnhancedWaveformExtractor } from '@/lib/enhanced-waveform-extractor' // Enhanced waveform extractor

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [result, setResult] = useState<AudioGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: 'uploading',
    progress: 0
  });
  const [manualBpm, setManualBpm] = useState<string>('155');
  const [isTestMode, setIsTestMode] = useState(false);
  const [testModeType, setTestModeType] = useState<'analysis' | 'simple' | 'full'>('full');

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
      let bpm = parseInt(manualBpm, 10);
      let confidence = 0.8;
      let analysis = 'Manual BPM input';
      
      if (!isNaN(bpm) && bpm >= 110 && bpm <= 160) {
        try {
          const gptAnalysis = await GPTUltrasoundAnalyzer.analyzeUltrasound(file);
          bpm = gptAnalysis.bpm;
          confidence = gptAnalysis.confidence;
          analysis = gptAnalysis.analysis;
          console.log('🧪 GPT analysis successful:', gptAnalysis);
        } catch (analysisError) {
          console.warn('🧪 GPT analysis failed, using manual BPM:', analysisError);
          bpm = parseInt(manualBpm, 10);
          confidence = 0.6;
          analysis = 'GPT analysis failed - using manual BPM';
        }
      } else {
        console.warn('🧪 Manual BPM input is outside valid range (110-160). Using default 155.');
        bpm = 155;
        confidence = 0.6;
        analysis = 'Manual BPM input is outside valid range (110-160). Using default 155.';
      }
      
      console.log('🧪 Using BPM:', bpm);
      
      // Test 2: Extract waveform and generate enhanced Doppler heartbeat
      console.log('🧪 Step 2: Extracting waveform and generating enhanced Doppler heartbeat...');
      
      // Extract waveform from image
      let waveformData = null;
      try {
        const extractedWaveform = await EnhancedWaveformExtractor.extractWaveformFromImage(file);
        if (EnhancedWaveformExtractor.validateWaveform(extractedWaveform)) {
          waveformData = {
            peaks: extractedWaveform.peaks,
            amplitudes: extractedWaveform.amplitudes,
            timing: extractedWaveform.timing,
            doublePulseOffsets: extractedWaveform.doublePulseOffsets,
            confidence: extractedWaveform.confidence,
            extracted: extractedWaveform.extracted
          };
          console.log('🧪 Waveform extraction successful:', extractedWaveform);
          bpm = extractedWaveform.bpm;
          confidence = extractedWaveform.confidence;
          analysis = `Waveform extracted: ${extractedWaveform.peaks.length} peaks, BPM: ${extractedWaveform.bpm}, Confidence: ${(extractedWaveform.confidence * 100).toFixed(1)}%`;
        } else {
          console.log('🧪 Waveform extraction failed, using fallback pattern');
          analysis = 'Waveform extraction failed - using fallback pattern with natural variation';
        }
      } catch (waveformError) {
        console.warn('🧪 Waveform extraction error, using fallback:', waveformError);
        analysis = 'Waveform extraction error - using fallback pattern with natural variation';
      }
      
      const enhancedOptions = {
        bpm: bpm,
        duration: 8.0,
        sampleRate: 44100,
        waveformData: waveformData || undefined,
        hasDoublePulse: true,
        timingVariability: 20, // ±20ms for organic feel
        amplitudeVariation: 0.15, // 15% amplitude variation
        stereo: true, // Enable stereo rendering
        wallFiltering: true, // Enable wall-filtering
        spatialReverb: true // Enable spatial reverb
      };
      
      console.log('🧪 Enhanced Doppler options:', enhancedOptions);
      
      const enhancedResult = await EnhancedAudioGenerator.generateEnhancedDoppler(enhancedOptions);
      
      console.log('🧪 Enhanced Doppler heartbeat generation successful:', enhancedResult);
      console.log('🧪 Audio blob size:', enhancedResult.fileSize, 'bytes');

      // Create result
      const enhancedResultResponse: AudioGenerationResponse = {
        audioUrl: enhancedResult.audioUrl,
        bpm: enhancedResult.bpm,
        isWatermarked: false,
        confidence: confidence,
        method: 'enhanced-doppler',
        source: 'Enhanced Doppler heartbeat synthesis with waveform extraction',
        analysis: analysis
      };
      
      console.log('🧪 Enhanced Doppler result created:', enhancedResultResponse);
      setResult(enhancedResultResponse);
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

  // Enhanced test function to verify enhanced Doppler synthesizer works
  const testDopplerSynthesizer = async () => {
    console.log('🧪 Testing enhanced Doppler synthesizer directly...');
    
    try {
      const enhancedOptions = {
        bpm: 155,
        duration: 8.0,
        sampleRate: 44100,
        hasDoublePulse: true,
        timingVariability: 20, // ±20ms for organic feel
        amplitudeVariation: 0.15, // 15% amplitude variation
        stereo: true, // Enable stereo rendering
        wallFiltering: true, // Enable wall-filtering
        spatialReverb: true // Enable spatial reverb
      };
      
      console.log('🧪 Testing with enhanced options:', enhancedOptions);
      
      const enhancedResult = await EnhancedAudioGenerator.generateEnhancedDoppler(enhancedOptions);
      
      console.log('🧪 Enhanced Doppler test successful:', enhancedResult);
      
      // Create result for display
      const testResult: AudioGenerationResponse = {
        audioUrl: enhancedResult.audioUrl,
        bpm: enhancedResult.bpm,
        isWatermarked: false,
        confidence: 0.95,
        method: 'enhanced-doppler',
        source: 'Direct enhanced Doppler synthesizer test',
        analysis: `Enhanced fetal Doppler ultrasound test audio generated successfully. Features: ${enhancedResult.stereo ? 'Stereo' : 'Mono'}, ${enhancedResult.waveformExtracted ? 'Waveform extracted' : 'Fallback pattern'}, ${enhancedResult.hasDoublePulse ? 'Double-pulse enabled' : 'Single-pulse'}`
      };
      
      setResult(testResult);
      setProcessingState({
        isProcessing: false,
        step: 'complete',
        progress: 100
      });
      
      console.log('🧪 Enhanced Doppler synthesizer test completed successfully!');
      
    } catch (error) {
      console.error('🧪 Enhanced Doppler synthesizer test failed:', error);
      setError(`Enhanced Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingState({
        isProcessing: false,
        step: 'error',
        progress: 0,
        error: `Enhanced Doppler synthesizer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        console.log('🔄 Falling back to manual BPM:', manualBpm);
        gptAnalysis = {
          bpm: parseInt(manualBpm, 10),
          confidence: 0.6,
          beat_times_sec: [],
          double_pulse_offset_ms: null,
          amplitude_scalars: [],
          analysis: `Analysis failed - using manual BPM of ${manualBpm}`,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fetal Doppler Audio Generator
          </h1>
          <p className="text-gray-600">
            Generate realistic fetal heartbeat sounds from ultrasound images
          </p>
        </div>

        {/* Test Functionality */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Audio Generation</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={testBasicFunctionality}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>📝</span>
              Test System Functionality
            </button>
            <button
              onClick={testDopplerSynthesizer}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span>♫</span>
              Test Doppler Synthesizer
            </button>
          </div>
          <p className="text-sm text-gray-600">Check browser console for test results</p>
        </div>

        {/* Manual BPM Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual BPM Input</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="manualBpm" className="text-gray-700 font-medium">
              BPM (110-160):
            </label>
            <input
              id="manualBpm"
              type="number"
              min="110"
              max="160"
              value={manualBpm}
              onChange={(e) => setManualBpm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="155"
            />
                         <button
               onClick={() => selectedImage && testSimpleAudioGeneration(selectedImage)}
               className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
             >
               Generate Audio
             </button>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload your ultrasound image</h2>
                     <ImageUpload
             onImageSelect={handleImageSelect}
           />
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Audio</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">BPM:</span>
                <span className="text-gray-900">{result.bpm}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Method:</span>
                <span className="text-gray-900">{result.method}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Source:</span>
                <span className="text-gray-900">{result.source}</span>
              </div>
              {result.analysis && (
                <div>
                  <span className="text-gray-700 font-medium">Analysis:</span>
                  <p className="text-gray-900 mt-1">{result.analysis}</p>
                </div>
              )}
              <audio controls className="w-full">
                <source src={result.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">Error:</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Processing Status */}
        {processingState.isProcessing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-500">🔄</span>
              <span className="text-blue-700 font-medium">Processing...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingState.progress}%` }}
              ></div>
            </div>
            <p className="text-blue-600 mt-2">{processingState.step}</p>
          </div>
        )}
      </div>
    </div>
  );
}
