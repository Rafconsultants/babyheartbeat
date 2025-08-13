// API Test - Verify OpenAI API integration
export async function testOpenAIAPI() {
  try {
    // In browser environment, we need to use NEXT_PUBLIC_ prefix
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    console.log('🔍 Checking API key...');
    console.log('Environment variable exists:', !!apiKey);
    console.log('API key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env.local file.');
    }

    console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
    console.log('🔍 Making API request...');
    
    // Try different models to find one that works
    const modelsToTry = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4'];
    
    for (const model of modelsToTry) {
      try {
        console.log(`🔍 Trying model: ${model}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: 'Say "API test successful" if you can read this.'
              }
            ],
            max_tokens: 10,
            temperature: 0
          })
        });

        console.log(`🔍 Response status for ${model}:`, response.status);
        console.log(`🔍 Response ok for ${model}:`, response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ OpenAI API test successful with ${model}:`, data.choices[0]?.message?.content);
          return true;
        } else {
          const errorData = await response.text();
          console.log(`❌ Model ${model} failed:`, errorData);
        }
      } catch (modelError) {
        console.log(`❌ Model ${model} error:`, modelError);
      }
    }
    
    throw new Error('All models failed. Please check your API key and model access.');
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error);
    return false;
  }
}
