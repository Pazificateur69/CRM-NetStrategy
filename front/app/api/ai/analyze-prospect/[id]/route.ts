import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const prospectId = parseInt(id, 10);

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: {
        todos: {
          select: { id: true, titre: true, statut: true, dateEcheance: true },
        },
        rappels: {
          select: { id: true, titre: true, fait: true, dateRappel: true },
        },
      },
    });

    if (!prospect) {
      return Response.json({ message: 'Prospect not found' }, { status: 404 });
    }

    const prompt = `Analyse ce prospect CRM et retourne un JSON avec: score (0-100), strengths (array de string), weaknesses (array de string), recommendation (string).

Données du prospect:
- Société: ${prospect.societe}
- Contact: ${prospect.contact || 'Non renseigné'}
- Statut: ${prospect.statut}
- Score actuel: ${prospect.score || 0}
- Site web: ${prospect.siteWeb || 'Non renseigné'}
- Ville: ${prospect.ville || 'Non renseignée'}
- Nombre de todos: ${prospect.todos.length} (terminés: ${prospect.todos.filter((t) => t.statut === 'termine').length})
- Nombre de rappels: ${prospect.rappels.length} (faits: ${prospect.rappels.filter((r) => r.fait).length})
- Todos en retard: ${prospect.todos.filter((t) => t.statut === 'retard').length}

Réponds UNIQUEMENT avec le JSON, sans markdown ni texte supplémentaire.`;

    const systemPrompt = 'Tu es un analyste CRM expert. Réponds uniquement en JSON valide.';

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
      const analysis = JSON.parse(responseText);

      return Response.json(analysis);
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
        const analysis = JSON.parse(ollamaData.response || '{}');

        return Response.json(analysis);
      } catch (ollamaError) {
        console.error('Ollama fallback error:', ollamaError);
        return Response.json({ message: 'AI service unavailable' }, { status: 503 });
      }
    }
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/ai/analyze-prospect/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
