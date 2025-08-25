/**
 * Realistic Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Creates authentic "whoomp-lub" double-pulse patterns with warm, organic background
 */

export interface SimpleDopplerOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  hasDoublePulse?: boolean;
  doublePulseOffset?: number; // ms
  timingVariability?: number; // ms
  amplitudeVariation?: number; // 0-1
}

export interface SimpleDopplerResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
}

export class SimpleDopplerSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateSimpleDoppler(options: SimpleDopplerOptions): Promise<SimpleDopplerResult> {
    console.log('🎵 Starting realistic fetal Doppler synthesis');
    console.log('🎵 Options:', options);

    try {
      // Initialize AudioContext
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      if (!this.audioContext) {
        try {
          this.audioContext = new AudioContext();
        } catch (error) {
          console.warn('🎵 Standard AudioContext failed, trying webkitAudioContext:', error);
          try {
            this.audioContext = new (window as any).webkitAudioContext();
          } catch (webkitError) {
            throw new Error('AudioContext not supported in this browser');
          }
        }
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🎵 AudioContext ready, state:', this.audioContext.state);

      // Create mono audio buffer
      if (!this.audioContext) {
        throw new Error('AudioContext initialization failed');
      }
      
      const buffer = this.audioContext.createBuffer(1, options.sampleRate * options.duration, options.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Generate realistic fetal Doppler heartbeat
      this.generateRealisticFetalDoppler(channelData, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Realistic fetal Doppler synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL created:', audioUrl);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false
      };

    } catch (error) {
      console.error('❌ Realistic fetal Doppler synthesis failed:', error);
      throw new Error(`Failed to generate realistic fetal Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate realistic fetal Doppler waveform with "whoomp-lub" pattern
   */
  private static generateRealisticFetalDoppler(channelData: Float32Array, options: SimpleDopplerOptions): void {
    const { bpm, duration, sampleRate, hasDoublePulse = true, doublePulseOffset = 120, timingVariability = 20, amplitudeVariation = 0.15 } = options;

    console.log('🎵 Generating realistic fetal Doppler waveform...');

    // Calculate beat timing
    const beatInterval = 60 / bpm; // seconds between beats
    const totalSamples = channelData.length;

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total samples:', totalSamples);

    // Generate continuous warm background first
    this.generateWarmAmnioticBackground(channelData, sampleRate, duration);

    // Generate heartbeat pattern
    let currentTime = 0.3; // Start first beat at 300ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add timing variability for organic feel
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate "whoomp-lub" double-pulse pattern
      this.generateWhoompLubPattern(
        channelData,
        actualBeatTime,
        sampleRate,
        amplitudeJitter,
        doublePulseOffset
      );

      currentTime += beatInterval;
      beatCount++;
    }

    console.log(`🎵 Generated ${beatCount} "whoomp-lub" patterns at ${bpm} BPM`);
  }

  /**
   * Generate the "whoomp-lub" double-pulse pattern
   */
  private static generateWhoompLubPattern(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    doublePulseOffset: number
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= channelData.length) return;
    
    // Generate "whoomp" (primary beat)
    this.generateWhoompBeat(channelData, startSample, sampleRate, amplitude);
    
    // Generate "lub" (secondary beat)
    const lubStartSample = startSample + Math.floor((doublePulseOffset / 1000) * sampleRate);
    this.generateLubBeat(channelData, lubStartSample, sampleRate, amplitude * 0.7); // 70% of primary amplitude
  }

  /**
   * Generate the "whoomp" (primary beat)
   */
  private static generateWhoompBeat(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number
  ): void {
    // "Whoomp" characteristics: deeper, rounded, longer duration
    const attackTime = 0.015; // 15ms attack
    const sustainTime = 0.025; // 25ms sustain
    const decayTime = 0.120; // 120ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const sustainSamples = Math.floor(sustainTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + sustainSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.6; // Strong but not overwhelming

    console.log(`🎵 Generating "whoomp": start=${startSample}, attack=${attackSamples}, sustain=${sustainSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: smooth rise
        envelope = Math.pow(i / attackSamples, 0.7);
      } else if (i < attackSamples + sustainSamples) {
        // Sustain: hold
        envelope = 1.0;
      } else {
        // Decay: smooth fall
        const decayTimeInBeat = (i - attackSamples - sustainSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 4);
      }

      // Generate "whoomp" sound
      const whoompSound = this.generateWhoompSound(timeInBeat);
      const sample = whoompSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate the "lub" (secondary beat)
   */
  private static generateLubBeat(
    channelData: Float32Array,
    startSample: number,
    sampleRate: number,
    amplitude: number
  ): void {
    // "Lub" characteristics: softer, shorter, higher frequency
    const attackTime = 0.008; // 8ms attack
    const decayTime = 0.080; // 80ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.5; // Softer than whoomp

    console.log(`🎵 Generating "lub": start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: quick rise
        envelope = i / attackSamples;
      } else {
        // Decay: quick fall
        const decayTimeInBeat = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 8);
      }

      // Generate "lub" sound
      const lubSound = this.generateLubSound(timeInBeat);
      const sample = lubSound * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate "whoomp" sound (deeper, rounded)
   */
  private static generateWhoompSound(time: number): number {
    let whoomp = 0;
    
    // Deep fundamental (120-180 Hz) - the "whoomp" core
    const fundamentalFreq = 120 + Math.random() * 60;
    whoomp += Math.sin(2 * Math.PI * fundamentalFreq * time) * 1.0;
    
    // Rich harmonics for rounded quality
    const harmonic1 = fundamentalFreq * 1.5;
    whoomp += Math.sin(2 * Math.PI * harmonic1 * time) * 0.6;
    
    const harmonic2 = fundamentalFreq * 2.2;
    whoomp += Math.sin(2 * Math.PI * harmonic2 * time) * 0.4;
    
    // Low-mid warmth (200-300 Hz)
    const warmthFreq = 200 + Math.random() * 100;
    whoomp += Math.sin(2 * Math.PI * warmthFreq * time) * 0.8;
    
    // Subtle high frequency for clarity
    const clarityFreq = 400 + Math.random() * 200;
    whoomp += Math.sin(2 * Math.PI * clarityFreq * time) * 0.3;
    
    // Add broadband noise for organic texture
    whoomp += (Math.random() - 0.5) * 0.4;
    
    return whoomp * 0.7; // Normalize
  }

  /**
   * Generate "lub" sound (softer, higher frequency)
   */
  private static generateLubSound(time: number): number {
    let lub = 0;
    
    // Higher fundamental (250-350 Hz) - the "lub" character
    const fundamentalFreq = 250 + Math.random() * 100;
    lub += Math.sin(2 * Math.PI * fundamentalFreq * time) * 0.8;
    
    // Mid harmonics for body
    const harmonic1 = fundamentalFreq * 1.8;
    lub += Math.sin(2 * Math.PI * harmonic1 * time) * 0.5;
    
    // Higher frequency for "lub" character
    const lubFreq = 500 + Math.random() * 200;
    lub += Math.sin(2 * Math.PI * lubFreq * time) * 0.6;
    
    // High frequency hiss for Doppler character
    const hissFreq = 800 + Math.random() * 400;
    lub += Math.sin(2 * Math.PI * hissFreq * time) * 0.4;
    
    // Add broadband noise for texture
    lub += (Math.random() - 0.5) * 0.3;
    
    return lub * 0.6; // Normalize
  }

  /**
   * Generate warm, amniotic fluid-like background
   */
  private static generateWarmAmnioticBackground(channelData: Float32Array, sampleRate: number, duration: number): void {
    console.log('🎵 Generating warm amniotic background...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Create fluid, wave-like background
      let background = 0;
      
      // Deep, warm foundation (80-120 Hz) - like amniotic fluid
      const fluidFreq = 80 + Math.sin(time * 0.05) * 40;
      background += Math.sin(2 * Math.PI * fluidFreq * time) * 0.015;
      
      // Body tissue resonance (150-250 Hz)
      const tissueFreq = 150 + Math.sin(time * 0.08) * 100;
      background += Math.sin(2 * Math.PI * tissueFreq * time) * 0.012;
      
      // Mid-frequency warmth (300-500 Hz)
      const warmthFreq = 300 + Math.sin(time * 0.12) * 200;
      background += Math.sin(2 * Math.PI * warmthFreq * time) * 0.008;
      
      // High-frequency muffled hiss (600-1000 Hz)
      const hissFreq = 600 + Math.sin(time * 0.15) * 400;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.005;
      
      // Add very subtle broadband noise for fluid texture
      background += (Math.random() - 0.5) * 0.008;
      
      // Apply gentle modulation for wave-like quality
      const waveModulation = 1 + Math.sin(time * 0.3) * 0.3;
      background *= waveModulation;
      
      channelData[i] = background;
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private static audioBufferToWAV(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }
}
