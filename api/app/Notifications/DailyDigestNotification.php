<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyDigestNotification extends Notification
{
    use Queueable;

    public $data;

    /**
     * Create a new notification instance.
     * $data contains ['overdue' => [], 'tomorrow' => [], 'reminders' => []]
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('📅 Votre récapitulatif du soir - CRM')
            ->greeting('Bonsoir ' . $notifiable->name . ' !')
            ->line('Voici le bilan pour préparer votre journée de demain :');

        if (!empty($this->data['overdue']) && count($this->data['overdue']) > 0) {
            $message->line('🔴 **Tâches en retard (' . count($this->data['overdue']) . ') :**');
            foreach (array_slice($this->data['overdue'], 0, 3) as $task) {
                $message->line('- ' . $task->titre);
            }
            if (count($this->data['overdue']) > 3) {
                $message->line('... et ' . (count($this->data['overdue']) - 3) . ' autres.');
            }
            $message->line('');
        }

        if (!empty($this->data['tomorrow']) && count($this->data['tomorrow']) > 0) {
            $message->line('🟢 **À faire demain (' . count($this->data['tomorrow']) . ') :**');
            foreach (array_slice($this->data['tomorrow'], 0, 3) as $task) {
                $message->line('- ' . $task->titre);
            }
            $message->line('');
        }

        if (!empty($this->data['reminders']) && count($this->data['reminders']) > 0) {
            $message->line('⏰ **Rappels pour demain (' . count($this->data['reminders']) . ') :**');
            foreach (array_slice($this->data['reminders'], 0, 3) as $rem) {
                $message->line('- ' . $rem->titre . ' (' . ($rem->date_echeance ? date('H:i', strtotime($rem->date_echeance)) : 'Journée') . ')');
            }
        }

        if (empty($this->data['overdue']) && empty($this->data['tomorrow']) && empty($this->data['reminders'])) {
            $message->line('✅ Rien de spécial à signaler. Tout est à jour !');
        }

        return $message
            ->action('Accéder au CRM', url('/dashboard'))
            ->line('Bonne soirée et à demain !');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'daily_digest',
            'summary' => 'Récapitulatif du soir',
            'overdue_count' => count($this->data['overdue'] ?? []),
            'tomorrow_count' => count($this->data['tomorrow'] ?? []),
            'reminders_count' => count($this->data['reminders'] ?? []),
        ];
    }
}
