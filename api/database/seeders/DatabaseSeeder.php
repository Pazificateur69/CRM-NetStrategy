<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            RoleAndPermissionSeeder::class, // <-- AJOUTÉ
            ClientSeeder::class,
            ProspectSeeder::class,
            // RappelSeeder::class,
            // TodoSeeder::class,
        ]);
    }
}