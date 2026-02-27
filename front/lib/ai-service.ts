import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
const ollamaModel = process.env.OLLAMA_MODEL || 'mistral';

function getOpenAIClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  return new OpenAI({ apiKey: openaiApiKey });
}

export async function generateContent(prompt: string, jsonMode = false): Promise<string> {
  // Try OpenAI first
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages: [
          { role: 'system', content: 'Tu es un assistant CRM intelligent pour NetStrategy. Réponds en français.' },
          { role: 'user', content: prompt },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        max_tokens: 1000,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.error('OpenAI error, falling back to Ollama:', e);
    }
  }

  // Fallback to Ollama
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        ...(jsonMode ? { format: 'json' } : {}),
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();
    return cleanResponse(data.response || '');
  } catch (e) {
    console.error('Ollama error:', e);
    // Mock response for local development
    if (jsonMode) {
      return JSON.stringify({
        score: 50,
        strengths: ['Données de contact fournies'],
        weaknesses: ['Informations limitées'],
        recommendation: 'Continuer la prospection avec un suivi régulier.',
      });
    }
    return 'Désolé, le service AI est temporairement indisponible.';
  }
}

export async function chatWithAI(message: string, context?: string): Promise<string> {
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const messages: any[] = [
        { role: 'system', content: 'Tu es un assistant CRM intelligent pour NetStrategy. Tu aides les commerciaux à gérer leurs clients et prospects. Réponds en français de manière concise et professionnelle.' },
      ];
      if (context) {
        messages.push({ role: 'system', content: `Contexte actuel:\n${context}` });
      }
      messages.push({ role: 'user', content: message });

      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.error('OpenAI chat error:', e);
    }
  }

  // Ollama fallback
  try {
    const fullPrompt = context
      ? `Contexte: ${context}\n\nQuestion: ${message}`
      : message;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `Tu es un assistant CRM intelligent. Réponds en français.\n\n${fullPrompt}`,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();
    return cleanResponse(data.response || '');
  } catch {
    return 'Désolé, le service AI est temporairement indisponible. Veuillez réessayer plus tard.';
  }
}

export async function analyzeProspect(data: {
  societe: string;
  contact?: string;
  emails?: string[];
  telephones?: string[];
  statut?: string;
  todos?: any[];
  rappels?: any[];
}): Promise<any> {
  const prompt = `Analyse ce prospect CRM et retourne un JSON avec: score (0-100), strengths (array), weaknesses (array), recommendation (string).

Prospect:
- Société: ${data.societe}
- Contact: ${data.contact || 'Non renseigné'}
- Emails: ${data.emails?.join(', ') || 'Aucun'}
- Téléphones: ${data.telephones?.join(', ') || 'Aucun'}
- Statut: ${data.statut || 'en_attente'}
- Nombre de tâches: ${data.todos?.length || 0}
- Nombre de rappels: ${data.rappels?.length || 0}

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

  const response = await generateContent(prompt, true);

  try {
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from response
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Fallback
      }
    }
    return {
      score: calculateBasicScore(data),
      strengths: data.emails?.length ? ['Contact email fourni'] : [],
      weaknesses: !data.emails?.length ? ['Pas d\'email de contact'] : [],
      recommendation: 'Continuer le suivi commercial.',
    };
  }
}

export async function suggestDeadline(titre: string, description?: string): Promise<{ suggested_date: string; reasoning: string }> {
  const prompt = `Pour cette tâche CRM, suggère une date limite réaliste (format YYYY-MM-DD) et explique pourquoi.

Tâche: ${titre}
${description ? `Description: ${description}` : ''}
Date actuelle: ${new Date().toISOString().split('T')[0]}

Retourne un JSON avec: suggested_date (YYYY-MM-DD), reasoning (string en français).`;

  const response = await generateContent(prompt, true);

  try {
    return JSON.parse(response);
  } catch {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      suggested_date: nextWeek.toISOString().split('T')[0],
      reasoning: 'Date par défaut: une semaine à partir d\'aujourd\'hui.',
    };
  }
}

function calculateBasicScore(data: any): number {
  let score = 0;
  if (data.emails?.length) score += 20;
  if (data.telephones?.length) score += 20;
  if (data.contact) score += 10;
  if (data.societe) score += 10;
  if (data.todos?.length) score += Math.min(data.todos.length * 5, 20);
  if (data.rappels?.length) score += Math.min(data.rappels.length * 5, 20);
  return Math.min(score, 100);
}

function cleanResponse(text: string): string {
  return text
    .replace(/---\n.*$/s, '')
    .replace(/Best regards.*$/s, '')
    .replace(/Cordialement.*$/s, '')
    .trim();
}
