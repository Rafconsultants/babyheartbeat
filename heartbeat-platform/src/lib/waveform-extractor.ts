// Waveform Extractor for Ultrasound Images
// Uses computer vision techniques to extract heartbeat waveforms from ultrasound images
// Provides fallback handling when no usable waveform is found

export interface WaveformData {
  beatTimes: number[]; // Beat onset times in seconds
  amplitudes: number[]; // Relative amplitudes (0-1)
  doublePulseOffsets: number[]; // Double pulse delays in ms, null if single pulse
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
      // Create canvas for image analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          // Analyze image for waveform patterns
          const waveformData = this.analyzeImageForWaveform(canvas, ctx!);
          
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
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

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
    
    // Calculate confidence based on waveform quality
    const confidence = this.calculateWaveformConfidence(extractedPoints, peaks);

    return {
      beatTimes,
      amplitudes,
      doublePulseOffsets,
      confidence,
      hasWaveform: true,
      extractedPoints
    };
  }

  /**
   * Detect waveform region in the image using edge detection
   */
  private static detectWaveformRegion(
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ): { x: number; y: number; w: number; h: number } | null {
    // Look for horizontal lines and patterns that indicate waveform traces
    const edgeMap = this.createEdgeMap(data, width, height);
    
    // Find regions with high edge density (likely waveform areas)
    const regions = this.findHighDensityRegions(edgeMap, width, height);
    
    if (regions.length === 0) {
      return null;
    }

    // Select the best region (highest edge density with reasonable aspect ratio)
    const bestRegion = regions.reduce((best, current) => {
      const currentScore = this.calculateRegionScore(current, width, height);
      const bestScore = this.calculateRegionScore(best, width, height);
      return currentScore > bestScore ? current : best;
    });

    return bestRegion;
  }

  /**
   * Create edge map from image data using Sobel operator
   */
  private static createEdgeMap(data: Uint8ClampedArray, width: number, height: number): number[] {
    const edgeMap = new Array(width * height).fill(0);
    
    // Sobel operators for edge detection
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply Sobel operators
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeMap[y * width + x] = magnitude;
      }
    }
    
    return edgeMap;
  }

  /**
   * Find regions with high edge density
   */
  private static findHighDensityRegions(
    edgeMap: number[], 
    width: number, 
    height: number
  ): Array<{ x: number; y: number; w: number; h: number }> {
    const regions: Array<{ x: number; y: number; w: number; h: number }> = [];
    const windowSize = Math.min(width, height) / 8;
    
    for (let y = 0; y < height - windowSize; y += windowSize / 2) {
      for (let x = 0; x < width - windowSize; x += windowSize / 2) {
        const density = this.calculateEdgeDensity(edgeMap, width, x, y, windowSize, windowSize);
        
        if (density > 0.1) { // Threshold for high density
          regions.push({ x, y, w: windowSize, h: windowSize });
        }
      }
    }
    
    return regions;
  }

  /**
   * Calculate edge density in a region
   */
  private static calculateEdgeDensity(
    edgeMap: number[], 
    width: number, 
    x: number, 
    y: number, 
    w: number, 
    h: number
  ): number {
    let totalEdges = 0;
    let totalPixels = 0;
    
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = (y + dy) * width + (x + dx);
        totalEdges += edgeMap[idx];
        totalPixels++;
      }
    }
    
    return totalEdges / totalPixels;
  }

  /**
   * Calculate score for a region (higher is better)
   */
  private static calculateRegionScore(
    region: { x: number; y: number; w: number; h: number }, 
    width: number, 
    height: number
  ): number {
    const aspectRatio = region.w / region.h;
    const area = region.w * region.h;
    const normalizedArea = area / (width * height);
    
    // Prefer regions with aspect ratio close to 3:1 (typical for waveforms)
    const aspectScore = 1 - Math.abs(aspectRatio - 3) / 3;
    
    // Prefer regions with reasonable size
    const sizeScore = Math.min(normalizedArea * 100, 1);
    
    return aspectScore * 0.7 + sizeScore * 0.3;
  }

  /**
   * Extract waveform points from detected region
   */
  private static extractWaveformPoints(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    region: { x: number; y: number; w: number; h: number }
  ): WaveformPoint[] {
    const points: WaveformPoint[] = [];
    const timeStep = 8.0 / region.w; // 8 seconds divided by width
    
    for (let x = 0; x < region.w; x++) {
      let maxAmplitude = 0;
      let maxY = region.y;
      
      // Find the maximum amplitude (darkest point) in each vertical column
      for (let y = region.y; y < region.y + region.h; y++) {
        const idx = (y * width + (region.x + x)) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const amplitude = 1 - (gray / 255); // Invert so dark = high amplitude
        
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude;
          maxY = y;
        }
      }
      
      // Normalize amplitude to 0-1 range
      const normalizedAmplitude = Math.max(0, Math.min(1, maxAmplitude));
      
      points.push({
        time: x * timeStep,
        amplitude: normalizedAmplitude,
        isPeak: false // Will be set by peak detection
      });
    }
    
    return points;
  }

  /**
   * Detect peaks in the waveform
   */
  private static detectPeaks(points: WaveformPoint[]): WaveformPoint[] {
    const peaks: WaveformPoint[] = [];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      // Check if current point is a peak
      if (current.amplitude > this.PEAK_THRESHOLD && 
          current.amplitude > prev.amplitude && 
          current.amplitude > next.amplitude) {
        
        // Check minimum distance from previous peak
        if (peaks.length === 0 || 
            current.time - peaks[peaks.length - 1].time >= this.MIN_PEAK_DISTANCE) {
          
          current.isPeak = true;
          peaks.push(current);
        }
      }
    }
    
    return peaks;
  }

  /**
   * Detect double pulse patterns in the waveform
   */
  private static detectDoublePulsePatterns(peaks: WaveformPoint[]): number[] {
    const doublePulseOffsets: number[] = [];
    
    for (let i = 0; i < peaks.length; i++) {
      const currentPeak = peaks[i];
      
      // Look for a second peak within 40-70ms of the current peak
      for (let j = i + 1; j < peaks.length; j++) {
        const nextPeak = peaks[j];
        const timeDiff = (nextPeak.time - currentPeak.time) * 1000; // Convert to ms
        
        if (timeDiff >= 40 && timeDiff <= 70) {
          // Found a double pulse pattern
          doublePulseOffsets.push(timeDiff);
          break;
        } else if (timeDiff > 70) {
          // Too far, no double pulse for this beat
          doublePulseOffsets.push(null);
          break;
        }
      }
      
      // If no second peak found, it's a single pulse
      if (i === peaks.length - 1 || 
          (i < peaks.length - 1 && (peaks[i + 1].time - currentPeak.time) * 1000 > 70)) {
        doublePulseOffsets.push(null);
      }
    }
    
    return doublePulseOffsets;
  }

  /**
   * Calculate confidence in waveform extraction
   */
  private static calculateWaveformConfidence(points: WaveformPoint[], peaks: WaveformPoint[]): number {
    if (peaks.length === 0) return 0;
    
    // Calculate signal-to-noise ratio
    const signalAmplitude = peaks.reduce((sum, peak) => sum + peak.amplitude, 0) / peaks.length;
    const noiseAmplitude = points.reduce((sum, point) => sum + point.amplitude, 0) / points.length;
    const snr = signalAmplitude / (noiseAmplitude + 0.001);
    
    // Calculate peak consistency
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i].time - peaks[i - 1].time);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const consistency = Math.max(0, 1 - intervalVariance / (avgInterval * avgInterval));
    
    // Combine factors
    const confidence = (snr * 0.6 + consistency * 0.4) * Math.min(peaks.length / 10, 1);
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate BPM from extracted waveform
   */
  private static calculateBPMFromWaveform(waveformData: WaveformData): number {
    if (waveformData.beatTimes.length < 2) {
      return 140; // Default BPM
    }
    
    // Calculate average interval between beats
    const intervals = [];
    for (let i = 1; i < waveformData.beatTimes.length; i++) {
      intervals.push(waveformData.beatTimes[i] - waveformData.beatTimes[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    
    // Clamp to reasonable fetal heart rate range
    return Math.max(100, Math.min(200, bpm));
  }

  /**
   * Generate fallback waveform when no usable waveform is found
   */
  private static generateFallbackWaveform(): WaveformData {
    const bpm = 140;
    const beatInterval = 60 / bpm;
    const startTime = 0.12;
    const beatTimes: number[] = [];
    const amplitudes: number[] = [];
    const doublePulseOffsets: number[] = [];
    
    for (let time = startTime; time < 8.0; time += beatInterval) {
      beatTimes.push(Number(time.toFixed(3)));
      amplitudes.push(0.8 + (Math.random() - 0.5) * 0.1); // 0.75-0.85 with variation
      doublePulseOffsets.push(null); // No double pulse in fallback
    }
    
    return {
      beatTimes,
      amplitudes,
      doublePulseOffsets,
      confidence: 0.3,
      hasWaveform: false,
      extractedPoints: []
    };
  }

  /**
   * Generate analysis text for the extracted waveform
   */
  private static generateAnalysisText(waveformData: WaveformData, bpm: number): string {
    if (!waveformData.hasWaveform) {
      return `No usable heartbeat waveform detected in the ultrasound image. Using fallback pattern with ${Math.round(bpm)} BPM.`;
    }
    
    const beatCount = waveformData.beatTimes.length;
    const hasDoublePulse = waveformData.doublePulseOffsets.some(offset => offset !== null);
    
    return `Extracted ${beatCount} heartbeat peaks from ultrasound waveform. BPM: ${Math.round(bpm)}. ${hasDoublePulse ? 'Double-pulse pattern detected.' : 'Single-pulse pattern detected.'} Confidence: ${Math.round(waveformData.confidence * 100)}%.`;
  }

  /**
   * Get fallback result when extraction fails
   */
  private static getFallbackResult(): ImageAnalysisResult {
    const waveformData = this.generateFallbackWaveform();
    
    return {
      waveformData,
      bpm: 140,
      confidence: 0.3,
      analysis: 'Waveform extraction failed. Using fallback pattern.'
    };
  }
}
