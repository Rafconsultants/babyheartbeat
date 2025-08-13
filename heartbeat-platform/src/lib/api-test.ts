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
    
    // Test API connectivity with a simple text request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
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

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API Error Response:', errorData);
      throw new Error(`API test failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API test successful:', data.choices[0]?.message?.content);
    return true;
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error);
    return false;
  }
}
