<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Création des Permissions (Modules)
        $permissions = [
            'manage users',
            'view prospects',
            'manage prospects',
            'view clients',
            'manage clients',
            'access dev',
            'access seo',
            'access social media',
            'access ads',
            'access comptabilite',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Création des Rôles et attributions
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);
        $roleAdmin->syncPermissions(Permission::all());

        $roleCom = Role::firstOrCreate(['name' => 'com']);
        $roleCom->syncPermissions(['view prospects', 'manage prospects', 'view clients', 'manage clients']);

        $roleDev = Role::firstOrCreate(['name' => 'dev']);
        $roleDev->syncPermissions(['view clients', 'access dev']);

        $roleSeo = Role::firstOrCreate(['name' => 'seo']);
        $roleSeo->syncPermissions(['view clients', 'access seo']);

        $roleSocial = Role::firstOrCreate(['name' => 'reseaux_sociaux']);
        $roleSocial->syncPermissions(['view clients', 'access social media']);

        $roleComptable = Role::firstOrCreate(['name' => 'comptabilite']);
        $roleComptable->syncPermissions(['view clients', 'access comptabilite']);

        // Role par défaut pour les nouveaux inscrits
        $roleUser = Role::firstOrCreate(['name' => 'user']);
        $roleUser->syncPermissions(['view clients', 'view prospects']);

        // 3. Assignation aux utilisateurs par défaut 

        // Admin par défaut (assurez-vous qu'il a le champ 'role' dans la DB)
        $adminUser = User::where('email', 'admin@test.com')->first();
        if ($adminUser) {
            $adminUser->syncRoles('admin');
        } else {
            User::updateOrCreate(
                ['email' => 'admin@test.com'],
                ['name' => 'Admin', 'password' => Hash::make('password123'), 'role' => 'admin']
            )->syncRoles('admin');
        }

        // Louise (Commerciale)
        $louise = User::updateOrCreate(['email' => 'louise@test.com'], ['name' => 'Louise', 'password' => Hash::make('password123'), 'role' => 'com']);
        $louise->syncRoles('com');

        // Cherif (SEO)
        $cherif = User::updateOrCreate(['email' => 'cherif@test.com'], ['name' => 'Cherif', 'password' => Hash::make('password123'), 'role' => 'dev']);
        $cherif->syncRoles('seo');

        // Apo (Social Media)
        $apo = User::updateOrCreate(['email' => 'apo@test.com'], ['name' => 'Apo', 'password' => Hash::make('password123'), 'role' => 'reseaux_sociaux']);
        $apo->syncRoles('reseaux_sociaux');

        // Utilisateur Comptabilité
        $compta = User::updateOrCreate(['email' => 'compta@test.com'], ['name' => 'Compta', 'password' => Hash::make('password123'), 'role' => 'comptabilite']);
        $compta->syncRoles('comptabilite');
    }
}