<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .header {
            background: #4f46e5;
            color: #fff;
            padding: 30px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }

        .content {
            padding: 30px;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            display: block;
        }

        .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 5px;
        }

        .list-item {
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
        }

        .footer {
            background: #f8fafc;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Rapport Hebdomadaire 📊</h1>
            <p>Net Strategy - Semaine {{ now()->weekOfYear }}</p>
        </div>

        <div class="content">
            <p>Bonjour {{ $user->name }}, voici les performances de l'équipe cette semaine :</p>

            <div class="stat-grid">
                <div class="stat-card">
                    <span class="stat-value">{{ $stats['tasks_completed'] }}</span>
                    <span class="stat-label">Tâches Terminées</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{ $stats['tasks_created'] }}</span>
                    <span class="stat-label">Nouvelles Tâches</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{ $stats['new_clients'] }}</span>
                    <span class="stat-label">Nouveaux Clients</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{ $stats['new_prospects'] }}</span>
                    <span class="stat-label">Nouveaux Prospects</span>
                </div>
            </div>

            <h3 class="section-title">🏆 Top Productivité</h3>
            @foreach($stats['top_users'] as $topUser)
                <div class="list-item">
                    <strong>{{ $topUser->name }}</strong> : {{ $topUser->completed_count }} tâches terminées
                </div>
            @endforeach

            <h3 class="section-title">⚠️ Points d'attention</h3>
            <div class="list-item">
                Tâches en retard globalement : <strong>{{ $stats['overdue_tasks'] }}</strong>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="{{ config('app.url') }}/dashboard"
                    style="background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Accéder
                    au CRM</a>
            </div>
        </div>

        <div class="footer">
            Ceci est un message automatique généré par votre CRM Net Strategy.
        </div>
    </div>
</body>

</html>