<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sender_id;
    public $receiver_id;
    public $read_at;

    /**
     * Create a new event instance.
     */
    public function __construct($sender_id, $receiver_id, $read_at)
    {
        $this->sender_id = $sender_id;
        $this->receiver_id = $receiver_id;
        $this->read_at = $read_at;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Notify the SENDER that their messages were read by the receiver
        return [
            new PrivateChannel('chat.' . $this->sender_id),
        ];
    }
}
