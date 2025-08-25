// Realistic Fetal Doppler Ultrasound Synthesizer
// Creates authentic fetal heartbeat sounds using noise-driven pulses
// Matches real Doppler acoustic properties: 150-300 Hz thump + high-frequency hiss
// Dynamic background modulation with organic timing variations

import { WaveformData } from './waveform-extractor';

export interface RealisticDopplerOptions {
  waveformData: WaveformData;
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  stereo: boolean;
}

export interface RealisticDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  waveformUsed: boolean;
}

export class RealisticDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateRealisticDopplerAudio(options: RealisticDopplerOptions): Promise<RealisticDopplerResult> {
    console.log('🎵 Starting realistic Doppler synthesis');

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioBuffer = await this.createRealisticDopplerWaveform(options);
      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        waveformUsed: options.waveformData.hasWaveform
      };
    } catch (error) {
      console.error('❌ Realistic Doppler synthesis failed:', error);
      throw new Error('Failed to generate realistic Doppler heartbeat audio');
    }
  }

  /**
   * Create realistic Doppler ultrasound waveform
   */
  private static async createRealisticDopplerWaveform(options: RealisticDopplerOptions): Promise<AudioBuffer> {
    const { waveformData, sampleRate, stereo } = options;
    const duration = 8.000; // Fixed duration

    console.log('🎵 Creating realistic Doppler waveform');

    const channels = stereo ? 2 : 1;
    const buffer = this.audioContext!.createBuffer(channels, sampleRate * duration, sampleRate);

    // Prepare beat timing data with organic variations
    const beatData = this.prepareBeatDataWithOrganicVariations(waveformData, options.bpm, duration);
    
    console.log('🎵 Beat data prepared:', { 
      beatCount: beatData.times.length, 
      hasDoublePulse: beatData.doublePulseOffsets.some(offset => offset !== null)
    });

    // Generate realistic Doppler audio for each channel
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate dynamic background noise floor
      this.generateDynamicBackground(channelData, sampleRate, beatData, channel);
      
      // Generate noise-driven heartbeat pulses
      this.generateNoiseDrivenHeartbeats(channelData, sampleRate, beatData, channel);
      
      // Apply realistic Doppler processing
      this.applyRealisticDopplerProcessing(channelData, sampleRate, channel);
    }

    // Add watermark if needed
    if (options.isWatermarked) {
      this.addWatermark(buffer, sampleRate);
    }

    console.log('🎵 Realistic Doppler waveform creation completed');
    return buffer;
  }

  /**
   * Prepare beat data with organic timing variations
   */
  private static prepareBeatDataWithOrganicVariations(waveformData: WaveformData, bpm: number, duration: number) {
    if (waveformData.hasWaveform && waveformData.beatTimes.length > 0) {
      return {
        times: waveformData.beatTimes,
        amplitudes: waveformData.amplitudes,
        doublePulseOffsets: waveformData.doublePulseOffsets,
        isExtracted: true
      };
    } else {
      // Generate fallback pattern with organic variations
      const baseInterval = 60 / bpm;
      const startTime = 0.2;
      const times: number[] = [];
      const amplitudes: number[] = [];
      const doublePulseOffsets: (number | null)[] = [];
      
      let currentTime = startTime;
      while (currentTime < duration) {
        // Add organic timing variability (±10-20ms as specified)
        const jitter = (Math.random() - 0.5) * 0.03; // ±15ms variation
        const interval = baseInterval + jitter;
        
        times.push(Number(currentTime.toFixed(3)));
        
        // Natural amplitude variation
        const baseAmplitude = 0.9;
        const amplitudeVariation = 1.0 + (Math.random() - 0.5) * 0.2;
        amplitudes.push(Math.max(0.75, Math.min(1.0, baseAmplitude * amplitudeVariation)));
        
        // Add double pulse (systolic/diastolic) - common in fetal heartbeats
        const hasDoublePulse = Math.random() > 0.1; // 90% chance
        if (hasDoublePulse) {
          const spacing = 0.05 + (Math.random() - 0.5) * 0.015; // 42.5-57.5ms spacing
          doublePulseOffsets.push(Number((spacing * 1000).toFixed(1)));
        } else {
          doublePulseOffsets.push(null);
        }
        
        currentTime += interval;
      }
      
      return {
        times,
        amplitudes,
        doublePulseOffsets,
        isExtracted: false
      };
    }
  }

  /**
   * Generate dynamic background noise floor
   */
  private static generateDynamicBackground(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating dynamic background noise floor');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Calculate distance to nearest beat for dynamic modulation
      const distanceToBeat = this.getDistanceToNearestBeat(time, beatData.times);
      
      // Create warm, fluid background noise
      // Use multiple noise bands to create organic texture
      let background = 0;
      
      // Low-frequency warmth (100-400 Hz)
      const warmFreq = 200 + Math.sin(time * 0.1) * 100;
      background += Math.sin(2 * Math.PI * warmFreq * time) * 0.08;
      
      // Mid-frequency body (400-800 Hz)
      const bodyFreq = 600 + Math.sin(time * 0.2) * 200;
      background += Math.sin(2 * Math.PI * bodyFreq * time) * 0.06;
      
      // High-frequency air (800-1500 Hz)
      const airFreq = 1200 + Math.sin(time * 0.3) * 350;
      background += Math.sin(2 * Math.PI * airFreq * time) * 0.04;
      
      // Add broadband noise for organic texture
      background += (Math.random() - 0.5) * 0.12;
      
      // Dynamic modulation - rises with each beat, drops between beats
      const modulationLevel = this.calculateDynamicModulation(distanceToBeat);
      background *= modulationLevel;
      
      // Add subtle movement simulation
      const movement = Math.sin(time * 0.15) * 0.02;
      background += movement;
      
      // Stereo variation
      const stereoVariation = channelIndex === 1 ? 0.94 : 1.0;
      
      channelData[i] = background * stereoVariation;
    }
  }

  /**
   * Generate noise-driven heartbeat pulses
   */
  private static generateNoiseDrivenHeartbeats(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating noise-driven heartbeat pulses');
    
    for (let i = 0; i < beatData.times.length; i++) {
      const beatTime = beatData.times[i];
      const amplitude = beatData.amplitudes[i];
      const doublePulseOffset = beatData.doublePulseOffsets[i];
      
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Generate primary heartbeat pulse
      this.generateNoiseDrivenPulse(channelData, startSample, sampleRate, amplitude, channelIndex, i);
      
      // Generate secondary pulse if present (systolic/diastolic)
      if (doublePulseOffset !== null) {
        const secondPulseStart = startSample + Math.floor(doublePulseOffset * sampleRate / 1000);
        const secondPulseAmplitude = amplitude * 0.6; // Softer secondary amplitude
        
        if (secondPulseStart < channelData.length) {
          this.generateNoiseDrivenPulse(channelData, secondPulseStart, sampleRate, secondPulseAmplitude, channelIndex, i);
        }
      }
    }
  }

  /**
   * Generate a single noise-driven heartbeat pulse
   */
  private static generateNoiseDrivenPulse(channelData: Float32Array, startSample: number, sampleRate: number, amplitude: number, channelIndex: number, pulseIndex: number) {
    // Realistic pulse duration
    const pulseDuration = 0.08; // 80ms pulse duration
    const pulseSamples = Math.floor(pulseDuration * sampleRate);
    
    // Create noise-driven pulse with proper frequency characteristics
    for (let i = 0; i < pulseSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Create the noise-driven pulse
      let pulse = 0;
      
      // 1. Rounded mid-frequency 'thump' (150-300 Hz) - the core heartbeat sound
      const thumpFreq = 180 + (Math.random() - 0.5) * 60; // 150-210 Hz
      const thumpFreq2 = 240 + (Math.random() - 0.5) * 60; // 210-270 Hz
      
      pulse += Math.sin(2 * Math.PI * thumpFreq * time) * 0.9;
      pulse += Math.sin(2 * Math.PI * thumpFreq2 * time) * 0.5;
      
      // 2. Subtle high-frequency hiss (800-1500 Hz)
      const hissFreq = 1000 + (Math.random() - 0.5) * 400;
      const hissFreq2 = 1300 + (Math.random() - 0.5) * 400;
      
      pulse += Math.sin(2 * Math.PI * hissFreq * time) * 0.15;
      pulse += Math.sin(2 * Math.PI * hissFreq2 * time) * 0.12;
      
      // 3. Noise-driven components for organic texture
      // Add different noise textures per beat to keep it organic
      const noiseSeed = (pulseIndex * 1000 + i) % 1000;
      const noise1 = this.generateSeededNoise(noiseSeed) * 0.2;
      const noise2 = this.generateSeededNoise(noiseSeed + 100) * 0.15;
      
      pulse += noise1 + noise2;
      
      // 4. Lower frequency warmth (60-120 Hz)
      const warmFreq = 90 + (Math.random() - 0.5) * 30;
      pulse += Math.sin(2 * Math.PI * warmFreq * time) * 0.4;
      
      // Apply authentic envelope shape
      const envelope = this.calculatePulseEnvelope(i, pulseSamples);
      
      // Add small noise texture differences per beat
      const textureVariation = 1.0 + (Math.random() - 0.5) * 0.1;
      
      // Stereo variation
      const stereoVariation = channelIndex === 1 ? 0.97 : 1.0;
      
      const finalPulse = pulse * envelope * amplitude * textureVariation * stereoVariation;
      channelData[sampleIndex] += finalPulse;
    }
  }

  /**
   * Generate seeded noise for consistent texture per beat
   */
  private static generateSeededNoise(seed: number): number {
    // Simple seeded random function
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Calculate pulse envelope shape
   */
  private static calculatePulseEnvelope(sampleIndex: number, totalSamples: number): number {
    const progress = sampleIndex / totalSamples;
    
    // Sharp attack and natural decay for realistic pulse
    if (progress < 0.08) {
      // Sharp attack (8% of duration)
      return Math.pow(progress / 0.08, 0.7); // Slightly curved attack
    } else if (progress < 0.25) {
      // Short sustain (17% of duration)
      return 1.0;
    } else {
      // Natural decay (75% of duration)
      const decayProgress = (progress - 0.25) / 0.75;
      // Natural exponential decay with slight curve
      return Math.exp(-decayProgress * 2.8) * (1 - decayProgress * 0.2);
    }
  }

  /**
   * Calculate dynamic background modulation
   */
  private static calculateDynamicModulation(distanceToBeat: number): number {
    const modulationWidth = 0.25; // 250ms modulation width
    if (distanceToBeat < modulationWidth) {
      // Rise with beat, drop between beats
      const modulationProgress = distanceToBeat / modulationWidth;
      // Use a curve that creates natural rise and fall
      return 0.4 + Math.pow(modulationProgress, 1.2) * 0.6; // 40% to 100%
    }
    return 0.4; // Lower background level between beats
  }

  /**
   * Apply realistic Doppler processing
   */
  private static applyRealisticDopplerProcessing(channelData: Float32Array, sampleRate: number, channelIndex: number): void {
    // Apply gentle compression for warmth
    const threshold = 0.7;
    const ratio = 2.0;
    const makeupGain = 1.05;
    
    for (let i = 0; i < channelData.length; i++) {
      const input = Math.abs(channelData[i]);
      
      if (input > threshold) {
        const excess = input - threshold;
        const compressedExcess = excess / ratio;
        const output = threshold + compressedExcess;
        channelData[i] = Math.sign(channelData[i]) * output * makeupGain;
      } else {
        channelData[i] *= makeupGain;
      }
    }
    
    // Apply gentle low-pass filtering for warmth
    let prevSample = 0;
    const filterCoeff = 0.98;
    
    for (let i = 0; i < channelData.length; i++) {
      const currentSample = channelData[i];
      channelData[i] = currentSample * (1 - filterCoeff) + prevSample * filterCoeff;
      prevSample = currentSample;
    }
    
    // Add subtle fluid movement
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      const fluidMovement = Math.sin(time * 0.12) * 0.015;
      channelData[i] += fluidMovement;
    }
    
    // Final normalization to prevent clipping
    let maxLevel = 0;
    for (let i = 0; i < channelData.length; i++) {
      maxLevel = Math.max(maxLevel, Math.abs(channelData[i]));
    }
    
    if (maxLevel > 0.95) {
      const normalizeGain = 0.95 / maxLevel;
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= normalizeGain;
      }
    }
  }

  /**
   * Get distance to nearest beat
   */
  private static getDistanceToNearestBeat(time: number, beatTimes: number[]): number {
    if (beatTimes.length === 0) return 1.0;
    
    let minDistance = Infinity;
    for (const beatTime of beatTimes) {
      const distance = Math.abs(time - beatTime);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  /**
   * Add watermark
   */
  private static addWatermark(buffer: AudioBuffer, sampleRate: number): void {
    const watermarkFreq = 15000;
    const watermarkDuration = 0.5;
    const watermarkSamples = Math.floor(watermarkDuration * sampleRate);
    const watermarkAmplitude = 0.01;
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < Math.min(watermarkSamples, channelData.length); i++) {
        const time = i / sampleRate;
        const fadeIn = Math.min(1, i / (sampleRate * 0.1));
        const fadeOut = Math.min(1, (watermarkSamples - i) / (sampleRate * 0.1));
        const envelope = fadeIn * fadeOut;
        
        const watermark = Math.sin(time * watermarkFreq * 2 * Math.PI) * watermarkAmplitude * envelope;
        channelData[i] += watermark;
      }
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
   * Create WAV file
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
  }
}
