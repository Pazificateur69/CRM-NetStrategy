<?php

namespace App\Http\Controllers;

use App\Models\DailyMood;
use Illuminate\Http\Request;

class MoodController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mood' => 'required|string|in:happy,neutral,sad,stressed',
            'comment' => 'nullable|string|max:255',
        ]);

        $mood = DailyMood::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'date' => now()->toDateString(),
            ],
            [
                'mood' => $validated['mood'],
                'comment' => $validated['comment'] ?? null,
            ]
        );

        return response()->json($mood);
    }

    public function checkToday(Request $request)
    {
        $mood = DailyMood::where('user_id', $request->user()->id)
            ->where('date', now()->toDateString())
            ->first();

        return response()->json($mood);
    }

    public function stats(Request $request)
    {
        // 1. Moods des 7 derniers jours par date
        $history = DailyMood::selectRaw('date, mood, count(*) as count')
            ->where('date', '>=', now()->subDays(7))
            ->groupBy('date', 'mood')
            ->orderBy('date')
            ->get()
            ->groupBy('date');

        // 2. Moods d'aujourd'hui avec user info
        $today = DailyMood::with('user:id,name,pole')
            ->where('date', now()->toDateString())
            ->get();

        return response()->json([
            'history' => $history,
            'today' => $today
        ]);
    }
}
