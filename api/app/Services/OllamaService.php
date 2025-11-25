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

    public function generateContent(string $prompt): string
    {
        try {
            $response = Http::timeout(60)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'format' => 'json', // Force JSON mode if supported by model
            ]);

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
            return "Erreur de connexion à Ollama (vérifiez qu'il tourne sur le port 11434).";
        }
    }

    public function analyzeProspect($prospectData): string
    {
        $prompt = "Tu es un expert CRM. Analyse ce prospect :\n";
        $prompt .= json_encode($prospectData) . "\n\n";
        $prompt .= "Réponds UNIQUEMENT avec un JSON valide contenant :\n";
        $prompt .= "- summary (string, résumé court)\n";
        $prompt .= "- sentiment (string: Positif, Neutre, Négatif)\n";
        $prompt .= "- next_steps (array of strings, 3 actions)\n";
        $prompt .= "- talking_points (array of strings, 3 points clés)\n";
        $prompt .= "Ne mets pas de markdown, juste le JSON brut.";

        return $this->generateContent($prompt);
    }
}
