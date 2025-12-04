<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // Get conversation with a specific user
    public function index($userId)
    {
        $authUserId = Auth::id();

        $messages = Message::where(function ($query) use ($authUserId, $userId) {
            $query->where('sender_id', $authUserId)
                ->where('receiver_id', $userId);
        })->orWhere(function ($query) use ($authUserId, $userId) {
            $query->where('sender_id', $userId)
                ->where('receiver_id', $authUserId);
        })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as read
        // Mark messages as read
        $updated = Message::where('sender_id', $userId)
            ->where('receiver_id', $authUserId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($updated > 0) {
            broadcast(new \App\Events\MessageRead($userId, $authUserId, now()))->toOthers();
        }

        return response()->json($messages);
    }

    // Send a message
    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'nullable|string',
            'image' => 'nullable|image|max:10240', // Max 10MB
        ]);

        if (!$request->has('content') && !$request->hasFile('image')) {
            return response()->json(['error' => 'Message content or image is required'], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('chat_images'), $filename);
            $imagePath = 'chat_images/' . $filename;
        }

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $validated['receiver_id'],
            'content' => $validated['content'] ?? '',
            'image_url' => $imagePath,
        ]);

        broadcast(new \App\Events\MessageSent($message))->toOthers();

        return response()->json($message, 201);
    }

    // Get list of users with unread count
    public function contacts()
    {
        $authUserId = Auth::id();

        $users = User::where('id', '!=', $authUserId)
            ->get()
            ->map(function ($user) use ($authUserId) {
                $user->unread_count = Message::where('sender_id', $user->id)
                    ->where('receiver_id', $authUserId)
                    ->whereNull('read_at')
                    ->count();

                // Get last message for preview
                $lastMessage = Message::where(function ($q) use ($user, $authUserId) {
                    $q->where('sender_id', $user->id)->where('receiver_id', $authUserId);
                })->orWhere(function ($q) use ($user, $authUserId) {
                    $q->where('sender_id', $authUserId)->where('receiver_id', $user->id);
                })->latest()->first();

                $user->last_message = $lastMessage ? $lastMessage->content : null;
                $user->last_message_time = $lastMessage ? $lastMessage->created_at : null;

                return $user;
            })
            ->sortByDesc('last_message_time')
            ->values();

        return response()->json($users);
    }
}
