<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected $baseUrl;
    protected $model;

    public function __construct()
    {
        // Default to localhost:11434 if not set in .env
        $this->baseUrl = env('OLLAMA_URL', 'http://localhost:11434');
        // Default to mistral if not set in .env
        $this->model = env('OLLAMA_MODEL', 'mistral');
    }

    public function generateContent(string $prompt, bool $jsonMode = false): string
    {
        try {
            $payload = [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'temperature' => $jsonMode ? 0.2 : 0.7, // Low temp for data, higher for chat
                    'num_ctx' => 4096, // Ensure decent context window
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
                return $data['response'];
            }

            return "Aucune réponse générée.";

        } catch (\Exception $e) {
            Log::error('Ollama Service Exception: ' . $e->getMessage());

            // FALLBACK FOR LOCAL DEV (Mock Mode)
            if (env('APP_ENV') === 'local') {
                if ($jsonMode || str_contains($prompt, 'JSON')) {
                    return json_encode([
                        'summary' => "⚠️ L'IA est installée mais pas lancée.",
                        'sentiment' => "Neutre",
                        'next_steps' => ["Ouvrez un terminal", "Tapez 'ollama serve'", "L'IA sera alors active"],
                        'talking_points' => ["Service hors ligne", "Nécessite 'ollama serve'", "Port 11434 injoignable"]
                    ]);
                }
                return "⚠️ L'IA est désactivée. Pour l'activer, lancez 'ollama serve' dans un terminal.";
            }

            return "Erreur de connexion à Ollama (vérifiez qu'il tourne sur le port 11434).";
        }
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
        $prompt .= "Ne mets pas de markdown ou de code block, juste le JSON brut.";

        return $this->generateContent($prompt, true);
    }
}
