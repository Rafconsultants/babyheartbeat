// Noise-Burst Doppler Audio Generation Service
// Creates authentic fetal Doppler ultrasound audio using noise-burst model
// Eliminates synthetic/tonal artifacts for realistic ultrasound recordings

import { UltrasoundAnalysis } from './gpt-ultrasound-analyzer';

export interface AudioGenerationOptions {
  bpm: number;
  duration: number; // in seconds, fixed at 8.000s
  sampleRate: number; // 44100 or 48000 Hz
  isWatermarked: boolean;
  gptAnalysis?: UltrasoundAnalysis; // Timing and amplitude data only
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
   * Generate authentic Doppler ultrasound audio using noise-burst model
   */
  static async generateHeartbeatAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    console.log('🎵 Starting noise-burst Doppler audio generation with options:', options);

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        console.log('🎵 AudioContext created with sample rate:', this.audioContext.sampleRate);
      }

      // Force 8.000s duration for authentic ultrasound recording
      const fixedOptions = { ...options, duration: 8.0 };
      const audioBuffer = await this.createNoiseBurstDopplerWaveform(fixedOptions);
      console.log('🎵 Noise-burst Doppler buffer created successfully');

      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      console.log('🎵 Audio blob created, size:', audioBlob.size, 'bytes');

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: 8.0,
        bpm: options.bpm,
        fileSize: audioBlob.size
      };
    } catch (error) {
      console.error('❌ Noise-burst Doppler audio generation failed:', error);
      throw new Error('Failed to generate heartbeat audio');
    }
  }

  /**
   * Create noise-burst Doppler waveform using timing data from GPT analysis
   */
  private static async createNoiseBurstDopplerWaveform(options: AudioGenerationOptions): Promise<AudioBuffer> {
    const { bpm, duration, sampleRate, gptAnalysis, isWatermarked } = options;

    console.log('🎵 Creating noise-burst Doppler waveform with BPM:', bpm, 'Duration:', duration, 'Sample Rate:', sampleRate);

    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Get beat timing from GPT analysis or generate uniform timing
    const beatTimes = gptAnalysis?.beat_times_sec || this.generateUniformBeatTimes(bpm, duration);
    const amplitudeScalars = gptAnalysis?.amplitude_scalars || beatTimes.map(() => 0.8);
    const doublePulseOffset = gptAnalysis?.double_pulse_offset_ms || null;

    console.log('🎵 Beat times:', beatTimes);
    console.log('🎵 Amplitude scalars:', amplitudeScalars);
    console.log('🎵 Double pulse offset:', doublePulseOffset);

    // Add continuous pink noise floor (−36 to −42 dBFS)
    this.addPinkNoiseFloor(channelData, sampleRate);

    // Add noise bursts for each beat
    for (let i = 0; i < beatTimes.length; i++) {
      const beatTime = beatTimes[i];
      const amplitude = amplitudeScalars[i];
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Add timing jitter (±3ms)
      const jitterMs = (Math.random() - 0.5) * 6; // ±3ms
      const jitterSamples = Math.floor(jitterMs * sampleRate / 1000);
      const adjustedStart = Math.max(0, Math.min(channelData.length - 1, startSample + jitterSamples));
      
      this.addNoiseBurstBeat(channelData, adjustedStart, sampleRate, amplitude, doublePulseOffset);
    }

    // Apply band-pass filtering (200-1200 Hz)
    this.applyBandPassFilter(channelData, sampleRate, 200, 1200);

    // Apply dynamics processing
    this.applyDynamicsProcessing(channelData);

    // Add watermark if needed (prepend whisper for free version)
    if (isWatermarked) {
      this.addWatermark(channelData, sampleRate);
    }

    console.log('🎵 Noise-burst Doppler waveform creation completed');
    return buffer;
  }

  /**
   * Generate uniform beat times when GPT analysis is not available
   */
  private static generateUniformBeatTimes(bpm: number, duration: number): number[] {
    const beatInterval = 60 / bpm;
    const beatTimes: number[] = [];
    for (let time = 0.15; time < duration; time += beatInterval) {
      beatTimes.push(time);
    }
    return beatTimes;
  }

  /**
   * Add continuous pink noise floor (-36 to -42 dBFS)
   */
  private static addPinkNoiseFloor(channelData: Float32Array, sampleRate: number): void {
    const floorLevel = 0.004; // Approximately -48 dBFS, very quiet
    
    for (let i = 0; i < channelData.length; i++) {
      // Generate pink noise using simple approximation
      const white = (Math.random() - 0.5) * 2;
      const pink = white * Math.pow(0.5, Math.random()); // Approximate pink noise spectrum
      channelData[i] += pink * floorLevel;
    }
  }

  /**
   * Add single noise burst beat with optional double-pulse
   */
  private static addNoiseBurstBeat(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number,
    doublePulseOffsetMs: number | null
  ): void {
    // Primary burst
    this.addSingleNoiseBurst(channelData, startSample, sampleRate, amplitude);
    
    // Optional double pulse
    if (doublePulseOffsetMs !== null) {
      const offsetSamples = Math.floor((doublePulseOffsetMs / 1000) * sampleRate);
      const secondBurstStart = startSample + offsetSamples;
      const secondAmplitude = amplitude * (0.6 + Math.random() * 0.2); // 60-80% amplitude
      
      if (secondBurstStart < channelData.length) {
        this.addSingleNoiseBurst(channelData, secondBurstStart, sampleRate, secondAmplitude);
      }
    }
  }

  /**
   * Add single noise burst with proper envelope
   */
  private static addSingleNoiseBurst(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number
  ): void {
    // Envelope timing (5-10ms attack, 60-100ms decay)
    const attackMs = 5 + Math.random() * 5; // 5-10ms
    const decayMs = 60 + Math.random() * 40; // 60-100ms
    
    const attackSamples = Math.floor((attackMs / 1000) * sampleRate);
    const decaySamples = Math.floor((decayMs / 1000) * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      let envelope: number;
      
      if (i < attackSamples) {
        // Attack phase (5-10ms)
        envelope = i / attackSamples;
      } else {
        // Decay phase (60-100ms)
        const decayTime = (i - attackSamples) / decaySamples;
        envelope = Math.exp(-decayTime * 4); // Exponential decay
      }
      
      // Generate white noise
      const noise = (Math.random() - 0.5) * 2;
      
      // Apply envelope and amplitude
      const burstSample = noise * envelope * amplitude * 0.3; // Scale down for realistic level
      
      channelData[sampleIndex] += burstSample;
    }
  }

  /**
   * Apply band-pass filter (200-1200 Hz) to noise bursts
   */
  private static applyBandPassFilter(
    channelData: Float32Array,
    sampleRate: number,
    lowFreq: number,
    highFreq: number
  ): void {
    // Simple IIR band-pass filter implementation
    // This is a simplified approach - in production, you'd use proper DSP libraries
    
    const nyquist = sampleRate / 2;
    const lowCutoff = lowFreq / nyquist;
    const highCutoff = highFreq / nyquist;
    
    // High-pass filter coefficients (remove below 200 Hz)
    const alpha_hp = Math.exp(-2 * Math.PI * lowCutoff);
    let hp_prev_input = 0;
    let hp_prev_output = 0;
    
    // Low-pass filter coefficients (remove above 1200 Hz)
    const alpha_lp = Math.exp(-2 * Math.PI * highCutoff);
    let lp_prev_output = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const input = channelData[i];
      
      // High-pass filter
      const hp_output = alpha_hp * (hp_prev_output + input - hp_prev_input);
      hp_prev_input = input;
      hp_prev_output = hp_output;
      
      // Low-pass filter
      const lp_output = alpha_lp * lp_prev_output + (1 - alpha_lp) * hp_output;
      lp_prev_output = lp_output;
      
      channelData[i] = lp_output;
    }
  }

  /**
   * Apply dynamics processing (soft limiter, ratio ~3:1, threshold ~-18 dBFS)
   */
  private static applyDynamicsProcessing(channelData: Float32Array): void {
    const threshold = 0.125; // Approximately -18 dBFS
    const ratio = 3.0;
    const makeupGain = 1.2;
    
    for (let i = 0; i < channelData.length; i++) {
      const input = channelData[i];
      const inputLevel = Math.abs(input);
      
      if (inputLevel > threshold) {
        // Apply compression above threshold
        const excess = inputLevel - threshold;
        const compressedExcess = excess / ratio;
        const compressedLevel = threshold + compressedExcess;
        
        // Preserve sign
        channelData[i] = (input >= 0 ? 1 : -1) * compressedLevel * makeupGain;
      } else {
        channelData[i] = input * makeupGain;
      }
      
      // Soft limiting to prevent clipping
      channelData[i] = Math.tanh(channelData[i]);
    }
  }

  /**
   * Add watermark (prepend whisper for free version)
   */
  private static addWatermark(channelData: Float32Array, sampleRate: number): void {
    // Simple high-frequency watermark that doesn't interfere with medical audio
    const watermarkFreq = 15000; // 15kHz
    const watermarkAmplitude = 0.01; // Very subtle
    const watermarkDuration = 0.5; // 0.5 seconds
    const watermarkSamples = Math.floor(watermarkDuration * sampleRate);
    
    for (let i = 0; i < Math.min(watermarkSamples, channelData.length); i++) {
      const time = i / sampleRate;
      const watermark = Math.sin(2 * Math.PI * watermarkFreq * time) * watermarkAmplitude;
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
   * Create WAV file from AudioBuffer - produces mono 16-bit PCM
   */
  private static createWAVFile(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = 1; // Force mono
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

    // Audio data - ensure exactly 8.000s duration
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    console.log('🎵 WAV file creation completed - exact 8.000s mono 16-bit PCM');
    return buffer;
  }

  // Legacy methods for backward compatibility - will be deprecated
  static async generateRealisticHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Using legacy method - delegating to new noise-burst model');
    
    const options: AudioGenerationOptions = {
      bpm,
      duration,
      sampleRate: 44100,
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }

  static async generateSimpleHeartbeat(bmp: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Using legacy method - delegating to new noise-burst model');
    
    const options: AudioGenerationOptions = {
      bpm: bmp,
      duration,
      sampleRate: 44100,
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }

  static async generateFetalDopplerHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Using legacy method - delegating to new noise-burst model');
    
    const options: AudioGenerationOptions = {
      bpm,
      duration,
      sampleRate: 48000,
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }
}
