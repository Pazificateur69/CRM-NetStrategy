<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000', 
        // React/Vue/Next sur port 3000
            'http://127.0.0.1:3000', 

        'http://localhost:5173', // Vite standard
        // Ajoutez l'origine exacte de votre front-end ici
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];