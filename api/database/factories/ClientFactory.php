<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'societe' => $this->faker->company(),
            'gerant' => $this->faker->name(),
            'siret' => $this->faker->numerify('###########'),
            'emails' => [$this->faker->companyEmail()],
            'telephones' => [$this->faker->phoneNumber()],
            'contrat' => $this->faker->randomElement(['mensuel', 'annuel', 'aucun']),
        ];
    }
}
