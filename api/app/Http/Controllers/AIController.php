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
            'email' => is_array($prospect->emails) ? ($prospect->emails[0] ?? null) : $prospect->emails,
            'phone' => is_array($prospect->telephones) ? ($prospect->telephones[0] ?? null) : $prospect->telephones,
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
            'prospect_id' => 'nullable|exists:prospects,id',
            'client_id' => 'nullable|exists:clients,id',
            'messages' => 'required|array',
            'messages.*.role' => 'required|in:user,assistant,system',
            'messages.*.content' => 'required|string',
        ]);

        $context = "";

        // 1. Prospect Context
        if (!empty($validated['prospect_id'])) {
            $prospect = Prospect::with(['todos', 'rappels', 'events'])->find($validated['prospect_id']);
            if ($prospect) {
                $context .= "CONTEXT: Discussion about PROSPECT: {$prospect->societe}.\n";
                $emailCtx = is_array($prospect->emails) ? ($prospect->emails[0] ?? 'N/A') : ($prospect->emails ?? 'N/A');
                $phoneCtx = is_array($prospect->telephones) ? ($prospect->telephones[0] ?? 'N/A') : ($prospect->telephones ?? 'N/A');
                $context .= "Key Info: Contact={$prospect->contact}, Email={$emailCtx}, Tel={$phoneCtx}, Status={$prospect->statut}.\n";
                $context .= "Details: " . ($prospect->details ?? 'None') . "\n";
                $context .= "History: " . $prospect->todos->count() . " tasks, " . $prospect->rappels->count() . " reminders.\n";
            }
        }

        // 2. Client Context
        if (!empty($validated['client_id'])) {
            $client = \App\Models\Client::with(['todos', 'rappels', 'prestations'])->find($validated['client_id']);
            if ($client) {
                $context .= "CONTEXT: Discussion about CLIENT: {$client->societe}.\n";
                $context .= "Key Info: Contact={$client->gerant}, Email=" . ($client->emails[0] ?? 'N/A') . ", Tel=" . ($client->telephones[0] ?? 'N/A') . ".\n";
                $context .= "Services: " . $client->prestations->count() . " active services.\n";
            }
        }

        // 3. Build Prompt
        $baseSystemPrompt = "Tu es l'assistant IA du CRM NetStrategy. Ton rôle est d'aider l'utilisateur à gérer ses clients et prospects.\n";
        $baseSystemPrompt .= "Règles STRICTES :\n";
        $baseSystemPrompt .= "- Sois concis et direct, va droit au but.\n";
        $baseSystemPrompt .= "- Utilise des listes à puces pour énumérer des éléments.\n";
        $baseSystemPrompt .= "- NE METS JAMAIS de signature email (pas de 'Cordialement', pas d'adresse email, pas de formule de politesse finale).\n";
        $baseSystemPrompt .= "- NE MENTIONNE JAMAIS 'contact@netstrategy' ou toute autre adresse email dans tes réponses.\n";
        $baseSystemPrompt .= "- Adopte un ton professionnel mais amical.\n";
        $baseSystemPrompt .= "- Si l'utilisateur demande de créer une tâche ou un rappel, confirme et donne les détails.\n";

        $prompt = "SYSTEM: $baseSystemPrompt\n";

        // Add calculated context if any
        if (!empty($context)) {
            $prompt .= "CONTEXTE DU CRM:\n$context\n\n";
        }

        foreach ($validated['messages'] as $msg) {
            $role = strtoupper($msg['role']);
            $prompt .= "$role: {$msg['content']}\n";
        }
        $prompt .= "ASSISTANT:";

        $response = $this->aiService->generateContent($prompt);

        return response()->json(['response' => $response]);
    }
    public function suggestReminder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $today = now()->toDateString();
        $prompt = "Tu es un assistant de productivité expert.\n";
        $prompt .= "Analyse la tâche suivante et suggère une date d'échéance réaliste et une raison courte.\n";
        $prompt .= "Tâche : {$validated['title']}\n";
        if (!empty($validated['description'])) {
            $prompt .= "Détails : {$validated['description']}\n";
        }
        $prompt .= "Date actuelle : $today\n";
        $prompt .= "Règles :\n";
        $prompt .= "- Si urgence détectée (mots comme 'urgent', 'ASAP', 'aujourd'hui'), mets la date d'aujourd'hui ou demain.\n";
        $prompt .= "- Si c'est une tâche de fond (stratégie, veille), mets +1 semaine.\n";
        $prompt .= "- Sinon, mets par défaut +2 jours.\n";
        $prompt .= "Réponds UNIQUEMENT au format JSON valide : { \"date\": \"YYYY-MM-DD\", \"reason\": \"Explication courte\" }";

        $response = $this->aiService->generateContent($prompt);

        // Nettoyage basique si l'IA ajoute du texte autour du JSON
        if (preg_match('/\{.*\}/s', $response, $matches)) {
            $response = $matches[0];
        }

        $decoded = json_decode($response, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return response()->json($decoded);
        }

        return response()->json([
            'date' => now()->addDays(2)->toDateString(),
            'reason' => 'Suggestion par défaut (IA indisponible)',
            'raw_response' => $response
        ]);
    }
}
