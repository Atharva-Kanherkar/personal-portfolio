import { NextRequest } from 'next/server';
import Perplexity from '@perplexity-ai/perplexity_ai';
import { SYSTEM_PROMPT } from '../prompt';
 
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const { message, conversationHistory = [], model = 'perplexity' } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 });
    }

    if (message.length > 1000) {
      return new Response('Message too long (max 1000 characters)', { status: 400 });
    }

    // Use the model selected by the user
    if (model === 'gemini') {
      console.log('[Stream] User selected Gemini...');
      return streamGeminiResponse(message, conversationHistory, encoder);
    }

    // Default to Perplexity
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.log('[Stream] Perplexity not configured, falling back to Gemini...');
      return streamGeminiResponse(message, conversationHistory, encoder);
    }

    console.log('[Stream] Starting Perplexity stream...');

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const client = new Perplexity({
            apiKey: apiKey,
          });

          // Build messages array
          const messages = [
            {
              role: 'system' as const,
              content: SYSTEM_PROMPT,
            },
            ...conversationHistory.map((msg: any) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
            {
              role: 'user' as const,
              content: message,
            },
          ];

          // Create streaming completion
          const streamResponse = await client.chat.completions.create({
            messages,
            model: 'sonar',
            temperature: 0.8,
            max_tokens: 1024,
            top_p: 0.95,
            stream: true,
            search_recency_filter: 'month',
          });

          // Stream tokens
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              const data = JSON.stringify({ type: 'token', content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );

          controller.close();
          console.log('[Stream] Perplexity stream completed');

        } catch (error) {
          console.error('[Stream] Perplexity error:', error);

          // Try Gemini fallback
          try {
            await streamGeminiToController(message, conversationHistory, controller, encoder);

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            );
            controller.close();
          } catch (fallbackError) {
            console.error('[Stream] Gemini fallback error:', fallbackError);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`)
            );
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Stream] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Gemini streaming helper
async function streamGeminiToController(
  message: string,
  conversationHistory: any[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No Gemini API key');
  }

  const messages = [
    ...conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
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
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
            );
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Gemini streaming fallback
async function streamGeminiResponse(
  message: string,
  conversationHistory: any[],
  encoder: TextEncoder
) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamGeminiToController(message, conversationHistory, controller, encoder);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
