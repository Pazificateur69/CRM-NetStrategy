<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Prospect;
use App\Services\AIScoringService;

class UpdateProspectScores extends Command
{
    protected $signature = 'prospects:score';
    protected $description = 'Calculate scores for all prospects';

    public function handle(AIScoringService $scoringService): void
    {
        $this->info('Starting scoring...');
        $prospects = Prospect::all();
        $bar = $this->output->createProgressBar(count($prospects));

        foreach ($prospects as $prospect) {
            $scoringService->calculateScore($prospect);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All prospects scored!');
    }
}
