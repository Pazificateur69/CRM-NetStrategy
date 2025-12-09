<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AIController extends Controller
{
    protected $aiService;

    public function __construct(OllamaService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function analyzeProspect(int $id): JsonResponse
    {
        $prospect = Prospect::with(['todos', 'rappels'])->find($id);

        if (!$prospect) {
            return response()->json(['error' => 'Prospect not found'], 404);
        }

        // Prepare data for AI
        // Prepare RICH data for AI
        $data = [
            'societe' => $prospect->societe,
            'contact' => $prospect->contact,
            'email' => $prospect->email,
            'phone' => $prospect->phone,
            'statut' => $prospect->statut,
            'details_techniques' => $prospect->details ?? 'Aucun détail technique',
            'score' => $prospect->score,
            'interactions' => [
                'todos' => $prospect->todos->map(fn($t) => [
                    'titre' => $t->titre,
                    'statut' => $t->statut,
                    'date' => $t->date_echeance
                ]),
                'rappels' => $prospect->rappels->map(fn($r) => [
                    'titre' => $r->titre,
                    'note' => $r->description,
                    'date' => $r->date_rappel
                ]),
                'events' => $prospect->events ? $prospect->events->map(fn($e) => [ // Check if relation exists or need to be added
                    'titre' => $e->title,
                    'date' => $e->start
                ]) : [],
                'last_interaction' => $prospect->updated_at->toDateString(),
            ]
        ];

        $analysisJson = $this->aiService->analyzeProspect($data);

        // Attempt to decode JSON from AI (it might be raw text if AI fails instruction)
        $decoded = json_decode($analysisJson, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return response()->json($decoded);
        }

        // Fallback if not valid JSON
        return response()->json([
            'summary' => $analysisJson,
            'sentiment' => 'Neutre',
            'next_steps' => ['Vérifier la réponse brute'],
            'talking_points' => []
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prospect_id' => 'required|exists:prospects,id',
            'messages' => 'required|array',
            'messages.*.role' => 'required|in:user,assistant,system',
            'messages.*.content' => 'required|string',
        ]);

        $prospect = Prospect::with(['todos', 'rappels', 'events'])->find($validated['prospect_id']);

        // Build Context
        $context = "Tu es un assistant CRM intelligent. Tu discutes à propos du prospect : {$prospect->societe}.\n";
        $context .= "Infos clés : Contact={$prospect->contact}, Email={$prospect->email}, Tel={$prospect->phone}, Statut={$prospect->statut}.\n";
        $context .= "Détails : " . ($prospect->details ?? 'Aucun') . "\n";
        $context .= "Historique : " . $prospect->todos->count() . " tâches, " . $prospect->rappels->count() . " rappels.\n";
        $context .= "Réponds de manière concise, professionnelle et utile pour aider le commercial.\n";

        // Prepare Prompt for Ollama (Format: System + History + New Message)
        // Since OllamaService uses a simple string prompt, we format the chat history manually or use a specific chat endpoint if available.
        // Assuming generateContent uses a completion endpoint, we construct a transcript.

        $prompt = $context . "\n\n";
        foreach ($validated['messages'] as $msg) {
            $role = strtoupper($msg['role']);
            $prompt .= "$role: {$msg['content']}\n";
        }
        $prompt .= "ASSISTANT:";

        $response = $this->aiService->generateContent($prompt);

        return response()->json(['response' => $response]);
    }
}
