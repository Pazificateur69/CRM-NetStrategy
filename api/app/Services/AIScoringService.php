<?php

namespace App\Services;

use App\Models\Prospect;

class AIScoringService
{
    public function calculateScore(Prospect $prospect): int
    {
        $score = 0;
        $details = [];

        // 1. Profile Completeness
        if (!empty($prospect->emails)) {
            $score += 20;
            $details[] = '+20: Email provided';
        }
        if (!empty($prospect->telephones)) {
            $score += 20;
            $details[] = '+20: Phone provided';
        }
        if (!empty($prospect->contact)) {
            $score += 10;
            $details[] = '+10: Contact name provided';
        }
        if (!empty($prospect->societe)) {
            $score += 10;
            $details[] = '+10: Company name provided';
        }

        // 2. Interactions
        $todoCount = $prospect->todos()->count();
        if ($todoCount > 0) {
            $points = min($todoCount * 5, 20);
            $score += $points;
            $details[] = "+{$points}: {$todoCount} Todos";
        }

        $rappelCount = $prospect->rappels()->count();
        if ($rappelCount > 0) {
            $points = min($rappelCount * 5, 20);
            $score += $points;
            $details[] = "+{$points}: {$rappelCount} Reminders";
        }

        // Cap at 100
        $score = min($score, 100);

        // Save details
        $prospect->score_details = $details;
        $prospect->save();

        return $score;
    }
}
