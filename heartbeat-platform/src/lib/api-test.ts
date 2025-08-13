// API Test - Verify OpenAI API integration
export async function testOpenAIAPI() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
    
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

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API test successful:', data.choices[0]?.message?.content);
    return true;
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error);
    return false;
  }
}
