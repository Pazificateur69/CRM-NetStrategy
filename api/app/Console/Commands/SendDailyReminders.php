<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Rappel;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\DailyRemindersMail;
use Carbon\Carbon;

class SendDailyReminders extends Command
{
    protected $signature = 'rappels:send-daily';
    protected $description = 'Envoie un email journalier des rappels à faire à chaque utilisateur.';

    public function handle()
    {
        $today = Carbon::today();

        $rappels = Rappel::with('user', 'rappelable')
            ->whereDate('date_rappel', $today)
            ->where('fait', false)
            ->get()
            ->groupBy('user_id');

        foreach ($rappels as $userId => $userRappels) {
            $user = User::find($userId);
            if ($user && $user->email) {
                Mail::to($user->email)->send(new DailyRemindersMail($user, $userRappels));
            }
        }

        $this->info('📧 Emails de rappels envoyés avec succès.');
    }
}
