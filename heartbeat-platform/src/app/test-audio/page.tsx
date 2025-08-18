'use client'

import React, { useState } from 'react'
import { AudioGenerator } from '@/lib/audio-generator'
import { UltrasoundAnalysis } from '@/lib/gpt-ultrasound-analyzer'

export default function TestAudioPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [bpm, setBpm] = useState(140)

  const generateTestAudio = async () => {
    setIsGenerating(true)
    setAudioUrl(null)

    try {
      // Create mock GPT analysis data for authentic double-pulse pattern
      const mockAnalysis: UltrasoundAnalysis = {
        bpm,
        confidence: 0.95,
        beat_times_sec: [], // Will be auto-generated
        double_pulse_offset_ms: 55, // 55ms offset for whoomp-lub pattern
        amplitude_scalars: [] // Will be auto-generated with gentle variation
      }

      console.log('🎵 Generating realistic fetal Doppler heartbeat at', bpm, 'BPM...')
      
      // Generate authentic fetal Doppler ultrasound audio
      const url = await AudioGenerator.generateFetalDopplerHeartbeat(bpm, 8, mockAnalysis)
      
      setAudioUrl(url)
      console.log('🎵 Audio generated successfully!')
      
    } catch (error) {
      console.error('❌ Audio generation failed:', error)
      alert('Failed to generate audio. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `fetal-doppler-${bpm}bpm.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            🎵 Fetal Doppler Audio Generator
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (BPM)
              </label>
              <input
                type="range"
                min="110"
                max="160"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lg font-semibold text-pink-600 mt-2">
                {bpm} BPM
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Audio Characteristics:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Double-pulse pattern: deeper "whoomp" + softer "lub"</li>
                <li>• Continuous soft wave-like background hum</li>
                <li>• Muffled quality through amniotic fluid simulation</li>
                <li>• Warm, organic, immersive experience</li>
                <li>• No electronic beeps or synthetic tones</li>
                <li>• 8.000s duration, mono 48kHz WAV</li>
              </ul>
            </div>

            <button
              onClick={generateTestAudio}
              disabled={isGenerating}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isGenerating ? 'Generating Audio...' : 'Generate Fetal Doppler Heartbeat'}
            </button>

            {audioUrl && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✓ Audio Generated Successfully!</h3>
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <button
                  onClick={downloadAudio}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Download WAV File
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              ← Back to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
