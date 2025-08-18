// Realistic Doppler Ultrasound Audio Generator
// Creates authentic fetal heartbeat sounds using noise-burst model
// Eliminates synthetic/tonal artifacts for clinical-grade audio

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
   * Generate realistic Doppler ultrasound heartbeat audio using noise-burst model
   */
  static async generateHeartbeatAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    console.log('🎵 Starting realistic Doppler audio generation with options:', options);

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        console.log('🎵 AudioContext created with sample rate:', this.audioContext.sampleRate);
      }

      // Force duration to exactly 8.000 seconds as per spec
      const fixedOptions = { ...options, duration: 8.000 };
      
      const audioBuffer = await this.createRealisticDopplerWaveform(fixedOptions);
      console.log('🎵 Realistic Doppler audio buffer created successfully');

      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      console.log('🎵 Audio blob created, size:', audioBlob.size, 'bytes');

      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: 8.000,
        bpm: options.bpm,
        fileSize: audioBlob.size
      };
    } catch (error) {
      console.error('❌ Realistic Doppler audio generation failed:', error);
      throw new Error('Failed to generate realistic Doppler heartbeat audio');
    }
  }

  /**
   * Create realistic Doppler ultrasound waveform using noise-burst model
   */
  private static async createRealisticDopplerWaveform(options: AudioGenerationOptions): Promise<AudioBuffer> {
    const { gptAnalysis, sampleRate, isWatermarked } = options;
    const duration = 8.000; // Fixed duration

    console.log('🎵 Creating realistic Doppler waveform - Duration: 8.000s, Sample Rate:', sampleRate);

    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Get timing data from GPT analysis or use defaults
    const beatTimes = gptAnalysis?.beat_times_sec || this.generateUniformBeatTimes(options.bpm, duration);
    const amplitudeScalars = gptAnalysis?.amplitude_scalars || beatTimes.map(() => 0.8);
    const doublePulseOffset = gptAnalysis?.double_pulse_offset_ms || null;

    console.log('🎵 Beat timing data:', { 
      beatCount: beatTimes.length, 
      doublePulse: doublePulseOffset !== null,
      firstBeat: beatTimes[0],
      lastBeat: beatTimes[beatTimes.length - 1]
    });

    // Generate constant low-level pink noise background (-36 to -42 dBFS)
    this.generatePinkNoiseBackground(channelData, sampleRate);

    // Generate noise-burst heartbeats at specified timing
    for (let i = 0; i < beatTimes.length; i++) {
      const beatTime = beatTimes[i];
      const amplitude = amplitudeScalars[i] || 0.8;
      const startSample = Math.floor(beatTime * sampleRate);
      
      // Add timing jitter (±3ms as per spec)
      const jitterMs = (Math.random() - 0.5) * 6; // ±3ms
      const jitterSamples = Math.floor(jitterMs * sampleRate / 1000);
      const adjustedStart = Math.max(0, startSample + jitterSamples);

      // Generate primary noise burst
      this.generateNoiseBurst(channelData, adjustedStart, sampleRate, amplitude);

      // Generate optional double-pulse if specified
      if (doublePulseOffset !== null) {
        const secondBurstDelay = Math.floor(doublePulseOffset * sampleRate / 1000);
        const secondBurstStart = adjustedStart + secondBurstDelay;
        const secondBurstAmplitude = amplitude * (0.6 + Math.random() * 0.2); // 60-80% of primary
        
        if (secondBurstStart < channelData.length) {
          this.generateNoiseBurst(channelData, secondBurstStart, sampleRate, secondBurstAmplitude);
        }
      }
    }

    // Apply final processing
    this.applyDopplerProcessing(channelData, sampleRate);

    // Add watermark if needed (prepend whisper as per spec)
    if (isWatermarked) {
      this.addWatermark(channelData, sampleRate);
    }

    console.log('🎵 Realistic Doppler waveform creation completed');
    return buffer;
  }

  /**
   * Generate uniform beat timing if not provided by GPT
   */
  private static generateUniformBeatTimes(bpm: number, duration: number): number[] {
    const beatInterval = 60 / bpm;
    const startTime = 0.12; // Start near 0.12s as per spec
    const beatTimes: number[] = [];
    
    for (let time = startTime; time < duration; time += beatInterval) {
      beatTimes.push(Number(time.toFixed(3)));
    }
    
    return beatTimes;
  }

  /**
   * Generate constant low-level pink noise background (-36 to -42 dBFS)
   */
  private static generatePinkNoiseBackground(channelData: Float32Array, sampleRate: number): void {
    const noiseLevel = Math.pow(10, -39 / 20); // Approximately -39 dBFS (middle of range)
    
    // Pink noise generation using simple IIR filter approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const white = (Math.random() - 0.5) * 2;
      
      // Simple pink noise filter (Voss-McCartney)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      
      channelData[i] = pink * noiseLevel * 0.1; // Scale down for background level
    }
  }

  /**
   * Generate individual noise burst for heartbeat
   */
  private static generateNoiseBurst(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number
  ): void {
    // Burst parameters as per spec
    const attackMs = 5 + Math.random() * 5; // 5-10ms attack
    const decayMs = 60 + Math.random() * 40; // 60-100ms decay
    
    const attackSamples = Math.floor(attackMs * sampleRate / 1000);
    const decaySamples = Math.floor(decayMs * sampleRate / 1000);
    const totalSamples = attackSamples + decaySamples;
    
    // Generate white noise source
    const noiseBuffer = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      noiseBuffer[i] = (Math.random() - 0.5) * 2;
    }
    
    // Apply band-pass filter (200-1200 Hz with center ~600 Hz)
    this.applyBandPassFilter(noiseBuffer, sampleRate, 200, 1200);
    
    // Apply optional frequency sweep for realism (500→800 Hz over first 20-40ms)
    const sweepDuration = Math.min(totalSamples, Math.floor((20 + Math.random() * 20) * sampleRate / 1000));
    this.applyFrequencySweep(noiseBuffer, sampleRate, sweepDuration, 500, 800);
    
    // Apply envelope (attack + decay)
    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      let envelope = 0;
      if (i < attackSamples) {
        // Attack phase: linear ramp up
        envelope = i / attackSamples;
      } else {
        // Decay phase: exponential decay
        const decayProgress = (i - attackSamples) / decaySamples;
        envelope = Math.exp(-decayProgress * 4); // Exponential decay
      }
      
      // Apply gentle amplitude variation (±5-8% as per spec)
      const variation = 1.0 + (Math.random() - 0.5) * 0.1; // ±5%
      const finalAmplitude = amplitude * envelope * variation;
      
      channelData[sampleIndex] += noiseBuffer[i] * finalAmplitude;
    }
  }

  /**
   * Apply band-pass filter to noise (200-1200 Hz)
   */
  private static applyBandPassFilter(
    buffer: Float32Array,
    sampleRate: number,
    lowFreq: number,
    highFreq: number
  ): void {
    // Simple IIR band-pass filter implementation
    const nyquist = sampleRate / 2;
    const lowNorm = lowFreq / nyquist;
    const highNorm = highFreq / nyquist;
    
    // High-pass stage (removes below 200 Hz)
    const a1_hp = Math.exp(-2 * Math.PI * lowNorm);
    let x1_hp = 0, y1_hp = 0;
    
    // Low-pass stage (removes above 1200 Hz)
    const a1_lp = Math.exp(-2 * Math.PI * highNorm);
    let y1_lp = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      // High-pass filter
      const hp_out = buffer[i] - x1_hp + a1_hp * y1_hp;
      x1_hp = buffer[i];
      y1_hp = hp_out;
      
      // Low-pass filter
      const lp_out = (1 - a1_lp) * hp_out + a1_lp * y1_lp;
      y1_lp = lp_out;
      
      buffer[i] = lp_out;
    }
  }

  /**
   * Apply subtle frequency sweep for realism (500→800 Hz over first 20-40ms)
   */
  private static applyFrequencySweep(
    buffer: Float32Array,
    sampleRate: number,
    sweepSamples: number,
    startFreq: number,
    endFreq: number
  ): void {
    if (sweepSamples === 0) return;
    
    for (let i = 0; i < Math.min(sweepSamples, buffer.length); i++) {
      const progress = i / sweepSamples;
      const currentFreq = startFreq + (endFreq - startFreq) * progress;
      
      // Apply subtle frequency modulation
      const time = i / sampleRate;
      const modulation = Math.sin(2 * Math.PI * currentFreq * time) * 0.1;
      buffer[i] *= (1 + modulation);
    }
  }

  /**
   * Apply final Doppler processing (soft limiting, no reverb/echo)
   */
  private static applyDopplerProcessing(channelData: Float32Array, sampleRate: number): void {
    // Apply soft limiter/compressor (ratio ~3:1, threshold ~-18 dBFS)
    const threshold = Math.pow(10, -18 / 20); // -18 dBFS
    const ratio = 3.0;
    const makeupGain = 1.2;
    
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
      
      // Soft clipping to prevent harsh peaks
      channelData[i] = Math.tanh(channelData[i]);
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
   * Add watermark (prepend whisper for free version)
   */
  private static addWatermark(channelData: Float32Array, sampleRate: number): void {
    // Add a very subtle high-frequency watermark that doesn't interfere with Doppler characteristics
    const watermarkFreq = 15000; // 15kHz - above typical Doppler range
    const watermarkDuration = 0.5; // 0.5 seconds at start
    const watermarkSamples = Math.floor(watermarkDuration * sampleRate);
    const watermarkAmplitude = 0.01; // Very subtle
    
    for (let i = 0; i < Math.min(watermarkSamples, channelData.length); i++) {
      const time = i / sampleRate;
      const fadeIn = Math.min(1, i / (sampleRate * 0.1)); // 0.1s fade in
      const fadeOut = Math.min(1, (watermarkSamples - i) / (sampleRate * 0.1)); // 0.1s fade out
      const envelope = fadeIn * fadeOut;
      
      const watermark = Math.sin(time * watermarkFreq * 2 * Math.PI) * watermarkAmplitude * envelope;
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
   * Legacy method compatibility - now uses the new realistic engine
   */
  static async generateRealisticHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Legacy method - redirecting to realistic Doppler engine');
    
    const options: AudioGenerationOptions = {
      bpm,
      duration: 8.000, // Force to 8 seconds
      sampleRate: 44100,
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }

  /**
   * Legacy method compatibility - now uses the new realistic engine
   */
  static async generateSimpleHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Legacy method - redirecting to realistic Doppler engine');
    
    const options: AudioGenerationOptions = {
      bpm,
      duration: 8.000, // Force to 8 seconds
      sampleRate: 44100,
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }

  /**
   * Legacy method compatibility - now uses the new realistic engine
   */
  static async generateFetalDopplerHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: UltrasoundAnalysis): Promise<string> {
    console.log('🎵 Legacy method - redirecting to realistic Doppler engine');
    
    const options: AudioGenerationOptions = {
      bpm,
      duration: 8.000, // Force to 8 seconds
      sampleRate: 48000, // Higher quality for this method
      isWatermarked: false,
      gptAnalysis
    };
    
    const result = await this.generateHeartbeatAudio(options);
    return result.audioUrl;
  }

  /**
   * Generate authentic Doppler background with very subtle Super Saiyan aura enhancement
   * Continuous low hum (80-300 Hz) + synchronized airy wosh (300-800 Hz) felt more than heard
   */
  private static generateYouTubeReferenceBackground(
    channelData: Float32Array,
    sampleRate: number,
    duration: number,
    bpm?: number
  ) {
    console.log('✨ Generating authentic Doppler with subtle aura enhancement - felt more than heard');
    
    const beatsPerSecond = (bpm || 140) / 60;
    const beatInterval = 1 / beatsPerSecond;
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Calculate position in current heartbeat cycle (0-1)
      const beatPhase = (time % beatInterval) / beatInterval;
      
      // Synchronized aura intensity - very subtle, felt more than heard
      let auraIntensity = 0.08; // Minimum presence
      if (beatPhase < 0.15) {
        // Whoomp phase - subtle aura enhancement
        const whoompPhase = beatPhase / 0.15;
        auraIntensity = 0.08 + (Math.sin(whoompPhase * Math.PI) * 0.12); // Peak at 0.2
      } else if (beatPhase < 0.25) {
        // Lub phase - gentle aura support
        const lubPhase = (beatPhase - 0.15) / 0.1;
        auraIntensity = 0.15 + (Math.sin(lubPhase * Math.PI) * 0.05); // Around 0.15-0.2
      } else if (beatPhase < 0.5) {
        // Fade phase - gentle decrease
        const fadePhase = (beatPhase - 0.25) / 0.25;
        auraIntensity = 0.15 * (1 - fadePhase * 0.5); // Fade to 0.075
      } else {
        // Rest phase - barely perceptible
        auraIntensity = 0.075 + (Math.sin((beatPhase - 0.5) * Math.PI * 2) * 0.015); // 0.06-0.09
      }
      
      // CONTINUOUS subtle hum - warm, low (80-300 Hz) - always present but gentle
      const subtleHum1 = Math.sin(2 * Math.PI * 90 * time + Math.sin(time * 0.7) * 0.15) * 0.015;
      const subtleHum2 = Math.sin(2 * Math.PI * 150 * time + Math.sin(time * 0.9) * 0.2) * 0.012;
      const subtleHum3 = Math.sin(2 * Math.PI * 220 * time + Math.sin(time * 0.5) * 0.1) * 0.010;
      const subtleHum4 = Math.sin(2 * Math.PI * 280 * time + Math.sin(time * 1.1) * 0.18) * 0.008;
      
      // SYNCHRONIZED airy wosh - mid range (300-800 Hz) - timed with heartbeat
      const airyWosh1 = Math.sin(2 * Math.PI * 350 * time + Math.sin(time * 1.8) * 0.4) * 0.012 * auraIntensity;
      const airyWosh2 = Math.sin(2 * Math.PI * 480 * time + Math.sin(time * 1.4) * 0.5) * 0.010 * auraIntensity;
      const airyWosh3 = Math.sin(2 * Math.PI * 620 * time + Math.sin(time * 2.0) * 0.3) * 0.008 * auraIntensity;
      const airyWosh4 = Math.sin(2 * Math.PI * 750 * time + Math.sin(time * 1.6) * 0.6) * 0.006 * auraIntensity;
      
      // Natural Doppler background - authentic amniotic fluid movement
      const naturalWhoosh = Math.sin(2 * Math.PI * 45 * time + Math.sin(time * 0.6) * 0.1) * 0.008;
      const bodyResonance = Math.sin(2 * Math.PI * 35 * time + Math.sin(time * 0.5) * 0.05) * 0.006;
      
      // Very gentle organic variation
      const organicNoise = (Math.random() - 0.5) * 0.003;
      
      channelData[i] = subtleHum1 + subtleHum2 + subtleHum3 + subtleHum4 + 
                      airyWosh1 + airyWosh2 + airyWosh3 + airyWosh4 +
                      naturalWhoosh + bodyResonance + organicNoise;
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
   * Add authentic Doppler whoomp-lub double-pulse pattern
   * Creates the characteristic double-pulse: deeper 'whoomp' + lighter 'lub'
   */
  private static addSubtleLubDubBeat(
    channelData: Float32Array,
    startSample: number,
    beatSamples: number,
    sampleRate: number,
    characteristics: any,
    beatIndex: number
  ) {
    // Authentic Doppler timing: whoomp immediately followed by lub
    const whoompDuration = Math.floor(beatSamples * 0.25); // 25% for deeper whoomp
    const lubDuration = Math.floor(beatSamples * 0.15); // 15% for lighter lub
    const shortPause = Math.floor(beatSamples * 0.03); // Very short pause between whoomp-lub
    
    const whoompStart = startSample;
    const lubStart = whoompStart + whoompDuration + shortPause;
    
    // Natural variation for authentic Doppler recording
    const intensityVariation = 1.0 + (Math.random() - 0.5) * 0.2; // ±10%
    
    // Generate authentic deep 'whoomp' - natural Doppler recording
    this.addDopplerWhoompSound(
      channelData,
      whoompStart,
      whoompDuration,
      sampleRate,
      characteristics.systolicIntensity * intensityVariation * 0.65, // Natural fetal heartbeat strength
      characteristics.frequencyRange.systolic
    );
    
    // Generate soft, airy 'lub' - authentic secondary pulse
    this.addDopplerLubSound(
      channelData,
      lubStart,
      lubDuration,
      sampleRate,
      characteristics.diastolicIntensity * intensityVariation * 0.45, // Natural secondary pulse
      characteristics.frequencyRange.diastolic
    );
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
   * Add deeper, rounded 'whoomp' sound with ethereal aura quality
   * Creates the characteristic deeper pulse with Super Saiyan-like fluid resonance
   */
  private static addDopplerWhoompSound(
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
      const decay = Math.exp(-time * 3.5); // Gentler decay for more organic feel
      
      // Create authentic deep whoomp - like real Doppler recording (60-150 Hz range)
      const fundamental = 60 + Math.sin(time * Math.PI * 1.8) * 45; // 60-105 Hz base, can reach 150 Hz
      const whoomp = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity;
      
      // Natural harmonics - warm, muffled through amniotic fluid
      const naturalHarmonic1 = Math.sin(2 * Math.PI * (fundamental * 1.3) * time + Math.sin(time * 1.5) * 0.2) * decay * intensity * 0.4;
      const naturalHarmonic2 = Math.sin(2 * Math.PI * (fundamental * 0.7) * time + Math.sin(time * 1.2) * 0.15) * decay * intensity * 0.3;
      
      // Fluid resonance - muffled through body tissue and amniotic fluid
      const fluidResonance = Math.sin(2 * Math.PI * (fundamental * 0.8) * time) * decay * intensity * 0.45;
      
      // Soft organic texture - natural variation
      const organicTexture = Math.sin(2 * Math.PI * (fundamental + Math.sin(time * 1.8) * 3) * time) * decay * intensity * 0.25;
      
      // Warm body warmth - intimate, protected feeling
      const bodyWarmth = Math.sin(2 * Math.PI * (fundamental * 0.9) * time) * decay * intensity * 0.35;
      
      // Combine for authentic, muffled whoomp - like real Doppler recording
      channelData[sampleIndex] += (whoomp + naturalHarmonic1 + naturalHarmonic2 + fluidResonance + 
                                   organicTexture + bodyWarmth) * 0.7;
    }
  }

  /**
   * Add softer 'lub' sound with ethereal resonance
   * Creates the characteristic lighter pulse that harmonizes with the aural background
   */
  private static addDopplerLubSound(
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
      const decay = Math.exp(-time * 6); // Gentle decay for soft texture
      
      // Create softer, airy 'lub' - authentic Doppler mid-range (80-200 Hz range)
      const fundamental = 80 + Math.sin(time * Math.PI * 2.2) * 50; // 80-130 Hz base, can reach 200 Hz
      const lub = Math.sin(2 * Math.PI * fundamental * time) * decay * intensity;
      
      // Airy harmonics - soft, muffled through amniotic fluid
      const airyHarmonic1 = Math.sin(2 * Math.PI * (fundamental * 1.4) * time + Math.sin(time * 1.3) * 0.15) * decay * intensity * 0.35;
      const airyHarmonic2 = Math.sin(2 * Math.PI * (fundamental * 0.8) * time + Math.sin(time * 1.6) * 0.12) * decay * intensity * 0.25;
      
      // Fluid-like texture - gentle, soft movement
      const fluidTexture = Math.sin(2 * Math.PI * (fundamental * 1.1) * time + Math.sin(time * 1.2) * 0.2) * decay * intensity * 0.3;
      
      // Soft natural resonance - warm, muffled
      const naturalResonance = Math.sin(2 * Math.PI * (fundamental * 0.9) * time) * decay * intensity * 0.28;
      
      // Combine for authentic, airy 'lub' - soft and muffled like real Doppler
      channelData[sampleIndex] += (lub + airyHarmonic1 + airyHarmonic2 + fluidTexture + naturalResonance) * 0.55;
    }
  }

  /**
   * Apply ethereal Doppler processing with Super Saiyan aura-like quality
   * Enhances the warm, intimate, organic feel with continuous flowing energy
   */
  private static applyYouTubeReferenceProcessing(channelData: Float32Array, sampleRate: number) {
    // Gentle compression to enhance the whoomp-lub pattern while preserving aural flow
    for (let i = 0; i < channelData.length; i++) {
      // Soft compression with ethereal quality preservation
      channelData[i] = Math.tanh(channelData[i] * 1.05) * 0.98;
    }
    
    // Apply warm, organic filtering - like energy flowing through amniotic fluid
    for (let i = 1; i < channelData.length; i++) {
      channelData[i] = channelData[i] * 0.86 + channelData[i - 1] * 0.14;
    }
    
    // Add ethereal reverberation for in-womb intimacy
    const echoDelay1 = Math.floor(sampleRate * 0.012); // 12ms echo
    const echoDelay2 = Math.floor(sampleRate * 0.025); // 25ms echo
    for (let i = Math.max(echoDelay1, echoDelay2); i < channelData.length; i++) {
      channelData[i] += channelData[i - echoDelay1] * 0.06; // Primary echo
      channelData[i] += channelData[i - echoDelay2] * 0.04; // Secondary echo
    }
    
    // Apply gentle harmonic enhancement for aural richness
    for (let i = 2; i < channelData.length - 2; i++) {
      const harmonicEnhancement = (channelData[i - 2] + channelData[i - 1] + channelData[i] + 
                                  channelData[i + 1] + channelData[i + 2]) * 0.02;
      channelData[i] += harmonicEnhancement;
    }
    
    // Normalize for intimate, organic Doppler volume
    let maxAmplitude = 0;
    for (let i = 0; i < channelData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    
    if (maxAmplitude > 0) {
      // Normalize to warm, intimate level - like being close to life energy
      const normalizeFactor = 0.85 / maxAmplitude; 
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= normalizeFactor;
      }
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
