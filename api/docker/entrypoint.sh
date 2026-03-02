#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Démarrage de l'API Laravel - CRM NetStrategy"
echo "═══════════════════════════════════════════════════════════════"

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant. Copie depuis .env.example..."
    cp .env.example .env
fi

# Générer la clé d'application si nécessaire
if grep -q "APP_KEY=$" .env; then
    echo "🔑 Génération de la clé d'application..."
    php artisan key:generate --force
fi

# Créer la base de données SQLite si elle n'existe pas
if [ ! -f /var/www/html/database/database.sqlite ]; then
    echo "📦 Création de la base de données SQLite..."
    touch /var/www/html/database/database.sqlite
fi

# Lancer les migrations
echo "🗄️  Lancement des migrations..."
php artisan migrate --force

# Créer les rôles et permissions
echo "👥 Création des rôles et permissions..."
php artisan db:seed --class=RolePermissionSeeder --force || echo "⚠️  Seeder déjà exécuté"

# Optimisation pour la production
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Optimisation pour la production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Définir les permissions
echo "🔒 Configuration des permissions..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
chmod 664 /var/www/html/database/database.sqlite

echo "✅ API prête à démarrer!"
echo "═══════════════════════════════════════════════════════════════"

# Exécuter la commande passée en paramètre (CMD du Dockerfile)
exec "$@"
