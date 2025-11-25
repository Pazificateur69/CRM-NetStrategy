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
        $data = [
            'societe' => $prospect->societe,
            'contact' => $prospect->contact,
            'statut' => $prospect->statut,
            'interactions' => [
                'todos_count' => $prospect->todos->count(),
                'rappels_count' => $prospect->rappels->count(),
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
}
