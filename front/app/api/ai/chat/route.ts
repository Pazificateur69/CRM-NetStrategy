import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json();
    const { message, context } = body;

    if (!message) {
      return Response.json({ message: 'message is required' }, { status: 422 });
    }

    const systemPrompt = 'Tu es un assistant CRM intelligent pour NetStrategy. Réponds en français.';

    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (context) {
      messages.push({ role: 'user', content: `Contexte: ${context}` });
    }

    messages.push({ role: 'user', content: message });

    // Try OpenAI first
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const completion = await openai.chat.completions.create({
        model,
        messages,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      return Response.json({ response: responseText });
    } catch (openaiError) {
      console.error('OpenAI error, falling back to Ollama:', openaiError);

      // Fallback to Ollama
      try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'mistral';

        const fullPrompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

        const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: fullPrompt,
            stream: false,
          }),
        });

        if (!ollamaResponse.ok) {
          throw new Error('Ollama request failed');
        }

        const ollamaData = await ollamaResponse.json();
        return Response.json({ response: ollamaData.response || '' });
      } catch (ollamaError) {
        console.error('Ollama fallback error:', ollamaError);
        return Response.json({ message: 'AI service unavailable' }, { status: 503 });
      }
    }
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/ai/chat error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
