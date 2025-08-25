// Waveform Extractor for Ultrasound Images
// Uses computer vision techniques to extract heartbeat waveforms from ultrasound images
// Provides fallback handling when no usable waveform is found

export interface WaveformData {
  beatTimes: number[]; // Beat onset times in seconds
  amplitudes: number[]; // Relative amplitudes (0-1)
  doublePulseOffsets: (number | null)[]; // Double pulse delays in ms, null if single pulse
  confidence: number; // Confidence in waveform extraction (0-1)
  hasWaveform: boolean; // Whether a usable waveform was found
  extractedPoints: WaveformPoint[]; // Raw extracted waveform points
}

export interface WaveformPoint {
  time: number; // Time in seconds
  amplitude: number; // Amplitude value
  isPeak: boolean; // Whether this point is a detected peak
}

export interface ImageAnalysisResult {
  waveformData: WaveformData;
  bpm: number;
  confidence: number;
  analysis: string;
}

export class WaveformExtractor {
  private static readonly MIN_PEAK_DISTANCE = 0.3; // Minimum distance between peaks in seconds
  private static readonly PEAK_THRESHOLD = 0.6; // Threshold for peak detection
  private static readonly WAVEFORM_REGION_PADDING = 0.1; // Padding around waveform region

  /**
   * Extract waveform data from ultrasound image using computer vision
   */
  static async extractWaveform(imageFile: File): Promise<ImageAnalysisResult> {
    console.log('🔍 Starting waveform extraction from ultrasound image');

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.warn('🔍 Not in browser environment, using fallback');
        return this.getFallbackResult();
      }

      // Create canvas for image analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('🔍 Canvas context not available, using fallback');
        return this.getFallbackResult();
      }

      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            console.log('🔍 Image loaded, dimensions:', img.width, 'x', img.height);
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Analyze image for waveform patterns
            const waveformData = this.analyzeImageForWaveform(canvas, ctx);
            
            // Calculate BPM from extracted waveform
            const bpm = this.calculateBPMFromWaveform(waveformData);
            
            // Generate analysis result
            const result: ImageAnalysisResult = {
              waveformData,
              bpm,
              confidence: waveformData.confidence,
              analysis: this.generateAnalysisText(waveformData, bpm)
            };

            console.log('🔍 Waveform extraction completed:', result);
            resolve(result);
          } catch (error) {
            console.error('🔍 Error during waveform analysis:', error);
            resolve(this.getFallbackResult());
          }
        };

        img.onerror = () => {
          console.error('🔍 Failed to load image');
          resolve(this.getFallbackResult());
        };

        img.src = URL.createObjectURL(imageFile);
      });
    } catch (error) {
      console.error('🔍 Waveform extraction failed:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * Analyze image for waveform patterns using computer vision techniques
   */
  private static analyzeImageForWaveform(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): WaveformData {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      console.log('🔍 Analyzing image data:', width, 'x', height);

      // Detect waveform region using edge detection and pattern recognition
      const waveformRegion = this.detectWaveformRegion(data, width, height);
      
      if (!waveformRegion) {
        console.log('🔍 No waveform region detected, using fallback');
        return this.generateFallbackWaveform();
      }

      // Extract waveform points from the detected region
      const extractedPoints = this.extractWaveformPoints(data, width, height, waveformRegion);
      
      // Detect peaks in the waveform
      const peaks = this.detectPeaks(extractedPoints);
      
      // Calculate beat times and amplitudes
      const beatTimes = peaks.map(peak => peak.time);
      const amplitudes = peaks.map(peak => peak.amplitude);
      
      // Detect double pulse patterns
      const doublePulseOffsets = this.detectDoublePulsePatterns(peaks);
      
      // Calculate confidence based on peak detection quality
      const confidence = this.calculateWaveformConfidence(peaks, extractedPoints);
      
      return {
        beatTimes,
        amplitudes,
        doublePulseOffsets,
        confidence,
        hasWaveform: peaks.length > 0,
        extractedPoints
      };
    } catch (error) {
      console.error('🔍 Error in image analysis:', error);
      return this.generateFallbackWaveform();
    }
  }

  /**
   * Detect waveform region in the image
   */
  private static detectWaveformRegion(data: Uint8ClampedArray, width: number, height: number): { x: number; y: number; w: number; h: number } | null {
    try {
      // Simple edge detection to find potential waveform regions
      const edgeMap = this.createEdgeMap(data, width, height);
      
      // Find high-density regions that might contain waveforms
      const regions = this.findHighDensityRegions(edgeMap, width, height);
      
      if (regions.length === 0) {
        return null;
      }
      
      // Return the largest region
      return regions.reduce((largest, current) => 
        (current.w * current.h) > (largest.w * largest.h) ? current : largest
      );
    } catch (error) {
      console.error('🔍 Error detecting waveform region:', error);
      return null;
    }
  }

  /**
   * Create edge map from image data
   */
  private static createEdgeMap(data: Uint8ClampedArray, width: number, height: number): number[] {
    const edgeMap = new Array(width * height).fill(0);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const current = data[idx * 4]; // Grayscale value
        
        // Simple Sobel edge detection
        const left = data[(y * width + (x - 1)) * 4];
        const right = data[(y * width + (x + 1)) * 4];
        const top = data[((y - 1) * width + x) * 4];
        const bottom = data[((y + 1) * width + x) * 4];
        
        const dx = right - left;
        const dy = bottom - top;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        edgeMap[idx] = magnitude;
      }
    }
    
    return edgeMap;
  }

  /**
   * Find high-density regions in edge map
   */
  private static findHighDensityRegions(edgeMap: number[], width: number, height: number): { x: number; y: number; w: number; h: number }[] {
    const regions: { x: number; y: number; w: number; h: number }[] = [];
    const threshold = Math.max(...edgeMap) * 0.3;
    
    // Simple region detection
    for (let y = 0; y < height; y += 20) {
      for (let x = 0; x < width; x += 20) {
        const density = this.calculateEdgeDensity(edgeMap, width, x, y, 50, 50);
        if (density > threshold) {
          regions.push({ x, y, w: 50, h: 50 });
        }
      }
    }
    
    return regions;
  }

  /**
   * Calculate edge density in a region
   */
  private static calculateEdgeDensity(edgeMap: number[], width: number, x: number, y: number, w: number, h: number): number {
    let total = 0;
    let count = 0;
    
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = (y + dy) * width + (x + dx);
        if (idx < edgeMap.length) {
          total += edgeMap[idx];
          count++;
        }
      }
    }
    
    return count > 0 ? total / count : 0;
  }

  /**
   * Extract waveform points from detected region
   */
  private static extractWaveformPoints(data: Uint8ClampedArray, width: number, height: number, region: { x: number; y: number; w: number; h: number }): WaveformPoint[] {
    const points: WaveformPoint[] = [];
    
    try {
      // Extract vertical line profiles from the region
      for (let x = 0; x < region.w; x += 2) {
        let totalAmplitude = 0;
        let maxAmplitude = 0;
        
        for (let y = 0; y < region.h; y++) {
          const idx = ((region.y + y) * width + (region.x + x)) * 4;
          const amplitude = data[idx]; // Grayscale value
          totalAmplitude += amplitude;
          maxAmplitude = Math.max(maxAmplitude, amplitude);
        }
        
        const avgAmplitude = totalAmplitude / region.h;
        const normalizedAmplitude = avgAmplitude / 255;
        
        // Convert x position to time (assuming 8-second duration)
        const time = (x / region.w) * 8.0;
        
        points.push({
          time,
          amplitude: normalizedAmplitude,
          isPeak: false
        });
      }
    } catch (error) {
      console.error('🔍 Error extracting waveform points:', error);
    }
    
    return points;
  }

  /**
   * Detect peaks in waveform points
   */
  private static detectPeaks(points: WaveformPoint[]): WaveformPoint[] {
    const peaks: WaveformPoint[] = [];
    
    try {
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i];
        const prev = points[i - 1];
        const next = points[i + 1];
        
        // Check if current point is a peak
        if (current.amplitude > prev.amplitude && 
            current.amplitude > next.amplitude && 
            current.amplitude > this.PEAK_THRESHOLD) {
          
          // Check minimum distance from last peak
          if (peaks.length === 0 || 
              (current.time - peaks[peaks.length - 1].time) > this.MIN_PEAK_DISTANCE) {
            peaks.push({ ...current, isPeak: true });
          }
        }
      }
    } catch (error) {
      console.error('🔍 Error detecting peaks:', error);
    }
    
    return peaks;
  }

  /**
   * Detect double pulse patterns
   */
  private static detectDoublePulsePatterns(peaks: WaveformPoint[]): (number | null)[] {
    const doublePulseOffsets: (number | null)[] = [];
    
    try {
      for (let i = 0; i < peaks.length; i++) {
        // Look for a second peak within 40-70ms of the current peak
        let hasDoublePulse = false;
        
        for (let j = i + 1; j < peaks.length; j++) {
          const timeDiff = peaks[j].time - peaks[i].time;
          if (timeDiff >= 0.04 && timeDiff <= 0.07) { // 40-70ms
            doublePulseOffsets.push(timeDiff * 1000); // Convert to ms
            hasDoublePulse = true;
            break;
          }
        }
        
        if (!hasDoublePulse) {
          doublePulseOffsets.push(null);
        }
      }
    } catch (error) {
      console.error('🔍 Error detecting double pulse patterns:', error);
      // Fill with nulls if detection fails
      for (let i = 0; i < peaks.length; i++) {
        doublePulseOffsets.push(null);
      }
    }
    
    return doublePulseOffsets;
  }

  /**
   * Calculate confidence in waveform extraction
   */
  private static calculateWaveformConfidence(peaks: WaveformPoint[], allPoints: WaveformPoint[]): number {
    try {
      if (peaks.length === 0) return 0.0;
      
      // Calculate signal-to-noise ratio
      const peakAmplitudes = peaks.map(p => p.amplitude);
      const avgPeakAmplitude = peakAmplitudes.reduce((a, b) => a + b, 0) / peakAmplitudes.length;
      
      const allAmplitudes = allPoints.map(p => p.amplitude);
      const avgAmplitude = allAmplitudes.reduce((a, b) => a + b, 0) / allAmplitudes.length;
      
      const snr = avgPeakAmplitude / (avgAmplitude + 0.01); // Add small value to avoid division by zero
      
      // Calculate regularity of peaks
      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i].time - peaks[i - 1].time);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const regularity = Math.max(0, 1 - intervalVariance / avgInterval);
      
      // Combine factors
      const confidence = Math.min(1.0, (snr * 0.6 + regularity * 0.4) * 0.8);
      
      return confidence;
    } catch (error) {
      console.error('🔍 Error calculating confidence:', error);
      return 0.3; // Default low confidence
    }
  }

  /**
   * Calculate BPM from waveform data
   */
  private static calculateBPMFromWaveform(waveformData: WaveformData): number {
    try {
      if (waveformData.beatTimes.length < 2) {
        return 140; // Default BPM
      }
      
      // Calculate average interval between beats
      const intervals = [];
      for (let i = 1; i < waveformData.beatTimes.length; i++) {
        intervals.push(waveformData.beatTimes[i] - waveformData.beatTimes[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60 / avgInterval;
      
      // Clamp to reasonable fetal heart rate range
      return Math.max(100, Math.min(200, Math.round(bpm)));
    } catch (error) {
      console.error('🔍 Error calculating BPM:', error);
      return 140; // Default BPM
    }
  }

  /**
   * Generate fallback waveform when extraction fails
   */
  private static generateFallbackWaveform(): WaveformData {
    return {
      beatTimes: [],
      amplitudes: [],
      doublePulseOffsets: [],
      confidence: 0.0,
      hasWaveform: false,
      extractedPoints: []
    };
  }

  /**
   * Generate analysis text
   */
  private static generateAnalysisText(waveformData: WaveformData, bpm: number): string {
    if (waveformData.hasWaveform) {
      return `Waveform extracted with ${Math.round(waveformData.confidence * 100)}% confidence. Detected ${waveformData.beatTimes.length} beats at ${bpm} BPM.`;
    } else {
      return 'No waveform detected in image. Using fallback pattern.';
    }
  }

  /**
   * Get fallback result when extraction fails
   */
  private static getFallbackResult(): ImageAnalysisResult {
    return {
      waveformData: this.generateFallbackWaveform(),
      bpm: 140,
      confidence: 0.0,
      analysis: 'Waveform extraction failed - using fallback analysis'
    };
  }
}
