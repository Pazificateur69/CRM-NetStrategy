<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Todo;
use App\Models\Rappel;
use App\Notifications\DailyDigestNotification;
use Carbon\Carbon;

class SendDailyDigest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-daily-digest';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie un récapitulatif quotidien (18h) des tâches et rappels à venir';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Début de l'envoi du Daily Digest...");

        $users = User::all();
        $tomorrow = Carbon::tomorrow()->format('Y-m-d');
        $today = Carbon::today()->format('Y-m-d');

        foreach ($users as $user) {
            // 1. Tâches en retard (avant aujourd'hui et non terminées)
            $overdue = Todo::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('assigned_to', $user->id);
            })
                ->where('statut', '!=', 'termine')
                ->where('date_echeance', '<', $today)
                ->whereNotNull('date_echeance')
                ->limit(5)
                ->get();

            // 2. Tâches pour demain
            $tomorrowTasks = Todo::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('assigned_to', $user->id);
            })
                ->where('statut', '!=', 'termine')
                ->whereDate('date_echeance', $tomorrow)
                ->limit(5)
                ->get();

            // 3. Rappels pour demain
            $reminders = Rappel::where('user_id', $user->id)
                ->where('statut', '!=', 'termine')
                ->whereDate('date_echeance', $tomorrow)
                ->limit(5)
                ->get();

            // Si rien à dire, on ne spamme pas (ou on peut envoyer un message "Tout est clean")
            if ($overdue->isEmpty() && $tomorrowTasks->isEmpty() && $reminders->isEmpty()) {
                $this->info("Rien à envoyer pour {$user->name}.");
                continue;
            }

            $data = [
                'overdue' => $overdue,
                'tomorrow' => $tomorrowTasks,
                'reminders' => $reminders
            ];

            $user->notify(new DailyDigestNotification($data));
            $this->info("Notification envoyée à {$user->email}");
        }

        $this->info("Terminé !");
    }
}
