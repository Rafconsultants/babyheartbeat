/**
 * Reliable Fetal Doppler Ultrasound Heartbeat Synthesizer
 * Simplified implementation that guarantees audio output
 */

export interface DopplerHeartbeatOptions {
  bpm: number;
  duration: number;
  sampleRate: number;
  hasDoublePulse?: boolean;
  doublePulseOffset?: number; // ms
  timingVariability?: number; // ms
  amplitudeVariation?: number; // 0-1
}

export interface DopplerHeartbeatResult {
  audioUrl: string;
  duration: number;
  bpm: number;
  fileSize: number;
  hasDoublePulse: boolean;
}

export class DopplerHeartbeatSynthesizer {
  private static audioContext: AudioContext | null = null;

  /**
   * Generate reliable fetal Doppler ultrasound heartbeat audio
   */
  static async generateDopplerHeartbeat(options: DopplerHeartbeatOptions): Promise<DopplerHeartbeatResult> {
    console.log('🎵 Starting reliable Doppler heartbeat synthesis');
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

      // Create audio buffer
      const buffer = this.audioContext.createBuffer(1, options.sampleRate * options.duration, options.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Generate reliable Doppler heartbeat
      this.generateReliableDopplerWaveform(channelData, options);

      // Verify audio was generated
      const hasAudio = this.verifyAudioContent(channelData);
      if (!hasAudio) {
        console.warn('🎵 No audio detected, generating fallback audio');
        this.generateFallbackAudio(channelData, options);
      }

      // Convert to WAV and create blob
      const wavBuffer = this.audioBufferToWAV(buffer);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Doppler heartbeat synthesis completed');
      console.log('🎵 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio content verified:', hasAudio);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size,
        hasDoublePulse: options.hasDoublePulse || false
      };

    } catch (error) {
      console.error('❌ Doppler heartbeat synthesis failed:', error);
      throw new Error(`Failed to generate Doppler heartbeat audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate reliable Doppler waveform with simplified approach
   */
  private static generateReliableDopplerWaveform(channelData: Float32Array, options: DopplerHeartbeatOptions): void {
    const { bpm, duration, sampleRate, hasDoublePulse = false, doublePulseOffset = 55, timingVariability = 15, amplitudeVariation = 0.1 } = options;

    console.log('🎵 Generating reliable Doppler waveform...');

    // Calculate beat timing
    const beatInterval = 60 / bpm; // seconds between beats
    const totalSamples = channelData.length;

    console.log('🎵 Beat interval:', beatInterval, 'seconds');
    console.log('🎵 Total samples:', totalSamples);

    // Fill with very low background noise first (not silence)
    for (let i = 0; i < totalSamples; i++) {
      channelData[i] = (Math.random() - 0.5) * 0.001; // Very low background noise
    }

    // Generate heartbeat pattern
    let currentTime = 0.2; // Start first beat at 200ms
    let beatCount = 0;

    while (currentTime < duration) {
      // Add timing variability (±10-20ms)
      const timingJitter = (Math.random() - 0.5) * (timingVariability / 1000);
      const actualBeatTime = currentTime + timingJitter;
      
      // Add amplitude variation
      const amplitudeJitter = 1 + (Math.random() - 0.5) * amplitudeVariation;
      
      // Generate primary beat with guaranteed audio
      this.generateReliableNoiseBurst(
        channelData,
        actualBeatTime,
        sampleRate,
        amplitudeJitter,
        true
      );

      // Generate secondary beat for double pulse
      if (hasDoublePulse) {
        const secondaryTime = actualBeatTime + (doublePulseOffset / 1000);
        this.generateReliableNoiseBurst(
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

    console.log(`🎵 Generated ${beatCount} beats at ${bpm} BPM`);
  }

  /**
   * Generate a reliable noise burst that guarantees audio output
   */
  private static generateReliableNoiseBurst(
    channelData: Float32Array,
    startTime: number,
    sampleRate: number,
    amplitude: number,
    isPrimary: boolean
  ): void {
    const startSample = Math.floor(startTime * sampleRate);
    
    // Ensure we have enough samples
    if (startSample >= channelData.length) {
      console.warn('🎵 Beat time exceeds buffer length, skipping');
      return;
    }
    
    // Attack: 5-10ms, Decay: 60-100ms
    const attackTime = isPrimary ? 0.008 : 0.006; // 8ms for primary, 6ms for secondary
    const decayTime = isPrimary ? 0.080 : 0.060; // 80ms for primary, 60ms for secondary
    
    const attackSamples = Math.floor(attackTime * sampleRate);
    const decaySamples = Math.floor(decayTime * sampleRate);
    const totalSamples = attackSamples + decaySamples;
    
    const maxAmplitude = amplitude * 0.4; // Increased amplitude for reliability
    const baseFrequency = 250; // Center frequency

    console.log(`🎵 Generating burst: start=${startSample}, attack=${attackSamples}, decay=${decaySamples}, total=${totalSamples}`);

    for (let i = 0; i < totalSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;

      const timeInBurst = i / sampleRate;
      
      // Calculate envelope
      let envelope = 0;
      if (i < attackSamples) {
        // Attack: linear rise
        envelope = i / attackSamples;
      } else {
        // Decay: exponential fall
        const decayTimeInBurst = (i - attackSamples) / sampleRate;
        envelope = Math.exp(-decayTimeInBurst * 6); // Slower decay for reliability
      }

      // Generate reliable filtered noise
      const noise = this.generateReliableFilteredNoise(timeInBurst, baseFrequency);
      const sample = noise * envelope * maxAmplitude;
      
      channelData[sampleIndex] += sample;
    }
  }

  /**
   * Generate reliable filtered noise
   */
  private static generateReliableFilteredNoise(time: number, baseFrequency: number): number {
    // Simplified but reliable noise generation
    let filteredNoise = 0;
    
    // Primary frequency band (150-300 Hz emphasis)
    const primaryFreq = baseFrequency + (Math.random() - 0.5) * 150;
    filteredNoise += Math.sin(2 * Math.PI * primaryFreq * time) * 0.8; // Increased amplitude
    
    // Secondary frequency band (200-1200 Hz)
    const secondaryFreq = 400 + Math.random() * 800;
    filteredNoise += Math.sin(2 * Math.PI * secondaryFreq * time) * 0.4;
    
    // High frequency noise (1200+ Hz)
    const highFreq = 1200 + Math.random() * 800;
    filteredNoise += Math.sin(2 * Math.PI * highFreq * time) * 0.2;
    
    // Add pure noise component for reliability
    filteredNoise += (Math.random() - 0.5) * 0.3;
    
    return filteredNoise * 0.6; // Normalize but keep strong signal
  }

  /**
   * Verify that audio content was actually generated
   */
  private static verifyAudioContent(channelData: Float32Array): boolean {
    let maxAmplitude = 0;
    let rms = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      maxAmplitude = Math.max(maxAmplitude, sample);
      rms += sample * sample;
    }
    
    rms = Math.sqrt(rms / channelData.length);
    
    console.log('🎵 Audio verification - Max amplitude:', maxAmplitude, 'RMS:', rms);
    
    // Check if we have meaningful audio content
    return maxAmplitude > 0.01 && rms > 0.001;
  }

  /**
   * Generate fallback audio if main generation fails
   */
  private static generateFallbackAudio(channelData: Float32Array, options: DopplerHeartbeatOptions): void {
    console.log('🎵 Generating fallback audio...');
    
    const { bpm, duration, sampleRate } = options;
    const beatInterval = 60 / bpm;
    
    // Generate simple but guaranteed audio
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Add background noise
      channelData[i] = (Math.random() - 0.5) * 0.01;
      
      // Add heartbeat pattern
      const beatTime = time % beatInterval;
      if (beatTime < 0.1) { // 100ms beat duration
        const envelope = Math.exp(-beatTime * 10);
        const frequency = 200 + Math.random() * 100;
        channelData[i] += Math.sin(2 * Math.PI * frequency * time) * envelope * 0.3;
      }
    }
    
    console.log('🎵 Fallback audio generated');
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
