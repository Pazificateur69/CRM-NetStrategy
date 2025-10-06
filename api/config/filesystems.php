<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    */

    'disks' => [

        // Rétablit le disque 'local' standard pour les fichiers internes non-publics
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'), // CORRIGÉ : Doit pointer vers storage/app
            'throw' => false,
        ],

        // Le disque 'public' reste standard pour les fichiers accessibles par URL
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        // NOUVEAU DISQUE : 'private' pour les documents sensibles (devis, rapports clients).
        // Utilisé par ContenuFicheController pour les téléchargements sécurisés.
        'private' => [ 
            'driver' => 'local',
            'root' => storage_path('app/private'), // Pointe vers storage/app/private
            'permissions' => [
                'file' => ['public' => 0664, 'private' => 0600],
                'dir' => ['public' => 0775, 'private' => 0700],
            ],
            'throw' => false,
        ],
        
        // La configuration S3 est conservée
        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];