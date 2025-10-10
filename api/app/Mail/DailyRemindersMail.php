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

    public function __construct($user, $rappels)
    {
        $this->user = $user;
        $this->rappels = $rappels;
    }

    public function build()
    {
        return $this->subject('📅 Vos rappels du jour')
                    ->view('emails.daily_reminders');
    }
}
