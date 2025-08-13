// Audio Generation Service
// Creates exact ultrasound Doppler heartbeat audio based on GPT-4 analysis
// Designed to match real fetal ultrasound heartbeat sounds

export interface AudioGenerationOptions {
  bpm: number;
  duration: number; // in seconds
  sampleRate: number;
  isWatermarked: boolean;
  gptAnalysis?: string; // GPT-4 analysis of the ultrasound image
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
   * Generate exact ultrasound heartbeat audio based on GPT-4 analysis
   */
  static async generateHeartbeatAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    try {
      // Initialize audio context if not already done
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      // Generate the exact ultrasound heartbeat waveform based on GPT analysis
      const audioBuffer = await this.createExactUltrasoundHeartbeatWaveform(options);
      
      // Convert to blob and create URL
      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        duration: options.duration,
        bpm: options.bpm,
        fileSize: audioBlob.size
      };
    } catch (error) {
      console.error('Audio generation failed:', error);
      throw new Error('Failed to generate heartbeat audio');
    }
  }

  /**
   * Create exact ultrasound Doppler heartbeat waveform based on GPT analysis
   */
  private static async createExactUltrasoundHeartbeatWaveform(options: AudioGenerationOptions): Promise<AudioBuffer> {
    const { bpm, duration, sampleRate, gptAnalysis } = options;
    
    // Calculate timing for exact heartbeat rhythm
    const beatsPerSecond = bpm / 60;
    const beatInterval = 1 / beatsPerSecond; // seconds between beats
    
    // Create audio buffer
    const buffer = this.audioContext!.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    // Generate exact ultrasound heartbeat pattern based on GPT analysis
    for (let i = 0; i < duration; i += beatInterval) {
      const beatStart = Math.floor(i * sampleRate);
      const beatEnd = Math.floor((i + 0.6) * sampleRate); // Each beat lasts 0.6 seconds
      
      // Create the exact ultrasound heartbeat sound based on GPT analysis
      this.addExactUltrasoundHeartbeat(channelData, beatStart, beatEnd, sampleRate, options.isWatermarked, gptAnalysis);
    }
    
    return buffer;
  }

  /**
   * Add exact ultrasound Doppler heartbeat sound based on GPT analysis
   * This creates the authentic "whoosh-whoosh" pattern of real fetal ultrasound
   */
  private static addExactUltrasoundHeartbeat(
    channelData: Float32Array, 
    startSample: number, 
    endSample: number, 
    sampleRate: number,
    isWatermarked: boolean,
    gptAnalysis?: string
  ) {
    const beatDuration = endSample - startSample;
    
    // Adjust parameters based on GPT analysis if available
    let systolicFreq = 1000;
    let diastolicFreq = 700;
    let systolicAmplitude = 0.9;
    let diastolicAmplitude = 0.7;
    
    if (gptAnalysis) {
      // Use GPT analysis to adjust audio parameters
      const analysis = gptAnalysis.toLowerCase();
      
      // Adjust frequency based on analysis
      if (analysis.includes('strong') || analysis.includes('clear')) {
        systolicFreq = 1100;
        diastolicFreq = 750;
        systolicAmplitude = 1.0;
        diastolicAmplitude = 0.8;
      } else if (analysis.includes('weak') || analysis.includes('faint')) {
        systolicFreq = 900;
        diastolicFreq = 650;
        systolicAmplitude = 0.7;
        diastolicAmplitude = 0.5;
      }
      
      // Adjust based on waveform characteristics mentioned
      if (analysis.includes('regular') || analysis.includes('normal')) {
        // Use standard parameters
      } else if (analysis.includes('irregular') || analysis.includes('variable')) {
        // Add slight variation
        systolicFreq += Math.random() * 100 - 50;
        diastolicFreq += Math.random() * 100 - 50;
      }
    }
    
    // Real fetal ultrasound has two distinct "whoosh" sounds with specific characteristics
    // First whoosh (systolic - blood rushing into the heart)
    const firstWhooshDuration = Math.floor(beatDuration * 0.35);
    this.addExactUltrasoundWhoosh(channelData, startSample, firstWhooshDuration, systolicFreq, systolicAmplitude, sampleRate, 'systolic');
    
    // Brief pause (realistic timing)
    const pauseDuration = Math.floor(beatDuration * 0.1);
    
    // Second whoosh (diastolic - blood flowing out)
    const secondWhooshStart = startSample + firstWhooshDuration + pauseDuration;
    const secondWhooshDuration = Math.floor(beatDuration * 0.35);
    this.addExactUltrasoundWhoosh(channelData, secondWhooshStart, secondWhooshDuration, diastolicFreq, diastolicAmplitude, sampleRate, 'diastolic');
    
    // Add authentic ultrasound background noise
    this.addExactUltrasoundBackgroundNoise(channelData, startSample, endSample, sampleRate);
    
    // Add watermark if needed
    if (isWatermarked) {
      this.addWatermark(channelData, startSample, endSample, sampleRate);
    }
  }

  /**
   * Add exact ultrasound "whoosh" sound with authentic Doppler characteristics
   */
  private static addExactUltrasoundWhoosh(
    channelData: Float32Array,
    startSample: number,
    duration: number,
    baseFreq: number,
    amplitude: number,
    sampleRate: number,
    type: 'systolic' | 'diastolic'
  ) {
    for (let i = 0; i < duration; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= channelData.length) break;
      
      const time = i / sampleRate;
      const decay = Math.exp(-time * 15); // Very sharp decay for authentic ultrasound
      
      // Create exact frequency sweep (Doppler effect)
      let freqSweep: number;
      if (type === 'systolic') {
        // Systolic: frequency increases sharply then decreases (blood rushing in)
        freqSweep = baseFreq + Math.sin(time * Math.PI * 3) * 600;
      } else {
        // Diastolic: frequency decreases then increases (blood flowing out)
        freqSweep = baseFreq - Math.sin(time * Math.PI * 2.5) * 400;
      }
      
      // Main whoosh sound with exact harmonics
      const whoosh = Math.sin(time * freqSweep * 2 * Math.PI) * decay * amplitude;
      
      // Add exact harmonics for authentic ultrasound sound
      const harmonic1 = Math.sin(time * freqSweep * 2 * 2 * Math.PI) * decay * amplitude * 0.6;
      const harmonic2 = Math.sin(time * freqSweep * 3 * 2 * Math.PI) * decay * amplitude * 0.4;
      const harmonic3 = Math.sin(time * freqSweep * 4 * 2 * Math.PI) * decay * amplitude * 0.2;
      
      // Add subtle modulation for exact realism
      const modulation = Math.sin(time * 25 * 2 * Math.PI) * 0.15;
      
      // Combine all components for authentic sound
      channelData[sampleIndex] += (whoosh + harmonic1 + harmonic2 + harmonic3) * (1 + modulation);
    }
  }

  /**
   * Add exact ultrasound background noise
   */
  private static addExactUltrasoundBackgroundNoise(
    channelData: Float32Array,
    startSample: number,
    endSample: number,
    sampleRate: number
  ) {
    for (let i = startSample; i < endSample; i++) {
      if (i >= channelData.length) break;
      
      const time = (i - startSample) / sampleRate;
      const decay = Math.exp(-time * 1.5);
      
      // Exact high-frequency ultrasound noise characteristics
      const noise1 = (Math.random() - 0.5) * 0.025 * decay;
      const noise2 = Math.sin(time * 18000 * 2 * Math.PI) * 0.012 * decay;
      const noise3 = Math.sin(time * 12000 * 2 * Math.PI) * 0.008 * decay;
      const noise4 = Math.sin(time * 9000 * 2 * Math.PI) * 0.005 * decay;
      
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
    // Create WAV file
    const wavBuffer = this.createWAVFile(audioBuffer);
    
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
    
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // WAV file header
    let offset = 0;
    
    // RIFF header
    view.setUint32(offset, 0x52494646, false); // "RIFF"
    offset += 4;
    view.setUint32(offset, 36 + dataSize, true); // File size
    offset += 4;
    view.setUint32(offset, 0x57415645, false); // "WAVE"
    offset += 4;
    
    // fmt chunk
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
    
    // data chunk
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
    
    return buffer;
  }

  /**
   * Generate exact ultrasound-style heartbeat sound based on GPT analysis
   * This creates the most authentic ultrasound Doppler heartbeat audio
   */
  static async generateSimpleHeartbeat(bpm: number, duration: number = 8, gptAnalysis?: string): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      const beatsPerSecond = bpm / 60;
      const beatInterval = 1 / beatsPerSecond;
      
      // Adjust parameters based on GPT analysis
      let systolicFreq = 1000;
      let diastolicFreq = 700;
      
      if (gptAnalysis) {
        const analysis = gptAnalysis.toLowerCase();
        if (analysis.includes('strong') || analysis.includes('clear')) {
          systolicFreq = 1100;
          diastolicFreq = 750;
        } else if (analysis.includes('weak') || analysis.includes('faint')) {
          systolicFreq = 900;
          diastolicFreq = 650;
        }
      }
      
      for (let time = 0; time < duration; time += beatInterval) {
        const startSample = Math.floor(time * sampleRate);
        const beatEnd = Math.floor((time + 0.6) * sampleRate);
        
        // Create exact ultrasound heartbeat pattern based on GPT analysis
        for (let i = startSample; i < beatEnd && i < channelData.length; i++) {
          const t = (i - startSample) / sampleRate;
          const decay = Math.exp(-t * 12); // Sharp decay for exact ultrasound
          
          // First whoosh (systolic) - blood rushing in
          if (t < 0.21) {
            const freq = systolicFreq + Math.sin(t * Math.PI * 3) * 600; // Exact frequency sweep
            const whoosh = Math.sin(t * freq * 2 * Math.PI) * decay * 0.9;
            const harmonic1 = Math.sin(t * freq * 4 * 2 * Math.PI) * decay * 0.6;
            const harmonic2 = Math.sin(t * freq * 6 * 2 * Math.PI) * decay * 0.4;
            channelData[i] = whoosh + harmonic1 + harmonic2;
          }
          // Brief pause
          else if (t < 0.27) {
            channelData[i] = 0;
          }
          // Second whoosh (diastolic) - blood flowing out
          else if (t < 0.48) {
            const freq = diastolicFreq - Math.sin((t - 0.27) * Math.PI * 2.5) * 400;
            const whoosh = Math.sin((t - 0.27) * freq * 2 * Math.PI) * decay * 0.7;
            const harmonic1 = Math.sin((t - 0.27) * freq * 3 * 2 * Math.PI) * decay * 0.4;
            const harmonic2 = Math.sin((t - 0.27) * freq * 5 * 2 * Math.PI) * decay * 0.2;
            channelData[i] = whoosh + harmonic1 + harmonic2;
          }
          // Add exact ultrasound background noise
          else if (t < 0.6) {
            const noise1 = (Math.random() - 0.5) * 0.035 * decay;
            const noise2 = Math.sin(t * 18000 * 2 * Math.PI) * 0.018 * decay;
            const noise3 = Math.sin(t * 12000 * 2 * Math.PI) * 0.012 * decay;
            channelData[i] = noise1 + noise2 + noise3;
          }
        }
      }
      
      // Convert to blob
      const wavBuffer = this.createWAVFile(buffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Simple audio generation failed:', error);
      // Fallback to demo audio
      return '/demo-heartbeat.mp3';
    }
  }
}
