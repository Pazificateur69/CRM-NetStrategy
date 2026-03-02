<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Client;
use App\Models\Prospect;
use App\Models\Todo;
use Carbon\Carbon;

class SendDailySummary extends Command
{
    protected $signature = 'crm:daily-summary';
    protected $description = 'Send daily summary email to all users';

    public function handle()
    {
        $users = User::all();
        $today = Carbon::today();

        $newClients = Client::whereDate('created_at', $today)->count();
        $newProspects = Prospect::whereDate('created_at', $today)->count();

        foreach ($users as $user) {
            $myPendingTasks = Todo::where('assigned_to', $user->id)
                ->where('statut', '!=', 'termine')
                ->count();

            $content = "Bonjour {$user->name},\n\n";
            $content .= "Voici votre résumé quotidien du " . $today->format('d/m/Y') . " :\n\n";
            $content .= "📊 Activité Globale :\n";
            $content .= "- Nouveaux Clients : {$newClients}\n";
            $content .= "- Nouveaux Prospects : {$newProspects}\n\n";
            $content .= "📝 Vos Tâches :\n";
            $content .= "- Tâches en attente : {$myPendingTasks}\n\n";
            $content .= "Bonne journée !\nL'équipe NetStrategy";

            // Envoi simple via Mail::raw pour éviter de créer une vue pour l'instant
            Mail::raw($content, function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Résumé Quotidien CRM - ' . date('d/m/Y'));
            });

            $this->info("Email envoyé à {$user->email}");
        }

        $this->info('Tous les résumés ont été envoyés.');
    }
}
