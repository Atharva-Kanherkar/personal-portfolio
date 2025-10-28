import { NextRequest, NextResponse } from 'next/server';
import Perplexity from '@perplexity-ai/perplexity_ai';
import { SYSTEM_PROMPT } from './prompt';
type AIProvider = 'perplexity' | 'gemini';

 
// Helper function to call Perplexity API using official SDK
async function callPerplexityAPI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ success: boolean; response?: string; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log('[Perplexity] API key not configured, skipping');
    return { success: false, error: 'No API key' };
  }

  try {
    console.log('[Perplexity] Attempting to call API using official SDK...');

    const client = new Perplexity({
      apiKey: apiKey,
    });

    // Build messages array - Perplexity SDK uses OpenAI-compatible format
    const messages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      },
      // Add conversation history
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Add current message
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Use Sonar model for web-grounded responses
    const completion = await client.chat.completions.create({
      messages,
      model: 'sonar', // Standard Sonar model with web search
      temperature: 0.8,
      max_tokens: 1024,
      top_p: 0.95,
      // Enable web search features
      search_recency_filter: 'month', // Focus on recent information
      return_related_questions: false, // Don't need related questions
    });

    const aiResponse = completion.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('[Perplexity] No response in data:', completion);
      return { success: false, error: 'No response content' };
    }

    // Handle response - it could be a string or array of content chunks
    const responseText = typeof aiResponse === 'string'
      ? aiResponse
      : Array.isArray(aiResponse)
        ? aiResponse.map((chunk: any) => chunk.text || '').join('')
        : '';

    if (!responseText) {
      console.error('[Perplexity] No text in response:', aiResponse);
      return { success: false, error: 'No text content' };
    }

    console.log('[Perplexity] Success! Response received');
    return { success: true, response: responseText };

  } catch (error) {
    // Handle SDK-specific errors
    if (error instanceof Perplexity.BadRequestError) {
      console.error('[Perplexity] Bad request:', error.message);
      return { success: false, error: `Invalid request: ${error.message}` };
    } else if (error instanceof Perplexity.RateLimitError) {
      console.error('[Perplexity] Rate limit exceeded');
      return { success: false, error: 'Rate limit exceeded' };
    } else if (error instanceof Perplexity.APIError) {
      console.error('[Perplexity] API error:', error.status, error.message);
      return { success: false, error: `API error ${error.status}` };
    } else {
      console.error('[Perplexity] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Helper function to call Gemini API (fallback)
async function callGeminiAPI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ success: boolean; response?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Gemini] API key not configured, skipping');
    return { success: false, error: 'No API key' };
  }

  try {
    console.log('[Gemini] Attempting to call API...');

    // Build messages array for Gemini
    const messages = [
      // Add conversation history
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      // Add current message
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error:', errorText);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('[Gemini] No response in data:', data);
      return { success: false, error: 'No response content' };
    }

    console.log('[Gemini] Success! Response received');
    return { success: true, response: aiResponse };

  } catch (error) {
    console.error('[Gemini] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Try Perplexity first (primary provider with web-grounded responses)
    console.log('\n--- Chat Request ---');
    console.log('[System] Trying Perplexity (primary provider with web search)...');
    const perplexityResult = await callPerplexityAPI(message, conversationHistory);

    if (perplexityResult.success && perplexityResult.response) {
      console.log('[System] Using Perplexity response');
      return NextResponse.json({
        response: perplexityResult.response,
        provider: 'perplexity' as AIProvider,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback to Gemini if Perplexity fails
    console.log('[System] Perplexity failed, falling back to Gemini...');
    const geminiResult = await callGeminiAPI(message, conversationHistory);

    if (geminiResult.success && geminiResult.response) {
      console.log('[System] Using Gemini response (fallback)');
      return NextResponse.json({
        response: geminiResult.response,
        provider: 'gemini' as AIProvider,
        timestamp: new Date().toISOString(),
      });
    }

    // Both providers failed
    console.error('[System] Both providers failed');
    console.error('Perplexity error:', perplexityResult.error);
    console.error('Gemini error:', geminiResult.error);

    return NextResponse.json(
      {
        error: 'AI services temporarily unavailable. Please try again in a moment!',
        details: {
          perplexity: perplexityResult.error,
          gemini: geminiResult.error,
        }
      },
      { status: 503 }
    );

  } catch (error) {
    console.error('[System] Chat API exception:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
