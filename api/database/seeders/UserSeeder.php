<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Crée le rôle admin s’il n’existe pas encore
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // ✅ Supprime l'ancien admin
        User::where('email', 'admin@test.com')->delete();

        // ✅ Crée ou met à jour l'utilisateur admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        // ✅ Assigne le rôle
        if (method_exists($admin, 'assignRole')) {
            $admin->assignRole('admin');
        }

        $this->command->info('✅ Compte admin créé : admin@test.com / password123');
    }
}
