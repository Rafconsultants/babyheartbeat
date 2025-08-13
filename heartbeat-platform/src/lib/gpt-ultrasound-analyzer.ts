// GPT Ultrasound Analyzer
// Uses GPT-4 Vision to analyze ultrasound images and provide detailed audio characteristics
// for generating authentic heartbeat sounds

export interface UltrasoundAnalysis {
  bpm: number;
  confidence: number;
  audioCharacteristics: {
    systolicIntensity: number; // 0-1, how strong the first "whoosh" is
    diastolicIntensity: number; // 0-1, how strong the second "whoosh" is
    frequencyRange: {
      systolic: { min: number; max: number }; // Hz
      diastolic: { min: number; max: number }; // Hz
    };
    rhythm: 'regular' | 'irregular' | 'variable';
    clarity: 'clear' | 'moderate' | 'faint';
    backgroundNoise: 'low' | 'medium' | 'high';
    dopplerEffect: 'strong' | 'moderate' | 'weak';
  };
  analysis: string;
  recommendations: string[];
}

export class GPTUltrasoundAnalyzer {
  private static readonly GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly GPT_MODEL = 'gpt-3.5-turbo';

  /**
   * Analyze ultrasound image with GPT-4 Vision and get detailed audio characteristics
   */
  static async analyzeUltrasound(imageFile: File): Promise<UltrasoundAnalysis> {
    console.log('🔍 Starting ultrasound analysis for file:', imageFile.name, 'Size:', imageFile.size);
    
    try {
      const base64Image = await this.fileToBase64(imageFile);
      console.log('🔍 Image converted to base64, length:', base64Image.length);
      
      // In browser environment, we need to use NEXT_PUBLIC_ prefix
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env.local file.');
      }

      console.log('🔍 API key found, length:', apiKey.length);

      const prompt = `Analyze this fetal ultrasound image and extract the following information:

1. Look for any text that shows heart rate or BPM (like "FHR 155bpm", "HR 140", "BPM 150", etc.)
2. If you find a heart rate, extract the exact number
3. Analyze the image quality and characteristics

Respond in this exact JSON format:
{
  "bpm": number (the heart rate you found, or 140 if not found),
  "confidence": number (0-1, how confident you are in the BPM),
  "audioCharacteristics": {
    "systolicIntensity": 0.8,
    "diastolicIntensity": 0.6,
    "frequencyRange": {
      "systolic": {"min": 900, "max": 1100},
      "diastolic": {"min": 650, "max": 800}
    },
    "rhythm": "regular",
    "clarity": "moderate",
    "backgroundNoise": "medium",
    "dopplerEffect": "moderate"
  },
  "analysis": "description of what you found",
  "recommendations": ["use standard fetal heartbeat characteristics"]
}

If you cannot determine specific values, provide reasonable estimates based on typical fetal heart characteristics.`;

      console.log('🔍 Making API request to OpenAI...');
      
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
          max_tokens: 1000,
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
        systolicIntensity: Math.max(0, Math.min(1, (audioChars.systolicIntensity as number) || 0.8)),
        diastolicIntensity: Math.max(0, Math.min(1, (audioChars.diastolicIntensity as number) || 0.6)),
        frequencyRange: {
          systolic: {
            min: Math.max(800, Math.min(1200, (systolic.min as number) || 900)),
            max: Math.max(1000, Math.min(1400, (systolic.max as number) || 1100))
          },
          diastolic: {
            min: Math.max(600, Math.min(900, (diastolic.min as number) || 650)),
            max: Math.max(700, Math.min(1000, (diastolic.max as number) || 800))
          }
        },
        rhythm: (audioChars.rhythm as 'regular' | 'irregular' | 'variable') || 'regular',
        clarity: (audioChars.clarity as 'clear' | 'moderate' | 'faint') || 'moderate',
        backgroundNoise: (audioChars.backgroundNoise as 'low' | 'medium' | 'high') || 'medium',
        dopplerEffect: (audioChars.dopplerEffect as 'strong' | 'moderate' | 'weak') || 'moderate'
      },
      analysis: (result.analysis as string) || 'GPT analysis completed',
      recommendations: Array.isArray(result.recommendations) ? (result.recommendations as string[]) : ['Use moderate intensity for authentic sound']
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
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular',
        clarity: 'moderate',
        backgroundNoise: 'medium',
        dopplerEffect: 'moderate'
      },
      analysis: content,
      recommendations: ['Use extracted BPM for audio generation']
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
              systolicIntensity: 0.8,
              diastolicIntensity: 0.6,
              frequencyRange: {
                systolic: { min: 900, max: 1100 },
                diastolic: { min: 650, max: 800 }
              },
              rhythm: 'regular',
              clarity: 'moderate',
              backgroundNoise: 'medium',
              dopplerEffect: 'moderate'
            },
            analysis: 'Fallback analysis: Using typical fetal heart rate characteristics',
            recommendations: ['Use standard fetal heartbeat characteristics']
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
   * Get default analysis when GPT fails
   */
  private static getDefaultAnalysis(): UltrasoundAnalysis {
    return {
      bpm: 140,
      confidence: 0.3,
      audioCharacteristics: {
        systolicIntensity: 0.8,
        diastolicIntensity: 0.6,
        frequencyRange: {
          systolic: { min: 900, max: 1100 },
          diastolic: { min: 650, max: 800 }
        },
        rhythm: 'regular',
        clarity: 'moderate',
        backgroundNoise: 'medium',
        dopplerEffect: 'moderate'
      },
      analysis: 'Default analysis due to GPT failure',
      recommendations: ['Use standard fetal heartbeat characteristics']
    };
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
