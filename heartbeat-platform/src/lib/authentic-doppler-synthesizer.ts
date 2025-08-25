// Authentic Fetal Doppler Ultrasound Synthesizer
// Creates realistic fetal heartbeat sounds that match actual Doppler ultrasound characteristics
// Focuses on the distinctive "whoosh" background with heartbeat "thumps"

import { WaveformData } from './waveform-extractor';

export interface AuthenticDopplerOptions {
  waveformData: WaveformData;
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  stereo: boolean;
}

export interface AuthenticDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  waveformUsed: boolean;
}

export class AuthenticDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate authentic fetal Doppler ultrasound heartbeat audio
   */
  static async generateAuthenticDopplerAudio(options: AuthenticDopplerOptions): Promise<AuthenticDopplerResult> {
    console.log('🎵 Starting authentic Doppler synthesis');

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioBuffer = await this.createAuthenticDopplerWaveform(options);
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
      console.error('❌ Authentic Doppler synthesis failed:', error);
      throw new Error('Failed to generate authentic Doppler heartbeat audio');
    }
  }

  /**
   * Create authentic Doppler ultrasound waveform
   */
  private static async createAuthenticDopplerWaveform(options: AuthenticDopplerOptions): Promise<AudioBuffer> {
    const { waveformData, sampleRate, stereo } = options;
    const duration = 8.000; // Fixed duration

    console.log('🎵 Creating authentic Doppler waveform');

    const channels = stereo ? 2 : 1;
    const buffer = this.audioContext!.createBuffer(channels, sampleRate * duration, sampleRate);

    // Prepare beat timing data
    const beatData = this.prepareBeatData(waveformData, options.bpm, duration);
    
    console.log('🎵 Beat data prepared:', { 
      beatCount: beatData.times.length, 
      hasDoublePulse: beatData.doublePulseOffsets.some(offset => offset !== null)
    });

    // Generate authentic Doppler audio for each channel
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate the characteristic "whoosh" background
      this.generateDopplerWhoosh(channelData, sampleRate, beatData, channel);
      
      // Generate authentic heartbeat "thumps"
      this.generateHeartbeatThumps(channelData, sampleRate, beatData, channel);
      
      // Apply authentic Doppler processing
      this.applyAuthenticDopplerProcessing(channelData, sampleRate, channel);
    }

    // Add watermark if needed
    if (options.isWatermarked) {
      this.addWatermark(buffer, sampleRate);
    }

    console.log('🎵 Authentic Doppler waveform creation completed');
    return buffer;
  }

  /**
   * Prepare beat timing data
   */
  private static prepareBeatData(waveformData: WaveformData, bpm: number, duration: number) {
    if (waveformData.hasWaveform && waveformData.beatTimes.length > 0) {
      return {
        times: waveformData.beatTimes,
        amplitudes: waveformData.amplitudes,
        doublePulseOffsets: waveformData.doublePulseOffsets,
        isExtracted: true
      };
    } else {
      // Generate fallback pattern
      const baseInterval = 60 / bpm;
      const startTime = 0.15;
      const times: number[] = [];
      const amplitudes: number[] = [];
      const doublePulseOffsets: (number | null)[] = [];
      
      let currentTime = startTime;
      while (currentTime < duration) {
        // Add natural timing variation (±15ms)
        const jitter = (Math.random() - 0.5) * 0.03;
        const interval = baseInterval + jitter;
        
        times.push(Number(currentTime.toFixed(3)));
        
        // Natural amplitude variation
        const baseAmplitude = 0.85;
        const amplitudeVariation = 1.0 + (Math.random() - 0.5) * 0.25;
        amplitudes.push(Math.max(0.7, Math.min(1.0, baseAmplitude * amplitudeVariation)));
        
        // Add double pulse (systolic/diastolic) - common in fetal heartbeats
        const hasDoublePulse = Math.random() > 0.15; // 85% chance
        if (hasDoublePulse) {
          const spacing = 0.045 + (Math.random() - 0.5) * 0.01; // 40-50ms spacing
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
   * Generate the characteristic Doppler "whoosh" background
   */
  private static generateDopplerWhoosh(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating Doppler whoosh background');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Calculate distance to nearest beat for gating
      const distanceToBeat = this.getDistanceToNearestBeat(time, beatData.times);
      
      // Create the characteristic "whoosh" sound
      // Real Doppler has a broadband noise with emphasis on mid-high frequencies
      // The whoosh should be more prominent and realistic
      const whooshFreq1 = 600 + Math.sin(time * 0.2) * 150; // Lower base frequency
      const whooshFreq2 = 900 + Math.sin(time * 0.4) * 200;
      const whooshFreq3 = 1400 + Math.sin(time * 0.6) * 250;
      const whooshFreq4 = 2000 + Math.sin(time * 0.8) * 300;
      
      let whoosh = 0;
      whoosh += Math.sin(2 * Math.PI * whooshFreq1 * time) * 0.2;
      whoosh += Math.sin(2 * Math.PI * whooshFreq2 * time) * 0.18;
      whoosh += Math.sin(2 * Math.PI * whooshFreq3 * time) * 0.15;
      whoosh += Math.sin(2 * Math.PI * whooshFreq4 * time) * 0.12;
      
      // Add more broadband noise for authenticity
      whoosh += (Math.random() - 0.5) * 0.15;
      
      // Add some lower frequency components for warmth
      const warmFreq = 300 + Math.sin(time * 0.1) * 100;
      whoosh += Math.sin(2 * Math.PI * warmFreq * time) * 0.08;
      
      // Gate the whoosh with beat activity - quieter during beats
      const gateLevel = this.calculateWhooshGateLevel(distanceToBeat);
      whoosh *= gateLevel;
      
      // Add subtle movement simulation
      const movement = Math.sin(time * 0.15) * 0.03;
      whoosh += movement;
      
      // Stereo variation
      const stereoVariation = channelIndex === 1 ? 0.92 : 1.0;
      
      channelData[i] = whoosh * stereoVariation;
    }
  }

  /**
   * Generate authentic heartbeat "thumps"
   */
  private static generateHeartbeatThumps(channelData: Float32Array, sampleRate: number, beatData: any, channelIndex: number) {
    console.log('🎵 Generating heartbeat thumps');
    
    for (let i = 0; i < beatData.times.length; i++) {
      const beatTime = beatData.times[i];
      const amplitude = beatData.amplitudes[i];
      const doublePulseOffset = beatData.doublePulseOffsets[i];
      
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Generate primary heartbeat thump
      this.generateSingleThump(channelData, startSample, sampleRate, amplitude, channelIndex);
      
      // Generate secondary pulse if present (systolic/diastolic)
      if (doublePulseOffset !== null) {
        const secondPulseStart = startSample + Math.floor(doublePulseOffset * sampleRate / 1000);
        const secondPulseAmplitude = amplitude * 0.65; // Secondary pulse is quieter
        
        if (secondPulseStart < channelData.length) {
          this.generateSingleThump(channelData, secondPulseStart, sampleRate, secondPulseAmplitude, channelIndex);
        }
      }
    }
  }

  /**
   * Generate a single heartbeat thump
   */
  private static generateSingleThump(channelData: Float32Array, startSample: number, sampleRate: number, amplitude: number, channelIndex: number) {
    // Real Doppler thumps have a specific envelope and frequency characteristics
    const thumpDuration = 0.15; // 150ms thump duration for more realistic sound
    const thumpSamples = Math.floor(thumpDuration * sampleRate);
    
    // Thump frequency characteristics - real Doppler thumps are around 120-250 Hz
    // The key is to have a strong fundamental with harmonics that create the "thump" character
    const thumpFreq = 140 + (Math.random() - 0.5) * 40; // 120-160 Hz base (more realistic)
    const thumpFreq2 = 200 + (Math.random() - 0.5) * 60; // 170-230 Hz harmonic
    const thumpFreq3 = 280 + (Math.random() - 0.5) * 80; // 240-320 Hz upper harmonic
    
    for (let i = 0; i < thumpSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      
      // Create the thump sound with multiple frequency components
      let thump = 0;
      
      // Primary thump frequency - this is the "thump" sound
      thump += Math.sin(2 * Math.PI * thumpFreq * time) * 1.0;
      
      // Second harmonic - adds body
      thump += Math.sin(2 * Math.PI * thumpFreq2 * time) * 0.6;
      
      // Third harmonic - adds brightness
      thump += Math.sin(2 * Math.PI * thumpFreq3 * time) * 0.3;
      
      // Add some lower frequency "thump" (40-70 Hz) for the chest thump feeling
      const lowThumpFreq = 55 + (Math.random() - 0.5) * 30;
      thump += Math.sin(2 * Math.PI * lowThumpFreq * time) * 0.8;
      
      // Add some mid-frequency noise for authenticity (like blood flow)
      const noiseFreq = 400 + (Math.random() - 0.5) * 200;
      thump += Math.sin(2 * Math.PI * noiseFreq * time) * 0.2;
      
      // Add subtle broadband noise for realism
      thump += (Math.random() - 0.5) * 0.15;
      
      // Apply authentic envelope shape
      const envelope = this.calculateThumpEnvelope(i, thumpSamples);
      
      // Add subtle randomization to avoid repetition
      const randomization = 1.0 + (Math.random() - 0.5) * 0.2;
      
      // Stereo variation
      const stereoVariation = channelIndex === 1 ? 0.96 : 1.0;
      
      const finalThump = thump * envelope * amplitude * randomization * stereoVariation;
      channelData[sampleIndex] += finalThump;
    }
  }

  /**
   * Calculate authentic thump envelope shape
   */
  private static calculateThumpEnvelope(sampleIndex: number, totalSamples: number): number {
    const progress = sampleIndex / totalSamples;
    
    // Real Doppler thumps have a very quick attack, very short sustain, and longer decay
    // This creates the characteristic "thump" sound
    if (progress < 0.05) {
      // Very quick attack (5% of duration)
      return progress / 0.05;
    } else if (progress < 0.15) {
      // Very short sustain (10% of duration)
      return 1.0;
    } else {
      // Longer decay phase (85% of duration)
      const decayProgress = (progress - 0.15) / 0.85;
      // Use a more natural decay curve
      return Math.exp(-decayProgress * 3.5) * (1 - decayProgress * 0.3);
    }
  }

  /**
   * Calculate whoosh gating level based on distance to beat
   */
  private static calculateWhooshGateLevel(distanceToBeat: number): number {
    const gateWidth = 0.2; // 200ms gate width for more realistic gating
    if (distanceToBeat < gateWidth) {
      // Reduce whoosh during beat - more dramatic gating
      const gateProgress = distanceToBeat / gateWidth;
      // Use a curve that creates more dramatic gating
      return 0.2 + Math.pow(gateProgress, 1.5) * 0.6; // 20% to 80% with curve
    }
    return 0.8; // Normal whoosh level - slightly higher for more presence
  }

  /**
   * Apply authentic Doppler processing
   */
  private static applyAuthenticDopplerProcessing(channelData: Float32Array, sampleRate: number, channelIndex: number): void {
    // Apply gentle compression to match real Doppler characteristics
    const threshold = 0.6;
    const ratio = 2.5;
    const makeupGain = 1.1;
    
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
    
    // Add subtle filtering to match Doppler characteristics
    // Real Doppler has some high-frequency rolloff
    let prevSample = 0;
    const filterCoeff = 0.95;
    
    for (let i = 0; i < channelData.length; i++) {
      const currentSample = channelData[i];
      channelData[i] = currentSample * (1 - filterCoeff) + prevSample * filterCoeff;
      prevSample = currentSample;
    }
    
    // Add subtle movement simulation
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      const movement = Math.sin(time * 0.15) * 0.02;
      channelData[i] += movement;
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
