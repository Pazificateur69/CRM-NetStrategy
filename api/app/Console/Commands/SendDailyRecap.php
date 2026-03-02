<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendDailyRecap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-daily-recap';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie un email récapitulatif quotidien aux utilisateurs avec leurs tâches et RDV';

    public function handle()
    {
        $users = \App\Models\User::all();
        $date = now()->toDateString();
        $count = 0;

        foreach ($users as $user) {
            $this->info("Checking for User: {$user->name} (ID: {$user->id})");

            // 1. Rappels du jour (Assignés à l'utilisateur via pivot)
            $rappels = \App\Models\Rappel::whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
                ->whereDate('date_rappel', $date) // Correction: date_rappel au lieu de date
                ->where('statut', '!=', 'termine')
                ->get();

            // 2. Todos en cours (Assignés à l'utilisateur)
            $todos = \App\Models\Todo::where('assigned_to', $user->id)
                ->where('statut', '!=', 'termine')
                ->orderBy('priorite', 'desc')
                ->get();

            $this->info("  - Rappels: " . $rappels->count());
            $this->info("  - Todos: " . $todos->count());

            // 3. Events du jour (Assignés ou Créés ? Souvent events a user_id comme propriétaire, mais vérifions s'il y a un pivot invités. Pour l'instant on garde user_id propriétaire ou "assigned_to" si existe)
            // Après vérif, Events n'a que user_id. On suppose que c'est l'assigné pour les events.
            $events = \App\Models\Event::where('user_id', $user->id)
                ->whereDate('start', $date)
                ->orderBy('start')
                ->get();

            // S'il y a quelque chose à faire, on envoie le mail
            if ($rappels->isNotEmpty() || $todos->isNotEmpty() || $events->isNotEmpty()) {
                \Illuminate\Support\Facades\Mail::to($user->email)
                    ->send(new \App\Mail\DailyRemindersMail($user, $rappels, $todos, $events));

                $this->info("Email envoyé à {$user->email}");
                $count++;
            }
        }

        $this->info("Terminé. $count emails envoyés.");
    }
}
