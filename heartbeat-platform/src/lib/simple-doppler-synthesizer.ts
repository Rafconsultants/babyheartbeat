/**
 * Simple Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Focused on generating realistic audio without complex analysis
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
   * Generate simple, realistic fetal Doppler ultrasound heartbeat audio
   */
  static async generateSimpleDoppler(options: SimpleDopplerOptions): Promise<SimpleDopplerResult> {
    console.log('🎵 Starting simple Doppler synthesis');
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

      // Generate simple Doppler heartbeat
      this.generateSimpleDopplerWaveform(channelData, options);

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Simple Doppler synthesis completed');
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
      console.error('❌ Simple Doppler synthesis failed:', error);
      throw new Error(`Failed to generate simple Doppler audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the simple Doppler waveform
   */
  private static generateSimpleDopplerWaveform(channelData: Float32Array, options: SimpleDopplerOptions): void {
    const { bpm, duration, sampleRate, hasDoublePulse = false, doublePulseOffset = 55, timingVariability = 15, amplitudeVariation = 0.1 } = options;

    console.log('🎵 Generating simple Doppler waveform...');

    // Calculate beat timing
    const beatInterval = 60 / bpm; // seconds between beats
    const totalSamples = channelData.length;

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total samples:', totalSamples);

    // Generate heartbeat pattern
    let currentTime = 0.2; // Start first beat at 200ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add timing variability
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate primary beat
      this.generateSimpleBeat(
        channelData,
        actualBeatTime,
        sampleRate,
        amplitudeJitter,
        true
      );

      // Generate secondary beat for double pulse
      if (hasDoublePulse) {
        const secondaryTime = actualBeatTime + (doublePulseOffset / 1000);
        this.generateSimpleBeat(
          channelData,
          secondaryTime,
          sampleRate,
          amplitudeJitter * 0.6, // 60% of primary amplitude
          false
        );
      }

      currentTime += beatInterval;
      beatCount++;
    }

    // Add background noise
    this.addBackgroundNoise(channelData, sampleRate);

    console.log(`🎵 Generated ${beatCount} beats at ${bpm} BPM`);
  }

  /**
   * Generate a simple beat
   */
  private static generateSimpleBeat(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    if (startSample >= channelData.length) return;
    
    // Simple beat parameters
    const attackTime = 0.008; // 8ms attack
    const decayTime = 0.080; // 80ms decay
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.4; // Strong amplitude

    console.log(`🎵 Generating beat: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBeat = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: linear rise
        envelope = i / attackSamples;
      } else {
        // Decay: exponential fall
        const decayTimeInBeat = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBeat * 6);
      }

      // Generate simple noise burst
      const noise = this.generateSimpleNoise(timeInBeat);
      const sample = noise * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate simple noise for the beat
   */
  private static generateSimpleNoise(time: number): number {
    let noise = 0;
    
    // Primary thump frequency (200-300 Hz)
    const thumpFreq = 200 + Math.random() * 100;
    noise += Math.sin(2 * Math.PI * thumpFreq * time) * 1.0;
    
    // Secondary frequency for richness
    const secondaryFreq = 400 + Math.random() * 200;
    noise += Math.sin(2 * Math.PI * secondaryFreq * time) * 0.6;
    
    // High frequency hiss
    const hissFreq = 800 + Math.random() * 400;
    noise += Math.sin(2 * Math.PI * hissFreq * time) * 0.4;
    
    // Add broadband noise
    noise += (Math.random() - 0.5) * 0.5;
    
    return noise * 0.8;
  }

  /**
   * Add simple background noise
   */
  private static addBackgroundNoise(channelData: Float32Array, sampleRate: number): void {
    console.log('🎵 Adding background noise...');
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Simple background noise
      let background = 0;
      
      // Low frequency warmth
      const warmFreq = 150 + Math.sin(time * 0.1) * 50;
      background += Math.sin(2 * Math.PI * warmFreq * time) * 0.02;
      
      // Mid frequency body
      const bodyFreq = 400 + Math.sin(time * 0.2) * 100;
      background += Math.sin(2 * Math.PI * bodyFreq * time) * 0.015;
      
      // High frequency hiss
      const hissFreq = 800 + Math.sin(time * 0.3) * 200;
      background += Math.sin(2 * Math.PI * hissFreq * time) * 0.01;
      
      // Add broadband noise
      background += (Math.random() - 0.5) * 0.03;
      
      channelData[i] += background;
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
