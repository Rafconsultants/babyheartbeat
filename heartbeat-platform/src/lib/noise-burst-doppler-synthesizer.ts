// Noise Burst Doppler Ultrasound Synthesizer
// Creates realistic fetal Doppler sounds using filtered noise bursts
// Band-pass filtered around 200-1200 Hz with 150-300 Hz emphasis
// No tonal components - only noise-driven pulses

import { WaveformData } from './waveform-extractor';

export interface NoiseBurstDopplerOptions {
  waveformData: WaveformData;
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  stereo: boolean;
}

export interface NoiseBurstDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  waveformUsed: boolean;
}

export class NoiseBurstDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic Doppler ultrasound heartbeat audio using noise bursts
   */
  static async generateNoiseBurstDopplerAudio(options: NoiseBurstDopplerOptions): Promise<NoiseBurstDopplerResult> {
    console.log('🎵 Starting noise burst Doppler synthesis');

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      // Create AudioContext with better error handling
      if (!this.audioContext) {
        try {
          // Try standard AudioContext first
          this.audioContext = new AudioContext();
        } catch (error) {
          console.warn('🎵 Standard AudioContext failed, trying webkitAudioContext:', error);
          try {
            // Fallback to webkitAudioContext for older browsers
            this.audioContext = new (window as any).webkitAudioContext();
          } catch (webkitError) {
            console.error('🎵 Both AudioContext and webkitAudioContext failed:', webkitError);
            throw new Error('AudioContext not supported in this browser');
          }
        }
      }

      // Resume AudioContext if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        console.log('🎵 Resuming suspended AudioContext');
        await this.audioContext.resume();
      }

      console.log('🎵 AudioContext state:', this.audioContext.state);

      const audioBuffer = await this.createNoiseBurstDopplerWaveform(options);
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
      console.error('❌ Noise burst Doppler synthesis failed:', error);
      throw new Error(`Failed to generate noise burst Doppler heartbeat audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create noise burst Doppler ultrasound waveform
   */
  private static async createNoiseBurstDopplerWaveform(options: NoiseBurstDopplerOptions): Promise<AudioBuffer> {
    const { waveformData, sampleRate, stereo } = options;
    const duration = 8.000; // Fixed duration

    console.log('🎵 Creating noise burst Doppler waveform');

    const channels = stereo ? 2 : 1;
    const buffer = this.audioContext!.createBuffer(channels, sampleRate * duration, sampleRate);

    // Prepare beat timing data with organic variations
    const beatData = this.prepareBeatDataWithOrganicVariations(waveformData, options.bpm, duration);
    
    console.log('🎵 Beat data prepared:', { 
      beatCount: beatData.times.length, 
      hasDoublePulse: beatData.doublePulseOffsets.some(offset => offset !== null)
    });

    // Generate noise burst Doppler audio for each channel
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate low pink-noise background floor
      this.generatePinkNoiseBackground(channelData, sampleRate, beatData, channel);
      
      // Generate filtered noise burst heartbeats
      this.generateFilteredNoiseBursts(channelData, sampleRate, beatData, channel);
      
      // Apply Doppler-specific processing
      this.applyDopplerProcessing(channelData, sampleRate, channel);
    }

    // Add watermark if needed
    if (options.isWatermarked) {
      this.addWatermark(buffer, sampleRate);
    }

    console.log('🎵 Noise burst Doppler waveform creation completed');
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
        
        // Gentle amplitude differences per beat
        const baseAmplitude = 0.9;
        const amplitudeVariation = 1.0 + (Math.random() - 0.5) * 0.15; // ±7.5% variation
        amplitudes.push(Math.max(0.8, Math.min(1.0, baseAmplitude * amplitudeVariation)));
        
        // Add double pulse (systolic/diastolic) - common in fetal heartbeats
        const hasDoublePulse = Math.random() > 0.15; // 85% chance
        if (hasDoublePulse) {
          const spacing = 0.045 + (Math.random() - 0.5) * 0.025; // 32.5-57.5ms spacing
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
   * Generate low pink-noise background floor
   */
  private static generatePinkNoiseBackground(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating pink-noise background floor');
    
    // Generate pink noise using multiple octave bands
    const pinkNoise = this.generatePinkNoise(channelData.length, sampleRate);
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Calculate distance to nearest beat for dynamic modulation
      const distanceToBeat = this.getDistanceToNearestBeat(time, beatData.times);
      
      // Start with pink noise
      let background = pinkNoise[i] * 0.08; // Low level pink noise
      
      // Dynamic modulation - rises with each beat, drops between beats
      const modulationLevel = this.calculateBackgroundModulation(distanceToBeat);
      background *= modulationLevel;
      
      // Add subtle movement simulation
      const movement = Math.sin(time * 0.12) * 0.015;
      background += movement;
      
      // Stereo variation
      const stereoVariation = channelIndex === 1 ? 0.95 : 1.0;
      
      channelData[i] = background * stereoVariation;
    }
  }

  /**
   * Generate pink noise using octave bands
   */
  private static generatePinkNoise(length: number, sampleRate: number): Float32Array {
    const pinkNoise = new Float32Array(length);
    
    // Generate pink noise using multiple octave bands
    const numBands = 8;
    const bandFilters: { b0: number; b1: number; b2: number; a1: number; a2: number }[] = [];
    
    // Create band-pass filters for different octaves
    for (let band = 0; band < numBands; band++) {
      const centerFreq = 50 * Math.pow(2, band); // 50, 100, 200, 400, 800, 1600, 3200, 6400 Hz
      const q = 1.0;
      
      const w0 = 2 * Math.PI * centerFreq / sampleRate;
      const alpha = Math.sin(w0) / (2 * q);
      
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * Math.cos(w0);
      const a2 = 1 - alpha;
      
      bandFilters.push({
        b0: b0 / a0,
        b1: b1 / a0,
        b2: b2 / a0,
        a1: a1 / a0,
        a2: a2 / a0
      });
    }
    
    // Generate white noise and apply band-pass filters
    const whiteNoise = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      whiteNoise[i] = (Math.random() - 0.5) * 2;
    }
    
    // Apply each band filter with decreasing amplitude
    for (let band = 0; band < numBands; band++) {
      const filter = bandFilters[band];
      const bandAmplitude = 1.0 / Math.sqrt(band + 1); // Decreasing amplitude per octave
      
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      
      for (let i = 0; i < length; i++) {
        const x0 = whiteNoise[i];
        const y0 = filter.b0 * x0 + filter.b1 * x1 + filter.b2 * x2 - filter.a1 * y1 - filter.a2 * y2;
        
        pinkNoise[i] += y0 * bandAmplitude;
        
        x2 = x1;
        x1 = x0;
        y2 = y1;
        y1 = y0;
      }
    }
    
    // Normalize
    const maxAmplitude = Math.max(...pinkNoise.map(Math.abs));
    for (let i = 0; i < length; i++) {
      pinkNoise[i] /= maxAmplitude;
    }
    
    return pinkNoise;
  }

  /**
   * Generate filtered noise burst heartbeats
   */
  private static generateFilteredNoiseBursts(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating filtered noise burst heartbeats');
    
    for (let i = 0; i < beatData.times.length; i++) {
      const beatTime = beatData.times[i];
      const amplitude = beatData.amplitudes[i];
      const doublePulseOffset = beatData.doublePulseOffsets[i];
      
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Generate primary noise burst
      this.generateFilteredNoiseBurst(channelData, startSample, sampleRate, amplitude, channelIndex, i);
      
      // Generate secondary burst if present (double pulse)
      if (doublePulseOffset !== null) {
        const secondPulseStart = startSample + Math.floor(doublePulseOffset * sampleRate / 1000);
        const secondPulseAmplitude = amplitude * 0.65; // Reduced amplitude for secondary pulse
        
        if (secondPulseStart < channelData.length) {
          this.generateFilteredNoiseBurst(channelData, secondPulseStart, sampleRate, secondPulseAmplitude, channelIndex, i);
        }
      }
    }
  }

  /**
   * Generate a single filtered noise burst
   */
  private static generateFilteredNoiseBurst(channelData: Float32Array, startSample: number, sampleRate: number, amplitude: number, channelIndex: number, pulseIndex: number) {
    // Noise burst duration - short and percussive
    const burstDuration = 0.06; // 60ms burst duration
    const burstSamples = Math.floor(burstDuration * sampleRate);
    
    // Generate raw noise burst
    const rawNoise = new Float32Array(burstSamples);
    for (let i = 0; i < burstSamples; i++) {
      rawNoise[i] = (Math.random() - 0.5) * 2;
    }
    
    // Apply band-pass filter around 200-1200 Hz with emphasis on 150-300 Hz
    const filteredNoise = this.applyBandPassFilter(rawNoise, sampleRate);
    
    // Apply envelope shape (sharp attack, quick decay)
    const envelope = this.calculateNoiseBurstEnvelope(burstSamples);
    
    // Add subtle texture differences per beat
    const textureVariation = 1.0 + (Math.random() - 0.5) * 0.1;
    
    // Stereo variation
    const stereoVariation = channelIndex === 1 ? 0.98 : 1.0;
    
    // Apply to channel data
    for (let i = 0; i < burstSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex < channelData.length) {
        const finalBurst = filteredNoise[i] * envelope[i] * amplitude * textureVariation * stereoVariation;
        channelData[sampleIndex] += finalBurst;
      }
    }
  }

  /**
   * Apply band-pass filter to noise burst
   */
  private static applyBandPassFilter(noise: Float32Array, sampleRate: number): Float32Array {
    const filtered = new Float32Array(noise.length);
    
    // Create band-pass filter centered around 400 Hz (middle of 200-1200 Hz range)
    // with emphasis on 150-300 Hz range
    const centerFreq = 400;
    const q = 2.0; // Higher Q for more emphasis
    
    const w0 = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    
    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    
    // Apply filter
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < noise.length; i++) {
      const x0 = noise[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      
      filtered[i] = y0;
      
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    
    // Apply additional emphasis filter for 150-300 Hz range
    const emphasisFreq = 225; // Center of 150-300 Hz range
    const emphasisQ = 1.5;
    
    const w1 = 2 * Math.PI * emphasisFreq / sampleRate;
    const alpha1 = Math.sin(w1) / (2 * emphasisQ);
    
    const b0_emph = 1 + alpha1;
    const b1_emph = -2 * Math.cos(w1);
    const b2_emph = 1 - alpha1;
    const a0_emph = 1 + alpha1;
    const a1_emph = -2 * Math.cos(w1);
    const a2_emph = 1 - alpha1;
    
    // Apply emphasis filter
    let x1_emph = 0, x2_emph = 0, y1_emph = 0, y2_emph = 0;
    
    for (let i = 0; i < filtered.length; i++) {
      const x0 = filtered[i];
      const y0 = (b0_emph * x0 + b1_emph * x1_emph + b2_emph * x2_emph - a1_emph * y1_emph - a2_emph * y2_emph) / a0_emph;
      
      filtered[i] = y0 * 1.2; // Boost emphasis band
      
      x2_emph = x1_emph;
      x1_emph = x0;
      y2_emph = y1_emph;
      y1_emph = y0;
    }
    
    return filtered;
  }

  /**
   * Calculate noise burst envelope shape
   */
  private static calculateNoiseBurstEnvelope(burstSamples: number): Float32Array {
    const envelope = new Float32Array(burstSamples);
    
    for (let i = 0; i < burstSamples; i++) {
      const progress = i / burstSamples;
      
      if (progress < 0.1) {
        // Sharp attack (10% of duration)
        envelope[i] = Math.pow(progress / 0.1, 0.5); // Quick attack
      } else if (progress < 0.3) {
        // Short sustain (20% of duration)
        envelope[i] = 1.0;
      } else {
        // Quick decay (70% of duration)
        const decayProgress = (progress - 0.3) / 0.7;
        envelope[i] = Math.exp(-decayProgress * 3.0); // Fast exponential decay
      }
    }
    
    return envelope;
  }

  /**
   * Calculate background modulation
   */
  private static calculateBackgroundModulation(distanceToBeat: number): number {
    const modulationWidth = 0.2; // 200ms modulation width
    if (distanceToBeat < modulationWidth) {
      // Rise with beat, drop between beats
      const modulationProgress = distanceToBeat / modulationWidth;
      // Use a curve that creates natural rise and fall
      return 0.3 + Math.pow(modulationProgress, 1.5) * 0.7; // 30% to 100%
    }
    return 0.3; // Lower background level between beats
  }

  /**
   * Apply Doppler-specific processing
   */
  private static applyDopplerProcessing(channelData: Float32Array, sampleRate: number, channelIndex: number): void {
    // Apply gentle high-frequency rolloff to simulate Doppler characteristics
    const cutoffFreq = 3000; // Rolloff above 3kHz
    const q = 1.0;
    
    const w0 = 2 * Math.PI * cutoffFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    
    const b0 = 1 + alpha;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1 - alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    
    // Apply low-pass filter
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const x0 = channelData[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      
      channelData[i] = y0;
      
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    
    // Add subtle air movement simulation
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      const airMovement = Math.sin(time * 0.08) * 0.012;
      channelData[i] += airMovement;
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
