<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Rappel;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendDailyReminders extends Command
{
    protected $signature = 'reminders:send-daily';
    protected $description = 'Envoie un mail quotidien avec la liste des rappels du jour à chaque utilisateur';

    public function handle()
    {
        $today = Carbon::today();
        $users = User::all();

        foreach ($users as $user) {
            // Récupérer les rappels de l'utilisateur pour aujourd'hui
            $rappels = Rappel::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('assignedUsers', fn($q) => $q->where('user_id', $user->id));
            })
            ->whereDate('date_rappel', $today)
            ->where('fait', false)
            ->get();

            if ($rappels->count() > 0) {
                // Envoyer le mail avec la liste des rappels
                try {
                    Mail::send('emails.daily_reminders', [
                        'user' => $user,
                        'rappels' => $rappels,
                        'date' => $today->format('d/m/Y'),
                    ], function ($message) use ($user) {
                        $message->to($user->email)
                            ->subject('Vos rappels du jour - ' . Carbon::today()->format('d/m/Y'));
                    });

                    $this->info("Mail envoyé à {$user->email} ({$rappels->count()} rappel(s))");
                } catch (\Exception $e) {
                    $this->error("Erreur lors de l'envoi du mail à {$user->email}: {$e->getMessage()}");
                }
            }
        }

        $this->info('Envoi des rappels quotidiens terminé.');
        return 0;
    }
}
