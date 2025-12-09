<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DailyRemindersMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $rappels;
    public $todos;
    public $events;

    public function __construct($user, $rappels, $todos, $events)
    {
        $this->user = $user;
        $this->rappels = $rappels;
        $this->todos = $todos;
        $this->events = $events;
    }

    public function build()
    {
        return $this->subject('📅 Votre récapitulatif du jour')
            ->view('emails.daily_recap');
    }
}
