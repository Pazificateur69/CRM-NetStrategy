<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\LoginHistory;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class SecurityController extends Controller
{
    public function getAuditLogs(Request $request)
    {
        $query = AuditLog::with('user:id,name');

        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('created_at', $request->date);
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function getLoginHistory(Request $request)
    {
        return LoginHistory::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();
    }

    public function getActiveSessions(Request $request)
    {
        return Auth::user()->tokens()
            ->where('name', '!=', '2fa_temp') // Exclude temp tokens
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'last_used_at' => $token->last_used_at,
                    'created_at' => $token->created_at,
                    'current' => $token->id === Auth::user()->currentAccessToken()->id,
                ];
            });
    }

    public function revokeSession($id)
    {
        $user = Auth::user();
        if ($id == $user->currentAccessToken()->id) {
            return response()->json(['message' => 'Cannot revoke current session'], 400);
        }

        $user->tokens()->where('id', $id)->delete();

        return response()->json(['message' => 'Session revoked']);
    }
}
