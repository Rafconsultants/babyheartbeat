// Reference Audio Loader
// Utility for loading and preparing reference audio files for Doppler analysis

export interface ReferenceAudioInfo {
  audioBuffer: AudioBuffer;
  sampleRate: number;
  duration: number;
  channels: number;
  isValid: boolean;
  errorMessage?: string;
}

export class ReferenceAudioLoader {
  private static audioContext: AudioContext | null = null;

  /**
   * Load reference audio from a file
   */
  static async loadReferenceAudio(file: File): Promise<ReferenceAudioInfo> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      console.log('🎵 Loading reference audio file:', file.name, 'Size:', file.size, 'bytes');

      // Validate file type
      if (!this.isValidAudioFile(file)) {
        return {
          audioBuffer: null as any,
          sampleRate: 0,
          duration: 0,
          channels: 0,
          isValid: false,
          errorMessage: 'Invalid audio file format. Please use WAV, MP3, or OGG files.'
        };
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log('🎵 Reference audio loaded successfully:', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });

      // Validate duration (should be at least 10 seconds for 2s-10s analysis)
      if (audioBuffer.duration < 10) {
        return {
          audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          duration: audioBuffer.duration,
          channels: audioBuffer.numberOfChannels,
          isValid: false,
          errorMessage: 'Reference audio must be at least 10 seconds long for proper analysis.'
        };
      }

      return {
        audioBuffer,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        isValid: true
      };

    } catch (error) {
      console.error('❌ Failed to load reference audio:', error);
      return {
        audioBuffer: null as any,
        sampleRate: 0,
        duration: 0,
        channels: 0,
        isValid: false,
        errorMessage: `Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract the 2s-10s segment from reference audio
   */
  static extractAnalysisSegment(audioBuffer: AudioBuffer): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(2 * sampleRate);
    const endSample = Math.floor(10 * sampleRate);
    const segmentLength = endSample - startSample;

    console.log('🎵 Extracting 2s-10s analysis segment:', {
      startSample,
      endSample,
      segmentLength,
      duration: segmentLength / sampleRate
    });

    // Create new buffer for the segment
    const segmentBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      sampleRate
    );

    // Copy the segment data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        targetData[i] = sourceData[startSample + i];
      }
    }

    return segmentBuffer;
  }

  /**
   * Validate if the file is a supported audio format
   */
  private static isValidAudioFile(file: File): boolean {
    const validTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/mpeg',
      'audio/x-wav',
      'audio/x-m4a'
    ];

    return validTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.wav') ||
           file.name.toLowerCase().endsWith('.mp3') ||
           file.name.toLowerCase().endsWith('.ogg') ||
           file.name.toLowerCase().endsWith('.m4a');
  }

  /**
   * Get audio file information without loading the full buffer
   */
  static async getAudioFileInfo(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    isValid: boolean;
    estimatedDuration?: number;
  }> {
    const isValid = this.isValidAudioFile(file);
    
    // Estimate duration based on file size and type
    let estimatedDuration: number | undefined;
    if (isValid) {
      // Rough estimation: assume 128kbps for MP3, 1411kbps for WAV
      const isMP3 = file.type === 'audio/mp3' || file.name.toLowerCase().endsWith('.mp3');
      const bitrate = isMP3 ? 128000 : 1411000; // bits per second
      estimatedDuration = (file.size * 8) / bitrate; // Convert bytes to bits, then to seconds
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      isValid,
      estimatedDuration
    };
  }

  /**
   * Create a test reference audio buffer for development/testing
   */
  static createTestReferenceAudio(sampleRate: number = 44100): AudioBuffer {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const duration = 12; // 12 seconds total
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate a simple test pattern with beats at ~140 BPM
    const beatInterval = 60 / 140; // seconds between beats
    const beatSamples = Math.floor(beatInterval * sampleRate);

    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      
      // Add some background noise
      channelData[i] = (Math.random() - 0.5) * 0.1;
      
      // Add beats
      const beatPhase = (time % beatInterval) / beatInterval;
      if (beatPhase < 0.1) { // 10% of beat interval
        const beatEnvelope = Math.sin(beatPhase * Math.PI * 10) * 0.8;
        channelData[i] += beatEnvelope;
      }
    }

    console.log('🎵 Created test reference audio:', {
      sampleRate,
      duration,
      length: channelData.length
    });

    return buffer;
  }

  /**
   * Analyze reference audio characteristics for debugging
   */
  static analyzeReferenceAudioCharacteristics(audioBuffer: AudioBuffer): {
    rms: number;
    peak: number;
    dynamicRange: number;
    zeroCrossings: number;
    spectralCentroid: number;
  } {
    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length;

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / length);

    // Calculate peak
    let peak = 0;
    for (let i = 0; i < length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }

    // Calculate dynamic range (simplified)
    const dynamicRange = peak / (rms + 1e-10);

    // Calculate zero crossings
    let zeroCrossings = 0;
    for (let i = 1; i < length; i++) {
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }

    // Calculate spectral centroid (simplified)
    let spectralCentroid = 0;
    const fftSize = 1024;
    for (let i = 0; i < Math.min(length, fftSize); i++) {
      spectralCentroid += Math.abs(channelData[i]) * (i / fftSize);
    }
    spectralCentroid /= Math.min(length, fftSize);

    return {
      rms,
      peak,
      dynamicRange,
      zeroCrossings,
      spectralCentroid
    };
  }
}
