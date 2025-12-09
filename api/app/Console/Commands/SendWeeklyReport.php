<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Todo;
use App\Models\Client;
use App\Models\Prospect;
use Illuminate\Support\Facades\Mail;
use App\Mail\WeeklyReportMail;
use Carbon\Carbon;

class SendWeeklyReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:weekly-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie un rapport hebdomadaire aux administrateurs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Début de la génération du rapport hebdomadaire...');

        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        // 1. Agrégation des stats
        $stats = [
            'tasks_completed' => Todo::where('statut', 'termine')
                ->whereBetween('updated_at', [$startOfWeek, $endOfWeek])
                ->count(),
            'tasks_created' => Todo::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
            'new_clients' => Client::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
            'new_prospects' => Prospect::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
            'overdue_tasks' => Todo::where('statut', '!=', 'termine')
                ->where('date_echeance', '<', now())
                ->count(),
            'top_users' => User::withCount([
                'todos as completed_count' => function ($query) use ($startOfWeek, $endOfWeek) {
                    $query->where('statut', 'termine')
                        ->whereBetween('updated_at', [$startOfWeek, $endOfWeek]);
                }
            ])
                ->orderByDesc('completed_count')
                ->take(3)
                ->get()
        ];

        // 2. Récupération des admins
        $admins = User::role('admin')->get();

        if ($admins->isEmpty()) {
            $this->warn('Aucun administrateur trouvé.');
            return;
        }

        // 3. Envoi des emails
        foreach ($admins as $admin) {
            $this->info("Envoi à {$admin->email}...");
            Mail::to($admin->email)->send(new WeeklyReportMail($stats, $admin));
        }

        $this->info('Rapport hebdomadaire envoyé avec succès ! 🚀');
    }
}
