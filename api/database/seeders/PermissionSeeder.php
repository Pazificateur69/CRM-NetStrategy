<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Liste de base des permissions utilisées dans tes routes
        $permissions = [
            'view clients',
            'manage clients',
            'view prospects',
            'manage prospects',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Exemple de rôles
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $manager = Role::firstOrCreate(['name' => 'manager']);

        // Attribution automatique
        $admin->givePermissionTo(Permission::all());
        $manager->givePermissionTo(['view clients', 'view prospects']);
    }
}
