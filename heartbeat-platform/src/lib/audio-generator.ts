// Enhanced Audio Generation Service
// Creates exact ultrasound Doppler heartbeat audio based on detailed GPT-4 analysis
// Designed to match real fetal ultrasound heartbeat sounds with AI-driven characteristics

import { UltrasoundAnalysis } from './gpt-ultrasound-analyzer';

export interface AudioGenerationOptions {
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  gptAnalysis?: UltrasoundAnalysis; // Enhanced GPT analysis
}

export interface AudioGenerationResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
}

export class AudioGenerator {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate exact ultrasound heartbeat audio based on detailed GPT analysis
   */
  static async generateHeartbeatAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    console.log('🎵 Starting audio generation with options:', options);

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        console.log('🎵 AudioContext created with sample rate:', this.audioContext.sampleRate);
      }

      const audioBuffer = await this.createExactUltrasoundHeartbeatWaveform(options);
      console.log('🎵 Audio buffer created successfully');

      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      console.log('🎵 Audio blob created, size:', audioBlob.size, 'bytes');

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size
      };
    } catch (error) {
      console.error('❌ Audio generation failed:', error);
      throw new Error('Failed to generate heartbeat audio');
    }
  }

  /**
   * Create exact ultrasound Doppler heartbeat waveform based on detailed GPT analysis
   */
  private static async createExactUltrasoundHeartbeatWaveform(options: AudioGenerationOptions): Promise<AudioBuffer> {
    const { bpm, duration, sampleRate, gptAnalysis } = options;

    console.log('🎵 Creating waveform with BPM:', bpm, 'Duration:', duration, 'Sample Rate:', sampleRate);

    const beatsPerSecond = bpm / 60;
    const beatInterval = 1 / beatsPerSecond;
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total beats in duration:', Math.floor(duration * beatsPerSecond));

    for (let i = 0; i < duration; i += beatInterval) {
      const beatStart = Math.floor(i * sampleRate);
      const beatEnd = Math.floor((i + 0.6) * sampleRate); // Each beat lasts 0.6 seconds
      this.addExactUltrasoundHeartbeat(channelData, beatStart, beatEnd, sampleRate, options.isWatermarked, gptAnalysis);
    }

    console.log('🎵 Waveform creation completed');
    return buffer;
  }

  /**
   * Add exact ultrasound Doppler heartbeat sound using GPT analysis
   */
  private static addExactUltrasoundHeartbeat(
    channelData: Float32Array,
    startSample: number,
    endSample: number,
    sampleRate: number,
    isWatermarked: boolean,
    gptAnalysis?: UltrasoundAnalysis
  ) {
    const beatDuration = endSample - startSample;
    console.log('🎵 Adding heartbeat at sample', startSample, 'to', endSample, 'duration:', beatDuration);

    // Use GPT analysis for precise audio characteristics
    const characteristics = gptAnalysis?.audioCharacteristics || {
      systolicIntensity: 0.85,
      diastolicIntensity: 0.6,
      frequencyRange: {
        systolic: { min: 100, max: 200 },
        diastolic: { min: 70, max: 100 }
      },
      rhythm: 'regular',
      backgroundNoiseLevel: 'low'
    };

    console.log('🎵 Using audio characteristics:', characteristics);

    // Apply rhythm variations if irregular
    let rhythmVariation = 1.0;
    if (characteristics.rhythm === 'irregular') {
      rhythmVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2 variation
    } else if (characteristics.rhythm === 'variable') {
      rhythmVariation = 0.9 + Math.random() * 0.2; // 0.9-1.1 variation
    }

    // Real fetal ultrasound has two distinct "whoosh" sounds with specific characteristics
    // First whoosh (systolic - blood rushing into the heart)
    const firstWhooshDuration = Math.floor(beatDuration * 0.35 * rhythmVariation);
    this.addExactUltrasoundWhoosh(
      channelData,
      startSample,
      firstWhooshDuration,
      characteristics.frequencyRange.systolic,
      characteristics.systolicIntensity,
      'moderate', // Default Doppler effect
      sampleRate,
      'systolic'
    );

    // Brief pause (realistic timing)
    const pauseDuration = Math.floor(beatDuration * 0.1);

    // Second whoosh (diastolic - blood flowing out)
    const secondWhooshStart = startSample + firstWhooshDuration + pauseDuration;
    const secondWhooshDuration = Math.floor(beatDuration * 0.35 * rhythmVariation);
    this.addExactUltrasoundWhoosh(
      channelData,
      secondWhooshStart,
      secondWhooshDuration,
      characteristics.frequencyRange.diastolic,
      characteristics.diastolicIntensity,
      'moderate', // Default Doppler effect
      sampleRate,
      'diastolic'
    );

    // Add authentic ultrasound background noise based on GPT analysis
    this.addExactUltrasoundBackgroundNoise(
      channelData,
      startSample,
      endSample,
      sampleRate,
      characteristics.backgroundNoiseLevel
    );

    // Add watermark if needed
    if (isWatermarked) {
      this.addWatermark(channelData, startSample, endSample, sampleRate);
    }
  }

  /**
   * Add exact ultrasound "whoosh" sound with GPT-driven characteristics
   */
  private static addExactUltrasoundWhoosh(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    frequencyRange: { min: number; max: number },
    intensity: number,
    dopplerEffect: 'strong' | 'moderate' | 'weak',
    sampleRate: number,
    type: 'systolic' | 'diastolic'
  ) {
    console.log('🎵 Adding', type, 'whoosh with frequency range:', frequencyRange, 'intensity:', intensity);

    const dopplerMultiplier = dopplerEffect === 'strong' ? 1.5 : dopplerEffect === 'moderate' ? 1.0 : 0.5;

    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const time = i / sampleRate;
      const decay = Math.exp(-time * 15); // Very sharp decay for authentic ultrasound

      // Create exact frequency sweep (Doppler effect) with GPT-driven ranges
      let freqSweep: number;
      if (type === 'systolic') {
        // Systolic: frequency increases sharply then decreases (blood rushing in)
        const baseFreq = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.5;
        freqSweep = baseFreq + Math.sin(time * Math.PI * 3) * (frequencyRange.max - frequencyRange.min) * 0.5 * dopplerMultiplier;
      } else {
        // Diastolic: frequency decreases then increases (blood flowing out)
        const baseFreq = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.5;
        freqSweep = baseFreq - Math.sin(time * Math.PI * 2.5) * (frequencyRange.max - frequencyRange.min) * 0.4 * dopplerMultiplier;
      }

      // Main whoosh sound with exact harmonics
      const whoosh = Math.sin(time * freqSweep * 2 * Math.PI) * decay * intensity;

      // Add exact harmonics for authentic ultrasound sound
      const harmonic1 = Math.sin(time * freqSweep * 2 * 2 * Math.PI) * decay * intensity * 0.6;
      const harmonic2 = Math.sin(time * freqSweep * 3 * 2 * Math.PI) * decay * intensity * 0.4;
      const harmonic3 = Math.sin(time * freqSweep * 4 * 2 * Math.PI) * decay * intensity * 0.2;

      // Add subtle modulation for exact realism
      const modulation = Math.sin(time * 25 * 2 * Math.PI) * 0.15;

      // Combine all components for authentic sound
      channelData[sampleIndex] += (whoosh + harmonic1 + harmonic2 + harmonic3) * (1 + modulation);
    }
  }

  /**
   * Add exact ultrasound background noise based on GPT analysis
   */
  private static addExactUltrasoundBackgroundNoise(
    channelData: Float32Array,
    startSample: number,
    endSample: number,
    sampleRate: number,
    noiseLevel: 'low' | 'medium' | 'high'
  ) {
    const noiseMultiplier = noiseLevel === 'high' ? 1.5 : noiseLevel === 'medium' ? 1.0 : 0.5;
    console.log('🎵 Adding background noise with level:', noiseLevel, 'multiplier:', noiseMultiplier);

    for (let i = startSample; i < endSample; i++) {
      if (i >= channelData.length) break;

      const time = (i - startSample) / sampleRate;
      const decay = Math.exp(-time * 1.5);

      // Exact high-frequency ultrasound noise characteristics
      const noise1 = (Math.random() - 0.5) * 0.025 * decay * noiseMultiplier;
      const noise2 = Math.sin(time * 18000 * 2 * Math.PI) * 0.012 * decay * noiseMultiplier;
      const noise3 = Math.sin(time * 12000 * 2 * Math.PI) * 0.008 * decay * noiseMultiplier;
      const noise4 = Math.sin(time * 9000 * 2 * Math.PI) * 0.005 * decay * noiseMultiplier;

      channelData[i] += noise1 + noise2 + noise3 + noise4;
    }
  }

  /**
   * Add watermark to audio
   */
  private static addWatermark(channelData: Float32Array, startSample: number, endSample: number, sampleRate: number) {
    // Add a very subtle high-frequency watermark
    const watermarkFreq = 15000; // 15kHz watermark
    const watermarkAmplitude = 0.015; // Very subtle

    for (let i = startSample; i < endSample; i++) {
      if (i >= channelData.length) break;

      const time = (i - startSample) / sampleRate;
      const watermark = Math.sin(time * watermarkFreq * 2 * Math.PI) * watermarkAmplitude;
      channelData[i] += watermark;
    }
  }

  /**
   * Convert AudioBuffer to Blob
   */
  private static async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    console.log('🎵 Converting AudioBuffer to Blob...');
    const wavBuffer = this.createWAVFile(audioBuffer);
    console.log('🎵 WAV file created, size:', wavBuffer.byteLength, 'bytes');
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /**
   * Create WAV file from AudioBuffer
   */
  private static createWAVFile(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    console.log('🎵 Creating WAV file with parameters:', {
      length, sampleRate, channels, bitsPerSample, dataSize, bufferSize
    });

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
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    console.log('🎵 WAV file creation completed');
    return buffer;
  }

  /**
   * Generate realistic "lub-dub" heartbeat sound with natural rhythm
   * Creates authentic heartbeat audio with deep bass "lub" and softer "dub"
   * Now enhanced with GPT analysis for more accurate characteristics
   */
  static async generateRealisticHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Generating realistic lub-dub heartbeat with BPM:', bpm, 'Duration:', duration);
    console.log('🎵 GPT Analysis:', gptAnalysis);

    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const channelData = buffer.getChannelData(0);

      const beatsPerSecond = bpm / 60;
      const beatInterval = 1 / beatsPerSecond;

      console.log('🎵 Audio parameters:', {
        sampleRate, duration, beatsPerSecond, beatInterval,
        totalBeats: Math.floor(duration * beatsPerSecond)
      });

      // Use GPT analysis for precise characteristics, with fallback defaults
      const characteristics = gptAnalysis?.audioCharacteristics || {
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular' as const,
        clarity: 'moderate' as const,
        backgroundNoise: 'medium' as const,
        dopplerEffect: 'moderate' as const
      };

      console.log('🎵 Using GPT-enhanced characteristics:', characteristics);

      for (let time = 0; time < duration; time += beatInterval) {
        const startSample = Math.floor(time * sampleRate);
        const beatEnd = Math.floor((time + 0.8) * sampleRate); // Beat duration 0.8s for lub-dub

        // Apply rhythm variations based on GPT analysis
        let rhythmVariation = 1.0;
        if (characteristics.rhythm === 'irregular') {
          rhythmVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2 variation
        } else if (characteristics.rhythm === 'variable') {
          rhythmVariation = 0.9 + Math.random() * 0.2; // 0.9-1.1 variation
        }

        // Create realistic lub-dub pattern with GPT-driven characteristics
        for (let i = startSample; i < beatEnd && i < channelData.length; i++) {
          const t = (i - startSample) / sampleRate;
          const decay = Math.exp(-t * 8); // Natural decay

          // "Lub" - Deep bass thump (first sound) using GPT systolic characteristics
          if (t < 0.15 * rhythmVariation) {
            // Use GPT frequency range for systolic sound
            const baseFreq = characteristics.frequencyRange.systolic.min + 
              (characteristics.frequencyRange.systolic.max - characteristics.frequencyRange.systolic.min) * 0.5;
            const lubFreq = baseFreq + Math.sin(t * Math.PI * 2) * 20;
            const lub = Math.sin(t * lubFreq * 2 * Math.PI) * decay * characteristics.systolicIntensity;
            
            // Add harmonics for richness
            const harmonic1 = Math.sin(t * lubFreq * 2 * 2 * Math.PI) * decay * characteristics.systolicIntensity * 0.4;
            const harmonic2 = Math.sin(t * lubFreq * 3 * 2 * Math.PI) * decay * characteristics.systolicIntensity * 0.2;
            
            // Add subtle modulation for natural sound
            const modulation = Math.sin(t * 15 * 2 * Math.PI) * 0.1;
            
            channelData[i] = (lub + harmonic1 + harmonic2) * (1 + modulation);
          }
          // Brief pause between lub and dub
          else if (t < 0.25 * rhythmVariation) {
            channelData[i] = 0;
          }
          // "Dub" - Softer, shorter sound (second sound) using GPT diastolic characteristics
          else if (t < 0.45 * rhythmVariation) {
            // Use GPT frequency range for diastolic sound
            const baseFreq = characteristics.frequencyRange.diastolic.min + 
              (characteristics.frequencyRange.diastolic.max - characteristics.frequencyRange.diastolic.min) * 0.5;
            const dubFreq = baseFreq + Math.sin((t - 0.25) * Math.PI * 3) * 40;
            const dub = Math.sin((t - 0.25) * dubFreq * 2 * Math.PI) * decay * characteristics.diastolicIntensity;
            
            // Add harmonics for the dub
            const harmonic1 = Math.sin((t - 0.25) * dubFreq * 2 * 2 * Math.PI) * decay * characteristics.diastolicIntensity * 0.25;
            const harmonic2 = Math.sin((t - 0.25) * dubFreq * 3 * 2 * Math.PI) * decay * characteristics.diastolicIntensity * 0.1;
            
            channelData[i] = (dub + harmonic1 + harmonic2);
          }
          // Rest period
          else if (t < 0.8) {
            channelData[i] = 0;
          }
        }

        // Add background noise based on GPT analysis
            if (characteristics.backgroundNoiseLevel !== 'low') {
      const noiseMultiplier = characteristics.backgroundNoiseLevel === 'high' ? 0.02 : 0.01;
          for (let i = startSample; i < beatEnd && i < channelData.length; i++) {
            const noise = (Math.random() - 0.5) * noiseMultiplier;
            channelData[i] += noise;
          }
        }
      }

      // Convert to blob
      const wavBuffer = this.createWAVFile(buffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      console.log('🎵 GPT-enhanced realistic heartbeat generation completed, blob size:', blob.size, 'bytes');
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('❌ Realistic heartbeat generation failed:', error);
      // Fallback to demo audio
      return '/demo-heartbeat.mp3';
    }
  }

  /**
   * Generate exact ultrasound-style heartbeat sound using GPT analysis
   * This creates the most authentic ultrasound Doppler heartbeat audio
   */
  static async generateSimpleHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Generating simple heartbeat with BPM:', bpm, 'Duration:', duration);
    console.log('🎵 GPT Analysis:', gptAnalysis);

    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const channelData = buffer.getChannelData(0);

      const beatsPerSecond = bpm / 60;
      const beatInterval = 1 / beatsPerSecond;

      console.log('🎵 Audio parameters:', {
        sampleRate, duration, beatsPerSecond, beatInterval,
        totalBeats: Math.floor(duration * beatsPerSecond)
      });

      // Use GPT analysis for precise characteristics
      const characteristics = gptAnalysis?.audioCharacteristics || {
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular' as const,
        clarity: 'moderate' as const,
        backgroundNoise: 'medium' as const,
        dopplerEffect: 'moderate' as const
      };

      console.log('🎵 Using characteristics:', characteristics);

      for (let time = 0; time < duration; time += beatInterval) {
        const startSample = Math.floor(time * sampleRate);
        const beatEnd = Math.floor((time + 0.6) * sampleRate); // Beat duration 0.6s

        // Apply rhythm variations
        let rhythmVariation = 1.0;
        if (characteristics.rhythm === 'irregular') {
          rhythmVariation = 0.8 + Math.random() * 0.4;
        } else if (characteristics.rhythm === 'variable') {
          rhythmVariation = 0.9 + Math.random() * 0.2;
        }

        // Create exact ultrasound heartbeat pattern
        for (let i = startSample; i < beatEnd && i < channelData.length; i++) {
          const t = (i - startSample) / sampleRate;
          const decay = Math.exp(-t * 12); // Sharp decay for exact ultrasound

          // First whoosh (systolic) - blood rushing in
          if (t < 0.21 * rhythmVariation) {
            const baseFreq = characteristics.frequencyRange.systolic.min +
              (characteristics.frequencyRange.systolic.max - characteristics.frequencyRange.systolic.min) * 0.5;
            const freq = baseFreq + Math.sin(t * Math.PI * 3) * (characteristics.frequencyRange.systolic.max - characteristics.frequencyRange.systolic.min) * 0.5;
            const whoosh = Math.sin(t * freq * 2 * Math.PI) * decay * characteristics.systolicIntensity;
            const harmonic1 = Math.sin(t * freq * 4 * 2 * Math.PI) * decay * characteristics.systolicIntensity * 0.6;
            const harmonic2 = Math.sin(t * freq * 6 * 2 * Math.PI) * decay * characteristics.systolicIntensity * 0.4;
            channelData[i] = whoosh + harmonic1 + harmonic2;
          }
          // Brief pause
          else if (t < 0.27 * rhythmVariation) {
            channelData[i] = 0;
          }
          // Second whoosh (diastolic) - blood flowing out
          else if (t < 0.48 * rhythmVariation) {
            const baseFreq = characteristics.frequencyRange.diastolic.min +
              (characteristics.frequencyRange.diastolic.max - characteristics.frequencyRange.diastolic.min) * 0.5;
            const freq = baseFreq - Math.sin((t - 0.27) * Math.PI * 2.5) * (characteristics.frequencyRange.diastolic.max - characteristics.frequencyRange.diastolic.min) * 0.4;
            const whoosh = Math.sin((t - 0.27) * freq * 2 * Math.PI) * decay * characteristics.diastolicIntensity;
            const harmonic1 = Math.sin((t - 0.27) * freq * 3 * 2 * Math.PI) * decay * characteristics.diastolicIntensity * 0.4;
            const harmonic2 = Math.sin((t - 0.27) * freq * 5 * 2 * Math.PI) * decay * characteristics.diastolicIntensity * 0.2;
            channelData[i] = whoosh + harmonic1 + harmonic2;
          }
          // Add exact ultrasound background noise
          else if (t < 0.6) {
            const noiseMultiplier = characteristics.backgroundNoiseLevel === 'high' ? 1.5 : characteristics.backgroundNoiseLevel === 'medium' ? 1.0 : 0.5;
            const noise1 = (Math.random() - 0.5) * 0.035 * decay * noiseMultiplier;
            const noise2 = Math.sin(t * 18000 * 2 * Math.PI) * 0.018 * decay * noiseMultiplier;
            const noise3 = Math.sin(t * 12000 * 2 * Math.PI) * 0.012 * decay * noiseMultiplier;
            channelData[i] = noise1 + noise2 + noise3;
          }
        }
      }

      // Convert to blob
      const wavBuffer = this.createWAVFile(buffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      console.log('🎵 Audio generation completed, blob size:', blob.size, 'bytes');
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('❌ Simple audio generation failed:', error);
      // Fallback to demo audio
      return '/demo-heartbeat.mp3';
    }
  }

  /**
   * Generate authentic fetal ultrasound heartbeat sound
   * Focus on clear heartbeat pattern with minimal background noise
   */
  static async generateFetalDopplerHeartbeat(bpm: number, duration: number = 5, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Generating authentic fetal ultrasound heartbeat at', bpm, 'BPM for', duration, 'seconds');

    try {
      // Audio settings
      const sampleRate = 48000;
      const bitDepth = 24;
      const channels = 1;
      const totalSamples = Math.floor(duration * sampleRate);
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const buffer = audioContext.createBuffer(channels, totalSamples, sampleRate);
      const channelData = buffer.getChannelData(0);

      // Use GPT analysis for precise audio characteristics
      const characteristics = (gptAnalysis?.audioCharacteristics as any) || {
        systolicIntensity: 0.85,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 100, max: 200 },
          diastolic: { min: 70, max: 100 }
        },
        rhythm: 'regular',
        backgroundNoiseLevel: 'low'
      };

      console.log('🎵 Using audio characteristics:', characteristics);

      // Calculate beat timing
      const beatInterval = 60 / bpm; // seconds per beat
      const beatSamples = Math.floor(beatInterval * sampleRate);
      const totalBeats = Math.floor(duration / beatInterval);

      console.log(`🎵 Beat interval: ${beatInterval}s, ${beatSamples} samples, ${totalBeats} total beats`);

      // Generate very subtle background (minimal whoosh)
      this.generateMinimalBackground(channelData, sampleRate, duration, characteristics);

      // Add prominent lub-dub beats
      for (let beat = 0; beat < totalBeats; beat++) {
        const beatStart = beat * beatSamples;
        
        // Add timing jitter (±5ms)
        const jitterMs = (Math.random() - 0.5) * 10; // ±5ms
        const jitterSamples = Math.floor(jitterMs * sampleRate / 1000);
        const adjustedStart = Math.max(0, beatStart + jitterSamples);
        
        // Generate clear lub-dub pattern
        this.addClearLubDubBeat(
          channelData,
          adjustedStart,
          beatSamples,
          sampleRate,
          characteristics,
          beat
        );
      }

      // Apply gentle processing
      this.applyGentleProcessing(channelData, sampleRate);

      // Convert to WAV
      const wavBlob = this.bufferToWav(buffer, bitDepth);
      const audioUrl = URL.createObjectURL(wavBlob);

      console.log('🎵 Authentic fetal ultrasound heartbeat generated successfully');
      return audioUrl;

    } catch (error) {
      console.error('❌ Error generating fetal ultrasound heartbeat:', error);
      throw new Error('Failed to generate fetal ultrasound heartbeat');
    }
  }

  /**
   * Generate minimal background noise for authentic ultrasound sound
   */
  private static generateMinimalBackground(
    channelData: Float32Array,
    sampleRate: number,
    duration: number,
    characteristics: any
  ) {
    // Handle different interface versions
    const backgroundNoiseLevel = characteristics.backgroundNoiseLevel || characteristics.backgroundNoise || 'low';
    const backgroundLevel = backgroundNoiseLevel === 'high' ? 0.008 : 
                           backgroundNoiseLevel === 'medium' ? 0.005 : 0.002;

    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Very subtle low hum (30-60 Hz)
      const lowHum = Math.sin(2 * Math.PI * 45 * time) * backgroundLevel * 0.3;
      
      // Minimal swish (600-1200 Hz)
      const swish = Math.sin(2 * Math.PI * 900 * time) * backgroundLevel * 0.2;
      
      // Very light noise
      const noise = (Math.random() - 0.5) * backgroundLevel * 0.1;
      
      channelData[i] = lowHum + swish + noise;
    }
  }

  /**
   * Add clear lub-dub beat with prominent heartbeat sound
   */
  private static addClearLubDubBeat(
    channelData: Float32Array,
    startSample: number,
    beatSamples: number,
    sampleRate: number,
    characteristics: any,
    beatIndex: number
  ) {
    const lubDuration = Math.floor(beatSamples * 0.18); // 18% of beat for lub
    const dubDuration = Math.floor(beatSamples * 0.15); // 15% of beat for dub
    const pauseDuration = Math.floor(beatSamples * 0.06); // 6% pause between lub-dub
    
    const lubStart = startSample;
    const dubStart = lubStart + lubDuration + pauseDuration;
    
    // Add intensity variation (±2 dB)
    const intensityVariation = 1.0 + (Math.random() - 0.5) * 0.3; // ±15%
    
    // Generate prominent lub (systolic)
    this.addProminentLubSound(
      channelData,
      lubStart,
      lubDuration,
      sampleRate,
      characteristics.systolicIntensity * intensityVariation,
      characteristics.frequencyRange.systolic
    );
    
    // Generate prominent dub (diastolic)
    this.addProminentDubSound(
      channelData,
      dubStart,
      dubDuration,
      sampleRate,
      characteristics.diastolicIntensity * intensityVariation,
      characteristics.frequencyRange.diastolic
    );
  }

  /**
   * Add prominent lub (systolic) sound
   */
  private static addProminentLubSound(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    sampleRate: number,
    intensity: number,
    frequencyRange: { min: number; max: number }
  ) {
    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const decay = Math.exp(-time * 6); // Slower decay for more presence
      
      // Fundamental frequency with harmonics
      const fundamental = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.7;
      const lub = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity * 1.2;
      
      // Add harmonics for warmth
      const harmonic1 = Math.sin(2 * Math.PI * fundamental * 2 * time) * decay * intensity * 0.4;
      const harmonic2 = Math.sin(2 * Math.PI * fundamental * 3 * time) * decay * intensity * 0.2;
      
      // Add to existing background (more prominent)
      channelData[sampleIndex] += (lub + harmonic1 + harmonic2) * 0.8;
    }
  }

  /**
   * Add prominent dub (diastolic) sound
   */
  private static addProminentDubSound(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    sampleRate: number,
    intensity: number,
    frequencyRange: { min: number; max: number }
  ) {
    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const decay = Math.exp(-time * 5); // Slower decay for more presence
      
      // Fundamental frequency with harmonics
      const fundamental = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.5;
      const dub = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity * 1.0;
      
      // Add harmonics for warmth
      const harmonic1 = Math.sin(2 * Math.PI * fundamental * 2 * time) * decay * intensity * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * fundamental * 3 * time) * decay * intensity * 0.15;
      
      // Add to existing background (more prominent)
      channelData[sampleIndex] += (dub + harmonic1 + harmonic2) * 0.7;
    }
  }

  /**
   * Apply gentle processing for authentic ultrasound sound
   */
  private static applyGentleProcessing(channelData: Float32Array, sampleRate: number) {
    // Gentle compression
    for (let i = 0; i < channelData.length; i++) {
      // Soft clipping to prevent distortion
      channelData[i] = Math.tanh(channelData[i] * 0.8) * 0.9;
    }
  }

  /**
   * Add authentic OB-GYN Doppler ultrasound background with natural fluid characteristics
   */
  private static addAuthenticOBGYNDopplerBackground(
    channelData: Float32Array,
    startSample: number,
    endSample: number,
    sampleRate: number,
    characteristics: any
  ) {
    // Handle different interface versions
    const backgroundNoiseLevel = characteristics.backgroundNoiseLevel || characteristics.backgroundNoise || 'low';
    const noiseMultiplier = backgroundNoiseLevel === 'high' ? 0.018 : 
                           backgroundNoiseLevel === 'medium' ? 0.012 : 0.006;

    for (let i = startSample; i < endSample; i++) {
      if (i >= channelData.length) break;

      const time = (i - startSample) / sampleRate;
      const decay = Math.exp(-time * 1.8);

      // Authentic OB-GYN Doppler ultrasound background noise
      const dopplerNoise1 = (Math.random() - 0.5) * noiseMultiplier * decay;
      const dopplerNoise2 = Math.sin(time * 10000 * 2 * Math.PI) * noiseMultiplier * 0.35 * decay;
      const dopplerNoise3 = Math.sin(time * 5000 * 2 * Math.PI) * noiseMultiplier * 0.25 * decay;
      
      // Natural "amniotic fluid" effects
      const amnioticFluid = Math.sin(time * 35 * 2 * Math.PI) * noiseMultiplier * 0.45 * decay;
      const amnioticWhoosh = Math.sin(time * 22 * 2 * Math.PI) * noiseMultiplier * 0.28 * decay;
      
      // Natural body tissue and movement sounds
      const bodyTissue = Math.sin(time * 10 * 2 * Math.PI) * noiseMultiplier * 0.35 * decay;
      const movement = Math.sin(time * 5 * 2 * Math.PI) * noiseMultiplier * 0.22 * decay;
      
      // Natural echo-like quality through amniotic fluid
      const echoEffect = Math.sin(time * 48 * 2 * Math.PI) * noiseMultiplier * 0.18 * decay;
      
      // Warm, natural muffled quality
      const warmMuffle = Math.sin(time * 19 * 2 * Math.PI) * noiseMultiplier * 0.32 * decay;

      // Natural fluid flow sounds
      const fluidFlow = Math.sin(time * 15 * 2 * Math.PI) * noiseMultiplier * 0.25 * decay;
      const gentleWhoosh = Math.sin(time * 32 * 2 * Math.PI) * noiseMultiplier * 0.2 * decay;

      channelData[i] += dopplerNoise1 + dopplerNoise2 + dopplerNoise3 + amnioticFluid + 
                       amnioticWhoosh + bodyTissue + movement + echoEffect + warmMuffle +
                       fluidFlow + gentleWhoosh;
    }
  }

  /**
   * Generate continuous warm whoosh background matching YouTube reference
   */
  private static generateContinuousDopplerBackground(
    channelData: Float32Array,
    sampleRate: number,
    duration: number
  ) {
    console.log('🎵 Generating continuous Doppler background');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Low hum (30-60 Hz) - warm foundation
      const lowHum = Math.sin(2 * Math.PI * 45 * time) * 0.15;
      
      // Mid-high swish (600-1200 Hz) - characteristic Doppler sound
      const swish = Math.sin(2 * Math.PI * 900 * time) * 0.1;
      
      // Pink noise characteristics for natural warmth
      const noise = (Math.random() - 0.5) * 0.05;
      
      // Gentle Doppler wobble
      const wobble = Math.sin(2 * Math.PI * 1.5 * time) * 0.02;
      
      channelData[i] = lowHum + swish + noise + wobble;
    }
  }

  /**
   * Add lub-dub beat with natural variation
   */
  private static addLubDubBeat(
    channelData: Float32Array,
    startSample: number,
    beatSamples: number,
    sampleRate: number,
    characteristics: any,
    beatIndex: number
  ) {
    const lubDuration = Math.floor(beatSamples * 0.15); // 15% of beat for lub
    const dubDuration = Math.floor(beatSamples * 0.12); // 12% of beat for dub
    const pauseDuration = Math.floor(beatSamples * 0.08); // 8% pause between lub-dub
    
    const lubStart = startSample;
    const dubStart = lubStart + lubDuration + pauseDuration;
    
    // Add intensity variation (±2 dB)
    const intensityVariation = 1.0 + (Math.random() - 0.5) * 0.4; // ±20%
    
    // Generate lub (systolic)
    this.addLubSound(
      channelData,
      lubStart,
      lubDuration,
      sampleRate,
      characteristics.systolicIntensity * intensityVariation,
      characteristics.frequencyRange.systolic
    );
    
    // Generate dub (diastolic)
    this.addDubSound(
      channelData,
      dubStart,
      dubDuration,
      sampleRate,
      characteristics.diastolicIntensity * intensityVariation,
      characteristics.frequencyRange.diastolic
    );
  }

  /**
   * Add lub (systolic) sound
   */
  private static addLubSound(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    sampleRate: number,
    intensity: number,
    frequencyRange: { min: number; max: number }
  ) {
    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const decay = Math.exp(-time * 8); // Natural decay
      
      // Fundamental frequency with harmonics
      const fundamental = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.6;
      const lub = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity * 0.8;
      
      // Add harmonics for warmth
      const harmonic1 = Math.sin(2 * Math.PI * fundamental * 2 * time) * decay * intensity * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * fundamental * 3 * time) * decay * intensity * 0.15;
      
      // Add to existing background (blend, don't replace)
      channelData[sampleIndex] += (lub + harmonic1 + harmonic2) * 0.6;
    }
  }

  /**
   * Add dub (diastolic) sound
   */
  private static addDubSound(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    sampleRate: number,
    intensity: number,
    frequencyRange: { min: number; max: number }
  ) {
    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const decay = Math.exp(-time * 10); // Slightly faster decay for dub
      
      // Fundamental frequency with harmonics
      const fundamental = frequencyRange.min + (frequencyRange.max - frequencyRange.min) * 0.4;
      const dub = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity * 0.6;
      
      // Add harmonics for warmth
      const harmonic1 = Math.sin(2 * Math.PI * fundamental * 2 * time) * decay * intensity * 0.2;
      const harmonic2 = Math.sin(2 * Math.PI * fundamental * 3 * time) * decay * intensity * 0.1;
      
      // Add to existing background (blend, don't replace)
      channelData[sampleIndex] += (dub + harmonic1 + harmonic2) * 0.4;
    }
  }

  /**
   * Apply final Doppler post-processing
   */
  private static applyDopplerPostProcessing(
    channelData: Float32Array,
    sampleRate: number
  ) {
    // Apply gentle compression to keep peaks blended with background
    for (let i = 0; i < channelData.length; i++) {
      // Soft clipping to prevent harsh peaks
      channelData[i] = Math.tanh(channelData[i] * 0.8) * 1.2;
      
      // Gentle low-pass filter effect
      if (i > 0) {
        channelData[i] = channelData[i] * 0.9 + channelData[i - 1] * 0.1;
      }
    }
    
    // Normalize to prevent clipping
    let maxAmplitude = 0;
    for (let i = 0; i < channelData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    
    if (maxAmplitude > 0) {
      const normalizeFactor = 0.8 / maxAmplitude; // Leave headroom
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= normalizeFactor;
      }
    }
  }

  /**
   * Convert audio buffer to WAV format
   */
  private static bufferToWav(buffer: AudioBuffer, bitDepth: number): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * (bitDepth / 8));
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * (bitDepth / 8), true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * (bitDepth / 8), true);
    
    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const value = Math.round(sample * (Math.pow(2, bitDepth - 1) - 1));
      
      if (bitDepth === 16) {
        view.setInt16(offset, value, true);
        offset += 2;
      } else if (bitDepth === 24) {
        view.setInt8(offset, value & 0xFF);
        view.setInt8(offset + 1, (value >> 8) & 0xFF);
        view.setInt8(offset + 2, (value >> 16) & 0xFF);
        offset += 3;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}
