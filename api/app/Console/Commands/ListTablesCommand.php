<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ListTablesCommand extends Command
{
    protected $signature = 'db:tables';
    protected $description = 'Liste toutes les tables de la base de données actuelle (compatible SQLite, MySQL, PostgreSQL)';

    public function handle()
    {
        $connection = config('database.default');
        $driver = config("database.connections.$connection.driver");

        $this->info("🔍 Connexion actuelle : $connection ($driver)");

        $tables = [];

        switch ($driver) {
            case 'sqlite':
                $results = DB::select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
                $tables = array_map(fn($r) => $r->name, $results);
                break;

            case 'mysql':
                $results = DB::select('SHOW TABLES');
                $key = array_keys((array) $results[0])[0] ?? null;
                $tables = $key ? array_column($results, $key) : [];
                break;

            case 'pgsql':
                $results = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");
                $tables = array_map(fn($r) => $r->tablename, $results);
                break;

            default:
                $this->error("❌ Pilote non pris en charge : $driver");
                return;
        }

        if (empty($tables)) {
            $this->warn("⚠️  Aucune table trouvée.");
            return;
        }

        $this->table(['Tables'], array_map(fn($t) => [$t], $tables));
    }
}
