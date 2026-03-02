<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected $apiKey;
    protected $model;
    protected $baseUrl;
    protected $useOpenAI;

    public function __construct()
    {
        // Prefer OpenAI if key is available
        $this->apiKey = config('ai.openai_api_key');
        $this->useOpenAI = !empty($this->apiKey);

        if ($this->useOpenAI) {
            $this->baseUrl = 'https://api.openai.com/v1';
            $this->model = config('ai.openai_model', 'gpt-4o-mini');
        } else {
            // Fallback to Ollama
            $this->baseUrl = config('ai.ollama_url', 'http://localhost:11434');
            $this->model = config('ai.ollama_model', 'mistral');
        }
    }

    public function generateContent(string $prompt, bool $jsonMode = false): string
    {
        if ($this->useOpenAI) {
            return $this->generateWithOpenAI($prompt, $jsonMode);
        }
        return $this->generateWithOllama($prompt, $jsonMode);
    }

    /**
     * Generate content using OpenAI API
     */
    protected function generateWithOpenAI(string $prompt, bool $jsonMode = false): string
    {
        try {
            $payload = [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => "Tu es l'assistant IA de NetStrategy CRM. Réponds de manière concise et professionnelle. NE METS JAMAIS de signature email, d'adresse email, ou de formule de politesse à la fin de tes réponses. Va droit au but."
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => $jsonMode ? 0.2 : 0.7,
                'max_tokens' => 1000,
            ];

            if ($jsonMode) {
                $payload['response_format'] = ['type' => 'json_object'];
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post("{$this->baseUrl}/chat/completions", $payload);

            if ($response->failed()) {
                Log::error('OpenAI API Error: ' . $response->body());
                return "Erreur lors de l'appel à l'IA.";
            }

            $data = $response->json();

            if (isset($data['choices'][0]['message']['content'])) {
                $content = $data['choices'][0]['message']['content'];
                // Clean up any email signatures that might slip through
                $content = $this->cleanResponse($content);
                return $content;
            }

            return "Aucune réponse générée.";

        } catch (\Exception $e) {
            Log::error('OpenAI Service Exception: ' . $e->getMessage());
            return "Erreur de connexion à l'IA.";
        }
    }

    /**
     * Generate content using Ollama (fallback)
     */
    protected function generateWithOllama(string $prompt, bool $jsonMode = false): string
    {
        try {
            $payload = [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'temperature' => $jsonMode ? 0.2 : 0.7,
                    'num_ctx' => 4096,
                ]
            ];

            if ($jsonMode) {
                $payload['format'] = 'json';
            }

            $response = Http::timeout(60)->post("{$this->baseUrl}/api/generate", $payload);

            if ($response->failed()) {
                Log::error('Ollama API Error: ' . $response->body());
                return "Erreur lors de l'appel à Ollama.";
            }

            $data = $response->json();

            if (isset($data['response'])) {
                return $this->cleanResponse($data['response']);
            }

            return "Aucune réponse générée.";

        } catch (\Exception $e) {
            Log::error('Ollama Service Exception: ' . $e->getMessage());

            // FALLBACK FOR LOCAL DEV (Mock Mode)
            if (config('app.env') === 'local') {
                if ($jsonMode || str_contains($prompt, 'JSON')) {
                    return json_encode([
                        'summary' => "⚠️ L'IA n'est pas disponible.",
                        'sentiment' => "Neutre",
                        'next_steps' => ["Vérifiez la configuration OpenAI ou Ollama"],
                        'talking_points' => ["Service hors ligne"]
                    ]);
                }
                return "⚠️ L'IA n'est pas disponible. Configurez OPENAI_API_KEY ou lancez Ollama.";
            }

            return "Erreur de connexion à l'IA.";
        }
    }

    /**
     * Clean response - remove email signatures and unnecessary formatting
     */
    protected function cleanResponse(string $content): string
    {
        // Remove common email signature patterns
        $patterns = [
            '/\n\n?---+\n.*$/s',
            '/\n\n?Cordialement[,\s].*$/si',
            '/\n\n?Best regards[,\s].*$/si',
            '/\n\n?Bien à vous[,\s].*$/si',
            '/\n\n?L\'équipe NetStrategy.*$/si',
            '/\n\n?NetStrategy.*@.*$/si',
            '/contact\.?@?netstrategy.*$/si',
            '/contact@net-strategy\.fr.*$/si',
            '/\[?contact\.netstrategy@gmail\.com\]?.*$/si',
        ];

        foreach ($patterns as $pattern) {
            $content = preg_replace($pattern, '', $content);
        }

        return trim($content);
    }

    public function analyzeProspect($prospectData): string
    {
        $prompt = "Tu es un expert commercial et CRM de haut niveau. Analyse ce prospect en détail pour maximiser la conversion :\n";
        $prompt .= json_encode($prospectData, JSON_PRETTY_PRINT) . "\n\n";
        $prompt .= "Consignes :\n";
        $prompt .= "1. Analyse la cohérence des actions passées (todos, rappels).\n";
        $prompt .= "2. Détecte les signaux d'urgence ou d'opportunité.\n";
        $prompt .= "3. Propose une stratégie concrète.\n\n";
        $prompt .= "Réponds UNIQUEMENT avec un JSON valide respectant ce schéma strict :\n";
        $prompt .= "- summary (string, résumé percutant de la situation)\n";
        $prompt .= "- sentiment (string: 'Très Chaud' | 'Chaud' | 'Tiède' | 'Froid' | 'À relancer')\n";
        $prompt .= "- next_steps (array of strings, 3 actions précises et datées si possible)\n";
        $prompt .= "- talking_points (array of strings, 3 arguments clés personnalisés pour le prochain appel)\n";
        $prompt .= "Ne mets pas de markdown ou de code block, juste le JSON brut. NE METS PAS DE SIGNATURE EMAIL.";

        return $this->generateContent($prompt, true);
    }
}
