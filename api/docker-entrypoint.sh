#!/bin/bash
set -e

echo "================================================"
echo "  CRM NetStrategy API - Initialisation"
echo "================================================"

# ─────────────────────────────────────────────────────────────
# Attendre que MySQL soit pret
# ─────────────────────────────────────────────────────────────
wait_for_db() {
    echo "[1/5] Attente de MySQL..."

    local max_tries=60
    local tries=0

    while [ $tries -lt $max_tries ]; do
        # Tester la connexion via PHP/PDO (plus fiable que mysqladmin)
        if php -r "
            try {
                new PDO(
                    'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306'),
                    getenv('DB_USERNAME'),
                    getenv('DB_PASSWORD'),
                    [PDO::ATTR_TIMEOUT => 3]
                );
                echo 'OK';
                exit(0);
            } catch (Exception \$e) {
                exit(1);
            }
        " 2>/dev/null; then
            echo "  -> MySQL est pret !"
            return 0
        fi

        tries=$((tries + 1))
        echo "  Tentative $tries/$max_tries..."
        sleep 2
    done

    echo "ERREUR: MySQL non disponible apres $max_tries tentatives"
    exit 1
}

# ─────────────────────────────────────────────────────────────
# Generer APP_KEY si absente
# ─────────────────────────────────────────────────────────────
setup_key() {
    echo "[2/5] Verification de la cle d'application..."

    local current_key
    current_key=$(grep '^APP_KEY=' .env 2>/dev/null | cut -d= -f2- || true)

    if [ -z "$current_key" ] || [ "$current_key" = "" ]; then
        echo "  -> Generation d'une nouvelle APP_KEY..."
        php artisan key:generate --force
    else
        echo "  -> APP_KEY existante conservee"
    fi
}

# ─────────────────────────────────────────────────────────────
# Executer les migrations
# ─────────────────────────────────────────────────────────────
run_migrations() {
    echo "[3/5] Execution des migrations..."

    if php artisan migrate --force 2>&1; then
        echo "  -> Migrations OK"
    else
        echo "ERREUR: Les migrations ont echoue"
        echo "  Tentative de correction..."
        # Parfois la table sessions manque, on retente
        sleep 3
        php artisan migrate --force
        echo "  -> Migrations OK (2eme tentative)"
    fi
}

# ─────────────────────────────────────────────────────────────
# Executer les seeders (premiere installation uniquement)
# ─────────────────────────────────────────────────────────────
run_seeders() {
    echo "[4/5] Verification des seeders..."

    # Detecter si c'est la premiere installation en verifiant
    # si la table users existe ET contient des donnees
    local user_count
    user_count=$(php -r "
        try {
            \$pdo = new PDO(
                'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . getenv('DB_DATABASE'),
                getenv('DB_USERNAME'),
                getenv('DB_PASSWORD')
            );
            \$stmt = \$pdo->query('SELECT COUNT(*) FROM users');
            echo \$stmt->fetchColumn();
        } catch (Exception \$e) {
            echo '0';
        }
    " 2>/dev/null || echo "0")

    if [ "$user_count" = "0" ]; then
        echo "  -> Premiere installation detectee, execution des seeders..."
        if php artisan db:seed --force 2>&1; then
            echo "  -> Seeders OK"
        else
            echo "  ATTENTION: Erreur lors du seeding (non bloquant)"
        fi
    else
        echo "  -> Base deja initialisee ($user_count utilisateurs), seeders ignores"
    fi
}

# ─────────────────────────────────────────────────────────────
# Optimisation du cache
# ─────────────────────────────────────────────────────────────
optimize_cache() {
    echo "[5/5] Optimisation..."

    # Creer le lien storage si absent
    if [ ! -L "public/storage" ]; then
        php artisan storage:link 2>/dev/null || true
    fi

    # Cache de production
    php artisan config:cache 2>/dev/null || true
    php artisan route:cache 2>/dev/null || true
    php artisan view:cache 2>/dev/null || true

    echo "  -> Cache optimise"
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

# Fixer les permissions
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Etapes d'initialisation
wait_for_db
setup_key
run_migrations
run_seeders
optimize_cache

echo ""
echo "================================================"
echo "  API prete ! Demarrage de PHP-FPM..."
echo "================================================"
echo ""

# Lancer PHP-FPM (ou la commande passee en argument)
exec "$@"
