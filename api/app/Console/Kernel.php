<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Enregistre les commandes Artisan personnalisées.
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }

    /**
     * Planifie les tâches automatiques (CRON).
     */
    protected function schedule(Schedule $schedule)
    {
        // 🔁 Envoi automatique des rappels chaque jour à 8h du matin
        $schedule->command('rappels:send-daily')->dailyAt('08:00');

        // 📧 Résumé quotidien à 18h
        $schedule->command('crm:daily-summary')->dailyAt('18:00');

        // 📊 Rapport Hebdomadaire (Vendredi 17h)
        $schedule->command('crm:weekly-report')->weeklyOn(5, '17:00');

        // Exemple : sauvegarde auto chaque nuit
        // $schedule->command('backup:run')->dailyAt('02:00');
    }
}
