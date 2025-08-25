// Doppler Synthesizer for Authentic Fetal Heartbeat Audio
// Implements realistic Doppler ultrasound sound synthesis with natural variation
// and authentic spectral characteristics

import { WaveformData } from './waveform-extractor';

export interface DopplerSynthesisOptions {
  waveformData: WaveformData;
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  stereo: boolean; // Enable stereo rendering for spatial realism
}

export interface DopplerSynthesisResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  waveformUsed: boolean; // Whether actual waveform was used vs fallback
}

export class DopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate authentic fetal Doppler heartbeat audio
   */
  static async generateDopplerAudio(options: DopplerSynthesisOptions): Promise<DopplerSynthesisResult> {
    console.log('🎵 Starting authentic Doppler synthesis with options:', options);

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        console.log('🎵 AudioContext created with sample rate:', this.audioContext.sampleRate);
      }

      // Force duration to exactly 8.000 seconds as per spec
      const fixedOptions = { ...options, duration: 8.000 };
      
      const audioBuffer = await this.createAuthenticDopplerWaveform(fixedOptions);
      console.log('🎵 Authentic Doppler audio buffer created successfully');

      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      console.log('🎵 Audio blob created, size:', audioBlob.size, 'bytes');

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: 8.000,
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
  private static async createAuthenticDopplerWaveform(options: DopplerSynthesisOptions): Promise<AudioBuffer> {
    const { waveformData, sampleRate, stereo } = options;
    const duration = 8.000; // Fixed duration

    console.log('🎵 Creating authentic Doppler waveform - Duration: 8.000s, Sample Rate:', sampleRate);

    const channels = stereo ? 2 : 1;
    const buffer = this.audioContext!.createBuffer(channels, sampleRate * duration, sampleRate);

    // Get timing and amplitude data from waveform or generate fallback
    const beatData = this.prepareBeatData(waveformData, options.bpm, duration);
    
    console.log('🎵 Beat data prepared:', { 
      beatCount: beatData.times.length, 
      hasDoublePulse: beatData.doublePulseOffsets.some(offset => offset !== null),
      waveformUsed: waveformData.hasWaveform
    });

    // Generate authentic Doppler audio for each channel
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate dynamic background noise that gates with beat activity
      this.generateDynamicDopplerBackground(channelData, sampleRate, beatData, channel);
      
      // Generate authentic heartbeat sounds
      this.generateAuthenticHeartbeats(channelData, sampleRate, beatData, channel);
      
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
   * Prepare beat timing and amplitude data from waveform or generate fallback
   */
  private static prepareBeatData(waveformData: WaveformData, bpm: number, duration: number) {
    if (waveformData.hasWaveform && waveformData.beatTimes.length > 0) {
      // Use extracted waveform data with natural variation
      return {
        times: waveformData.beatTimes,
        amplitudes: waveformData.amplitudes,
        doublePulseOffsets: waveformData.doublePulseOffsets,
        isExtracted: true
      };
    } else {
      // Generate fallback pattern with natural variation
      return this.generateFallbackBeatData(bpm, duration);
    }
  }

  /**
   * Generate fallback beat data with natural timing and amplitude variation
   */
  private static generateFallbackBeatData(bpm: number, duration: number) {
    const beatInterval = 60 / bpm;
    const startTime = 0.12; // Start near 0.12s as per spec
    const times: number[] = [];
    const amplitudes: number[] = [];
    const doublePulseOffsets: (number | null)[] = [];
    
    for (let time = startTime; time < duration; time += beatInterval) {
      // Add natural timing jitter (±10-20ms)
      const jitterMs = (Math.random() - 0.5) * 30; // ±15ms
      const jitteredTime = time + (jitterMs / 1000);
      
      times.push(Number(jitteredTime.toFixed(3)));
      
      // Add natural amplitude variation (±10-15%)
      const baseAmplitude = 0.8;
      const amplitudeVariation = 1.0 + (Math.random() - 0.5) * 0.3; // ±15%
      amplitudes.push(Math.max(0.6, Math.min(1.0, baseAmplitude * amplitudeVariation)));
      
      // Add physiologically plausible double-pulse variation
      const hasDoublePulse = Math.random() > 0.3; // 70% chance of double pulse
      if (hasDoublePulse) {
        const offset = 45 + Math.random() * 20; // 45-65ms range
        doublePulseOffsets.push(Number(offset.toFixed(1)));
      } else {
        doublePulseOffsets.push(null);
      }
    }
    
    return {
      times,
      amplitudes,
      doublePulseOffsets,
      isExtracted: false
    };
  }

  /**
   * Generate dynamic Doppler background that gates with beat activity
   */
  private static generateDynamicDopplerBackground(
    channelData: Float32Array,
    sampleRate: number,
    beatData: any,
    channelIndex: number
  ) {
    console.log('🎵 Generating dynamic Doppler background');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Calculate distance to nearest beat for gating
      const distanceToBeat = this.getDistanceToNearestBeat(time, beatData.times);
      const gateLevel = this.calculateGateLevel(distanceToBeat);
      
      // Multi-band noise sources for authentic Doppler characteristics
      const lowBand = this.generateBandNoise(time, 30, 80, sampleRate) * 0.08 * gateLevel;
      const midBand = this.generateBandNoise(time, 80, 300, sampleRate) * 0.12 * gateLevel;
      const highBand = this.generateBandNoise(time, 300, 800, sampleRate) * 0.06 * gateLevel;
      
      // Amniotic fluid movement simulation
      const fluidMovement = this.generateFluidMovement(time, sampleRate) * 0.04 * gateLevel;
      
      // Body tissue resonance
      const tissueResonance = this.generateTissueResonance(time, sampleRate) * 0.03 * gateLevel;
      
      // Add stereo variation for spatial realism
      const stereoVariation = channelIndex === 1 ? 0.9 : 1.0;
      
      channelData[i] = (lowBand + midBand + highBand + fluidMovement + tissueResonance) * stereoVariation;
    }
  }

  /**
   * Generate authentic heartbeat sounds with Doppler characteristics
   */
  private static generateAuthenticHeartbeats(
    channelData: Float32Array,
    sampleRate: number,
    beatData: any,
    channelIndex: number
  ) {
    console.log('🎵 Generating authentic heartbeat sounds');
    
    for (let i = 0; i < beatData.times.length; i++) {
      const beatTime = beatData.times[i];
      const amplitude = beatData.amplitudes[i];
      const doublePulseOffset = beatData.doublePulseOffsets[i];
      
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Generate primary heartbeat sound
      this.generateAuthenticHeartbeatSound(
        channelData, 
        startSample, 
        sampleRate, 
        amplitude, 
        channelIndex
      );
      
      // Generate secondary pulse if present
      if (doublePulseOffset !== null) {
        const secondPulseStart = startSample + Math.floor(doublePulseOffset * sampleRate / 1000);
        const secondPulseAmplitude = amplitude * (0.6 + Math.random() * 0.2); // 60-80% of primary
        
        if (secondPulseStart < channelData.length) {
          this.generateAuthenticHeartbeatSound(
            channelData,
            secondPulseStart,
            sampleRate,
            secondPulseAmplitude,
            channelIndex
          );
        }
      }
    }
  }

  /**
   * Generate individual authentic heartbeat sound
   */
  private static generateAuthenticHeartbeatSound(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number,
    channelIndex: number
  ) {
    // Authentic Doppler heartbeat parameters
    const attackMs = 3 + Math.random() * 4; // 3-7ms attack
    const decayMs = 80 + Math.random() * 60; // 80-140ms decay
    const totalMs = attackMs + decayMs;
    
    const attackSamples = Math.floor(attackMs * sampleRate / 1000);
    const decaySamples = Math.floor(decayMs * sampleRate / 1000);
    const totalSamples = attackSamples + decaySamples;
    
    // Generate multi-band noise for authentic Doppler characteristics
    const noiseBuffer = new Float32Array(totalSamples);
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / sampleRate;
      
      // Primary Doppler band (200-800 Hz) - the "thump"
      const primaryBand = this.generateBandNoise(time, 200, 800, sampleRate) * 0.8;
      
      // Secondary Doppler band (800-1500 Hz) - the "whoosh"
      const secondaryBand = this.generateBandNoise(time, 800, 1500, sampleRate) * 0.4;
      
      // Low-frequency resonance (60-150 Hz) - body tissue
      const lowResonance = this.generateBandNoise(time, 60, 150, sampleRate) * 0.6;
      
      noiseBuffer[i] = primaryBand + secondaryBand + lowResonance;
    }
    
    // Apply wall-filtering effect (high-pass filter to remove low-frequency artifacts)
    this.applyWallFilter(noiseBuffer, sampleRate);
    
    // Apply authentic envelope
    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      let envelope = 0;
      if (i < attackSamples) {
        // Fast attack for authentic Doppler transient
        envelope = Math.pow(i / attackSamples, 0.7);
      } else {
        // Natural decay with slight resonance
        const decayProgress = (i - attackSamples) / decaySamples;
        envelope = Math.exp(-decayProgress * 3) * (1 + Math.sin(decayProgress * Math.PI) * 0.1);
      }
      
      // Add subtle amplitude variation for realism
      const variation = 1.0 + (Math.random() - 0.5) * 0.08; // ±4%
      const finalAmplitude = amplitude * envelope * variation;
      
      // Add stereo variation for spatial realism
      const stereoVariation = channelIndex === 1 ? 0.95 : 1.0;
      
      channelData[sampleIndex] += noiseBuffer[i] * finalAmplitude * stereoVariation;
    }
  }

  /**
   * Generate band-limited noise for authentic Doppler characteristics
   */
  private static generateBandNoise(time: number, lowFreq: number, highFreq: number, sampleRate: number): number {
    const centerFreq = (lowFreq + highFreq) / 2;
    const bandwidth = highFreq - lowFreq;
    
    // Generate multiple sine waves with random phases for broadband noise
    let noise = 0;
    const numComponents = 8;
    
    for (let j = 0; j < numComponents; j++) {
      const freq = centerFreq + (Math.random() - 0.5) * bandwidth;
      const phase = Math.random() * Math.PI * 2;
      noise += Math.sin(2 * Math.PI * freq * time + phase);
    }
    
    return noise / numComponents;
  }

  /**
   * Generate amniotic fluid movement simulation
   */
  private static generateFluidMovement(time: number, sampleRate: number): number {
    const baseFreq = 15 + Math.sin(time * 0.3) * 5; // 10-20 Hz with slow variation
    return Math.sin(2 * Math.PI * baseFreq * time + Math.sin(time * 0.7) * 0.5) * 0.5;
  }

  /**
   * Generate body tissue resonance
   */
  private static generateTissueResonance(time: number, sampleRate: number): number {
    const resonanceFreq = 25 + Math.sin(time * 0.2) * 8; // 17-33 Hz with variation
    return Math.sin(2 * Math.PI * resonanceFreq * time + Math.sin(time * 0.5) * 0.3) * 0.4;
  }

  /**
   * Calculate distance to nearest beat for gating
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
   * Calculate gate level based on distance to beat
   */
  private static calculateGateLevel(distanceToBeat: number): number {
    // Gate opens near beats, closes between beats
    const gateWidth = 0.1; // 100ms gate width
    if (distanceToBeat < gateWidth) {
      return 1.0 - (distanceToBeat / gateWidth) * 0.3; // 70-100% near beats
    }
    return 0.7; // 70% between beats
  }

  /**
   * Apply wall-filtering effect (high-pass filter)
   */
  private static applyWallFilter(buffer: Float32Array, sampleRate: number): void {
    const cutoffFreq = 50; // 50 Hz cutoff
    const rc = 1 / (2 * Math.PI * cutoffFreq);
    const dt = 1 / sampleRate;
    const alpha = dt / (rc + dt);
    
    let filtered = buffer[0];
    for (let i = 1; i < buffer.length; i++) {
      filtered = alpha * (filtered + buffer[i] - buffer[i - 1]);
      buffer[i] = filtered;
    }
  }

  /**
   * Apply authentic Doppler processing
   */
  private static applyAuthenticDopplerProcessing(channelData: Float32Array, sampleRate: number, channelIndex: number): void {
    // Apply gentle compression to preserve transient differences
    const threshold = Math.pow(10, -20 / 20); // -20 dBFS threshold
    const ratio = 2.5; // Gentle compression ratio
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
    
    // Apply light convolution reverb for womb environment simulation
    this.applyWombReverb(channelData, sampleRate, channelIndex);
    
    // Final normalization
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
   * Apply light convolution reverb to simulate womb environment
   */
  private static applyWombReverb(channelData: Float32Array, sampleRate: number, channelIndex: number): void {
    // Simple convolution reverb with short delays for womb environment
    const delays = [0.008, 0.015, 0.025]; // 8ms, 15ms, 25ms delays
    const gains = [0.3, 0.2, 0.1]; // Decreasing gains
    
    for (let delayIndex = 0; delayIndex < delays.length; delayIndex++) {
      const delaySamples = Math.floor(delays[delayIndex] * sampleRate);
      const gain = gains[delayIndex];
      
      for (let i = delaySamples; i < channelData.length; i++) {
        channelData[i] += channelData[i - delaySamples] * gain;
      }
    }
  }

  /**
   * Add watermark (prepend whisper for free version)
   */
  private static addWatermark(buffer: AudioBuffer, sampleRate: number): void {
    const watermarkFreq = 15000; // 15kHz - above typical Doppler range
    const watermarkDuration = 0.5; // 0.5 seconds at start
    const watermarkSamples = Math.floor(watermarkDuration * sampleRate);
    const watermarkAmplitude = 0.01; // Very subtle
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < Math.min(watermarkSamples, channelData.length); i++) {
        const time = i / sampleRate;
        const fadeIn = Math.min(1, i / (sampleRate * 0.1)); // 0.1s fade in
        const fadeOut = Math.min(1, (watermarkSamples - i) / (sampleRate * 0.1)); // 0.1s fade out
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
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    console.log('🎵 WAV file creation completed');
    return buffer;
  }
}
