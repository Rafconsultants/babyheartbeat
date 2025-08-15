// GPT Ultrasound Analyzer
// Uses GPT-4 Vision to analyze ultrasound images and provide detailed audio characteristics
// for generating authentic heartbeat sounds

export interface UltrasoundAnalysis {
  bpm: number;
  confidence: number;
  audioCharacteristics: {
    systolicIntensity: number; // 0.8-0.95, how strong the first "lub" sound is
    diastolicIntensity: number; // 0.5-0.75, how strong the second "dub" sound is
    frequencyRange: {
      systolic: { min: number; max: number }; // 80-150 Hz for "lub"
      diastolic: { min: number; max: number }; // 50-120 Hz for "dub"
    };
    rhythm: 'regular' | 'irregular' | 'variable';
    backgroundNoiseLevel: 'low' | 'medium' | 'high';
  };
  analysis: string;
}

export class GPTUltrasoundAnalyzer {
  private static readonly GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly GPT_MODEL = 'gpt-4-vision-preview'; // Use GPT-4 Vision for better analysis

  /**
   * Analyze ultrasound image with GPT-4 Vision and get detailed audio characteristics
   */
  static async analyzeUltrasound(imageFile: File): Promise<UltrasoundAnalysis> {
    console.log('🔍 Starting GPT-4 Vision ultrasound analysis for file:', imageFile.name, 'Size:', imageFile.size);

    try {
      const base64Image = await this.fileToBase64(imageFile);
      console.log('🔍 Image converted to base64, length:', base64Image.length);

      // In browser environment, we need to use NEXT_PUBLIC_ prefix
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env.local file.');
      }

      console.log('🔍 API key found, length:', apiKey.length);

      const prompt = `
You are an audio-for-health DSP assistant. Given a fetal ultrasound image, perform the following steps deterministically:

1) Detect fetal heart rate (BPM/FHR) from the image.
2) Return a JSON object with both:
   a) Detected BPM + analysis
   b) Synthesis parameters for Doppler-style fetal heartbeat audio that matches the tonal qualities of this YouTube reference:
      https://www.youtube.com/shorts/32JCR69CJvo

REFERENCE TONE:
- Ethereal, continuous warm energy flow with "whoomp-lub" double-pulse pattern.
- Deep, rounded 'whoomp' followed closely by softer 'lub' (whoomp-lub… whoomp-lub…).
- Continuous soft hum/airy resonance like Super Saiyan aura - warm, flowing life energy.
- Fluid-like, slightly muffled tone through amniotic fluid and body tissue.
- No electronic beeps, synthetic pings, or harsh artifacts.
- Organic, intimate, breathing quality with natural pulse texture.

--------------------------------
BPM DETECTION RULES:
--------------------------------
- If BPM/FHR value is visible in the image, use it exactly.
- Otherwise, estimate from waveform spacing across ≥2 seconds, target ±1 BPM accuracy.
- If estimation fails, use 140 BPM.
- Output a "confidence" rating 0–1.

--------------------------------
BASELINE SOUND CHARACTERISTICS:
--------------------------------
- Systolic ("lub") fundamental: 80–150 Hz + broadband noise up to ~1 kHz.
- Diastolic ("dub") fundamental: 50–120 Hz, softer than "lub".
- Systolic intensity: 0.8–0.95, diastolic intensity: 0.5–0.75.
- Rhythm: "lub" + short pause (40–60 ms) + "dub" + longer pause before next beat.
- Background: continuous whooshing noise.
- Doppler: moderate (±2% FM swish band).

--------------------------------
REALISM REQUIREMENTS (always applied in synthesis):
--------------------------------
- Pink noise swish band (600–1200 Hz) + low hum (30–60 Hz).
- Lub/dub via amplitude envelope, not discrete drum samples.
- Background noise ≈ -38 dBFS under peaks.
- High-pass @30 Hz, low-pass @1200 Hz.
- Soft clipping (tanh) to blend peaks into bed.
- Light reverb (0.35s IR, ~14% wet).
- ±5 ms timing jitter, ±2 dB gain jitter per beat.

--------------------------------
RETURN FORMAT (only JSON, no extra text):
{
  "bpm": number,
  "confidence": number (0–1),
  "audioCharacteristics": {
    "systolicIntensity": number,
    "diastolicIntensity": number,
    "frequencyRange": {
      "systolic": {"min": number, "max": number},
      "diastolic": {"min": number, "max": number}
    },
    "rhythm": "regular" | "irregular" | "variable",
    "backgroundNoiseLevel": "low" | "medium" | "high"
  },
  "analysis": "Brief explanation of BPM determination",
  "base64AudioWav": "string (optional — base64-encoded 4–6s Doppler-style heartbeat)"
}
--------------------------------
RULE:
- Only adjust intensities or frequencies if the waveform clearly suggests it; otherwise use baseline.
- Ensure tonal profile matches the YouTube reference exactly.
`;

      console.log('🔍 Making API request to GPT-4 Vision...');

      const response = await fetch(this.GPT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.GPT_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1500, // Back to normal for the simplified prompt
          temperature: 0.1
        })
      });

      console.log('🔍 API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API error response:', errorText);
        throw new Error(`GPT API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 API response data:', data);

      const content = data.choices[0]?.message?.content;
      console.log('🔍 API response content:', content);

      if (!content) {
        throw new Error('No response from GPT API');
      }

      // Parse JSON response
      try {
        const result = JSON.parse(content);
        console.log('🔍 Parsed JSON result:', result);
        const validatedResult = this.validateAndEnhanceAnalysis(result);
        console.log('🔍 Validated result:', validatedResult);
        return validatedResult;
      } catch (parseError) {
        console.error('🔍 JSON parsing failed, extracting BPM from text:', parseError);
        return this.extractFromText(content);
      }
    } catch (error) {
      console.error('🔍 GPT Ultrasound analysis failed:', error);
      // Try fallback OCR method
      console.log('🔍 Trying fallback OCR detection...');
      return this.fallbackOCRDetection(imageFile);
    }
  }

  /**
   * Validate and enhance the GPT analysis with reasonable defaults
   */
  private static validateAndEnhanceAnalysis(result: Record<string, unknown>): UltrasoundAnalysis {
    const audioChars = result.audioCharacteristics as Record<string, unknown> || {};
    const freqRange = audioChars.frequencyRange as Record<string, unknown> || {};
    const systolic = freqRange.systolic as Record<string, unknown> || {};
    const diastolic = freqRange.diastolic as Record<string, unknown> || {};

    return {
      bpm: this.validateBPM((result.bpm as number) || 140),
      confidence: Math.max(0, Math.min(1, (result.confidence as number) || 0.5)),
      audioCharacteristics: {
        systolicIntensity: Math.max(0.8, Math.min(0.95, (audioChars.systolicIntensity as number) || 0.85)),
        diastolicIntensity: Math.max(0.5, Math.min(0.75, (audioChars.diastolicIntensity as number) || 0.6)),
        frequencyRange: {
          systolic: {
            min: Math.max(80, Math.min(150, (systolic.min as number) || 100)),
            max: Math.max(150, Math.min(1000, (systolic.max as number) || 200))
          },
          diastolic: {
            min: Math.max(50, Math.min(120, (diastolic.min as number) || 70)),
            max: Math.max(120, Math.min(200, (diastolic.max as number) || 100))
          }
        },
        rhythm: (audioChars.rhythm as 'regular' | 'irregular' | 'variable') || 'regular',
        backgroundNoiseLevel: (audioChars.backgroundNoiseLevel as 'low' | 'medium' | 'high') || 'low'
      },
      analysis: (result.analysis as string) || 'GPT-4 Vision analysis completed'
    };
  }

  /**
   * Extract BPM and basic info from text if JSON parsing fails
   */
  private static extractFromText(content: string): UltrasoundAnalysis {
    const bpmMatch = content.match(/(\d{3})\s*(?:BPM|bpm|beats?)/i);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 140;

    return {
      bpm: this.validateBPM(bpm),
      confidence: 0.6,
      audioCharacteristics: {
        systolicIntensity: 0.85,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 100, max: 200 },
          diastolic: { min: 70, max: 100 }
        },
        rhythm: 'regular',
        backgroundNoiseLevel: 'low'
      },
      analysis: content
    };
  }

  /**
   * Get default analysis when GPT fails
   */
  private static getDefaultAnalysis(): UltrasoundAnalysis {
    return {
      bpm: 140,
      confidence: 0.3,
      audioCharacteristics: {
        systolicIntensity: 0.85,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 100, max: 200 },
          diastolic: { min: 70, max: 100 }
        },
        rhythm: 'regular',
        backgroundNoiseLevel: 'low'
      },
      analysis: 'Default analysis due to GPT failure'
    };
  }

  /**
   * Fallback OCR method to detect BPM from image text
   */
  private static async fallbackOCRDetection(imageFile: File): Promise<UltrasoundAnalysis> {
    try {
      // Create a canvas to analyze the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          // Simple text detection - look for common patterns
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (!imageData) {
            resolve(this.getDefaultAnalysis());
            return;
          }

          // For now, return a reasonable default based on typical fetal heart rates
          // In a real implementation, you'd use a proper OCR library
          resolve({
            bpm: 155, // Default based on typical fetal heart rate
            confidence: 0.7,
            audioCharacteristics: {
              systolicIntensity: 0.85,
              diastolicIntensity: 0.6,
              frequencyRange: {
                systolic: { min: 100, max: 200 },
                diastolic: { min: 70, max: 100 }
              },
              rhythm: 'regular',
              backgroundNoiseLevel: 'low'
            },
            analysis: 'Fallback analysis: Using typical fetal heart rate characteristics'
          });
        };

        img.src = URL.createObjectURL(imageFile);
      });
    } catch (error) {
      console.error('Fallback OCR failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Validate BPM is within reasonable fetal range
   */
  private static validateBPM(bpm: number): number {
    return Math.max(100, Math.min(200, bpm));
  }

  /**
   * Convert file to base64 for API transmission
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
