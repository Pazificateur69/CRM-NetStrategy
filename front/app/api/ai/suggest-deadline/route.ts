import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json();
    const { titre, description } = body;

    if (!titre) {
      return Response.json({ message: 'titre is required' }, { status: 422 });
    }

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Étant donné cette tâche CRM, suggère une date d'échéance raisonnable.

Titre: ${titre}
${description ? `Description: ${description}` : ''}
Date du jour: ${today}

Réponds UNIQUEMENT avec un JSON: {"suggested_date": "YYYY-MM-DD", "reasoning": "explication courte en français"}`;

    const systemPrompt = 'Tu es un expert en gestion de projet CRM. Réponds uniquement en JSON valide.';

    // Try OpenAI
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(responseText);

      return Response.json(result);
    } catch (openaiError) {
      console.error('OpenAI error, falling back to Ollama:', openaiError);

      // Fallback to Ollama
      try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'mistral';

        const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `${systemPrompt}\n\n${prompt}`,
            stream: false,
          }),
        });

        if (!ollamaResponse.ok) {
          throw new Error('Ollama request failed');
        }

        const ollamaData = await ollamaResponse.json();
        const result = JSON.parse(ollamaData.response || '{}');

        return Response.json(result);
      } catch (ollamaError) {
        console.error('Ollama fallback error:', ollamaError);
        return Response.json({ message: 'AI service unavailable' }, { status: 503 });
      }
    }
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/ai/suggest-deadline error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
