<?php

return [
    'openai_api_key' => env('OPENAI_API_KEY'),
    'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    'ollama_url' => env('OLLAMA_URL', 'http://localhost:11434'),
    'ollama_model' => env('OLLAMA_MODEL', 'mistral'),
];
