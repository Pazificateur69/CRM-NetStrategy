<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sender_id;
    public $receiver_id;

    /**
     * Create a new event instance.
     */
    public function __construct($sender_id, $receiver_id)
    {
        $this->sender_id = $sender_id;
        $this->receiver_id = $receiver_id;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Notify the RECEIVER that the sender is typing
        return [
            new PrivateChannel('chat.' . $this->receiver_id),
        ];
    }

    public function broadcastAs()
    {
        return 'UserTyping';
    }
}
