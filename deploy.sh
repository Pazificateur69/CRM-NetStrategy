#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CRM NetStrategy - Deploiement Zero-Config
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./deploy.sh              → Deploiement complet (depuis votre machine)
#   ./deploy.sh --update     → Mise a jour rapide
#   ./deploy.sh --stop       → Arreter les services
#   ./deploy.sh --start      → Redemarrer les services
#   ./deploy.sh --status     → Etat des services
#   ./deploy.sh --logs       → Voir les logs
#   ./deploy.sh --reset      → Reset complet (SUPPRIME LES DONNEES)
#   ./deploy.sh --ssh        → Ouvrir un shell SSH sur le serveur
#   ./deploy.sh --help       → Aide
#
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.deploy-config"
LOG_FILE="$SCRIPT_DIR/.deploy.log"
SSH_SOCKET="/tmp/crm-deploy-ssh-$$"
START_TIME=$(date +%s)

# Defaults
DEFAULT_SSH_USER="root"
DEFAULT_SSH_HOST="monitoring.net-strategy.fr"
DEFAULT_SSH_PORT="22"
DEFAULT_DOMAIN="crm.monitoring.net-strategy.fr"
DEFAULT_NGINX_PORT="8080"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ─────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────
log()     { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}  ✓${NC} $1" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}  ⚠${NC} $1" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}  ✗${NC} $1" | tee -a "$LOG_FILE"; }
step()    { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}" | tee -a "$LOG_FILE"; }

banner() {
    echo -e "${BOLD}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║     CRM NetStrategy - Zero-Config Deploy         ║"
    echo "║     v3.0 - Deploiement automatique Plesk         ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ─────────────────────────────────────────────────────────────
# SSH Multiplexing
# ─────────────────────────────────────────────────────────────
ssh_start() {
    log "Connexion SSH vers ${SSH_USER}@${SSH_HOST}:${SSH_PORT}..."
    if ssh -fNM \
        -S "$SSH_SOCKET" \
        -p "$SSH_PORT" \
        -o ConnectTimeout=10 \
        -o StrictHostKeyChecking=accept-new \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        "${SSH_USER}@${SSH_HOST}" 2>>"$LOG_FILE"; then
        success "Connexion SSH etablie (multiplexee)"
    else
        error "Impossible de se connecter a ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
        error "Verifiez votre cle SSH: ssh ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT}"
        exit 1
    fi
}

ssh_run() {
    ssh -S "$SSH_SOCKET" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "$@"
}

ssh_stop() {
    ssh -S "$SSH_SOCKET" -O exit "${SSH_USER}@${SSH_HOST}" 2>/dev/null || true
    rm -f "$SSH_SOCKET" 2>/dev/null || true
}

rsync_to_server() {
    rsync -az --delete \
        --exclude='.git' \
        --exclude='.git/**' \
        --exclude='node_modules' \
        --exclude='node_modules/**' \
        --exclude='vendor' \
        --exclude='vendor/**' \
        --exclude='.next' \
        --exclude='.next/**' \
        --exclude='.env' \
        --exclude='.env.*' \
        --exclude='.deploy-config' \
        --exclude='.deploy.log' \
        --exclude='deploy.log' \
        --exclude='storage/logs/*' \
        --exclude='storage/framework/sessions/*' \
        --exclude='storage/framework/cache/*' \
        --exclude='.DS_Store' \
        -e "ssh -S $SSH_SOCKET -p $SSH_PORT" \
        "$SCRIPT_DIR/" "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"
}

# Cleanup SSH on exit
trap 'ssh_stop 2>/dev/null; echo "" >> "$LOG_FILE"' EXIT

# ─────────────────────────────────────────────────────────────
# Configuration Management
# ─────────────────────────────────────────────────────────────
config_load() {
    if [ -f "$CONFIG_FILE" ]; then
        # shellcheck disable=SC1090
        source "$CONFIG_FILE"
        return 0
    fi
    return 1
}

config_init() {
    step "Configuration initiale (premiere utilisation)"
    echo ""
    echo -e "${DIM}Appuyez sur Entree pour accepter la valeur par defaut [entre crochets]${NC}"
    echo ""

    # SSH
    read -rp "  SSH User [$DEFAULT_SSH_USER]: " input
    SSH_USER="${input:-$DEFAULT_SSH_USER}"

    read -rp "  SSH Host [$DEFAULT_SSH_HOST]: " input
    SSH_HOST="${input:-$DEFAULT_SSH_HOST}"

    read -rp "  SSH Port [$DEFAULT_SSH_PORT]: " input
    SSH_PORT="${input:-$DEFAULT_SSH_PORT}"

    # Domain
    read -rp "  Domaine [$DEFAULT_DOMAIN]: " input
    DOMAIN="${input:-$DEFAULT_DOMAIN}"

    # Nginx port
    read -rp "  Port Docker Nginx [$DEFAULT_NGINX_PORT]: " input
    NGINX_PORT="${input:-$DEFAULT_NGINX_PORT}"

    # Remote path (auto-detected from Plesk convention)
    REMOTE_PATH="/var/www/vhosts/${SSH_HOST}/${DOMAIN}"

    # Generate secure MySQL passwords
    DB_DATABASE="crm_production"
    DB_USERNAME="crm_user"
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    DB_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)

    echo ""
    echo -e "${BOLD}Configuration:${NC}"
    echo "  SSH:      ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
    echo "  Domaine:  ${DOMAIN}"
    echo "  Path:     ${REMOTE_PATH}"
    echo "  Port:     ${NGINX_PORT}"
    echo "  DB Pass:  ${DB_PASSWORD:0:4}****"
    echo ""

    read -rp "  Confirmer ? [O/n]: " confirm
    if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
        echo "Annule."
        exit 0
    fi

    config_save
    success "Configuration sauvegardee dans .deploy-config"
}

config_save() {
    cat > "$CONFIG_FILE" << EOF
# CRM NetStrategy - Deploy Config (genere automatiquement)
# NE PAS COMMITER CE FICHIER
SSH_USER="${SSH_USER}"
SSH_HOST="${SSH_HOST}"
SSH_PORT="${SSH_PORT}"
DOMAIN="${DOMAIN}"
NGINX_PORT="${NGINX_PORT}"
REMOTE_PATH="${REMOTE_PATH}"
DB_DATABASE="${DB_DATABASE}"
DB_USERNAME="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD}"
EOF
    chmod 600 "$CONFIG_FILE"
}

# ─────────────────────────────────────────────────────────────
# Nettoyage des anciens scripts obsoletes
# ─────────────────────────────────────────────────────────────
cleanup_old_scripts() {
    step "Nettoyage des fichiers obsoletes"

    local old_files=(
        "deploy_to_plesk.sh"
        "deploy-docker.sh"
        "deploy_update.sh"
        "update_crm.sh"
        "plesk_setup.sh"
        "setup-plesk-proxy.sh"
        "DEPLOY_QUICK_START.md"
        "DEPLOY_SINGLE_DOMAIN.md"
        "DOCKER_DEPLOY.md"
        "PLESK_DEPLOY_GUIDE.fr.md"
        "nginx-single-domain.conf"
        "test_auth.sh"
        "test_auth.py"
        "cookies.txt"
        "note.txt"
    )

    local removed=0
    for f in "${old_files[@]}"; do
        if [ -f "$SCRIPT_DIR/$f" ]; then
            rm -f "$SCRIPT_DIR/$f"
            success "Supprime: $f"
            removed=$((removed + 1))
        fi
    done

    if [ $removed -eq 0 ]; then
        success "Aucun fichier obsolete"
    else
        success "$removed fichiers obsoletes supprimes"
    fi
}

# ─────────────────────────────────────────────────────────────
# Prerequis locaux
# ─────────────────────────────────────────────────────────────
check_local_prereqs() {
    step "Verification des prerequis locaux"

    local missing=0

    if command -v ssh &>/dev/null; then
        success "SSH disponible"
    else
        error "ssh non installe"
        missing=1
    fi

    if command -v rsync &>/dev/null; then
        success "rsync disponible"
    else
        error "rsync non installe"
        missing=1
    fi

    if [ $missing -ne 0 ]; then
        error "Installez les prerequis manquants."
        exit 1
    fi
}

# ─────────────────────────────────────────────────────────────
# Installation Docker sur le serveur
# ─────────────────────────────────────────────────────────────
remote_install_docker() {
    step "Verification de Docker sur le serveur"

    if ssh_run "command -v docker" &>/dev/null; then
        local docker_version
        docker_version=$(ssh_run "docker --version 2>/dev/null" | head -1)
        success "Docker: $docker_version"
    else
        log "Docker absent, installation..."
        ssh_run "curl -fsSL https://get.docker.com | sh" 2>>"$LOG_FILE"
        ssh_run "systemctl enable docker && systemctl start docker" 2>>"$LOG_FILE"
        success "Docker installe et demarre"
    fi

    # Verifier Docker Compose
    if ssh_run "docker compose version" &>/dev/null; then
        success "Docker Compose disponible"
    else
        error "Docker Compose non disponible sur le serveur"
        exit 1
    fi

    # Verifier que le daemon tourne
    if ssh_run "docker info" &>/dev/null; then
        success "Docker daemon actif"
    else
        ssh_run "systemctl start docker" 2>>"$LOG_FILE"
        sleep 2
        if ssh_run "docker info" &>/dev/null; then
            success "Docker daemon demarre"
        else
            error "Docker daemon ne repond pas"
            exit 1
        fi
    fi
}

# ─────────────────────────────────────────────────────────────
# Synchronisation du code
# ─────────────────────────────────────────────────────────────
sync_code() {
    step "Synchronisation du code vers le serveur"

    # Creer le repertoire distant si absent
    ssh_run "mkdir -p '${REMOTE_PATH}'" 2>>"$LOG_FILE"

    log "rsync en cours..."
    rsync_to_server 2>>"$LOG_FILE"
    success "Code synchronise vers ${REMOTE_PATH}"
}

# ─────────────────────────────────────────────────────────────
# Generation des fichiers .env sur le serveur
# ─────────────────────────────────────────────────────────────
remote_generate_env() {
    step "Generation des fichiers d'environnement"

    # Preserver l'APP_KEY existante
    local existing_key=""
    existing_key=$(ssh_run "grep '^APP_KEY=' '${REMOTE_PATH}/api/.env' 2>/dev/null | cut -d= -f2-" || true)

    # --- api/.env (securite complete) ---
    log "Generation de api/.env..."
    ssh_run "cat > '${REMOTE_PATH}/api/.env'" << ENVEOF
APP_NAME="NetStrategy CRM"
APP_ENV=production
APP_KEY=${existing_key:-}
APP_DEBUG=false
APP_URL=https://${DOMAIN}

FRONTEND_URL=https://${DOMAIN}
SANCTUM_STATEFUL_DOMAINS=${DOMAIN}
SESSION_DOMAIN=${DOMAIN}

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true
SESSION_PATH=/

CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=crm-local
REVERB_APP_KEY=crm-key
REVERB_APP_SECRET=crm-secret
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=http

FILESYSTEM_DISK=local

MAIL_MAILER=log
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@${DOMAIN}
MAIL_FROM_NAME="\${APP_NAME}"

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

LOG_CHANNEL=stack
LOG_LEVEL=error
ENVEOF
    success "api/.env genere (securite: encrypt=true, secure_cookie=true, same_site=lax)"

    # --- .env.docker ---
    log "Generation de .env.docker..."
    ssh_run "cat > '${REMOTE_PATH}/.env.docker'" << DENVEOF
DOMAIN=${DOMAIN}
NGINX_PORT=${NGINX_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DENVEOF
    success ".env.docker genere"
}

# ─────────────────────────────────────────────────────────────
# Build des images Docker
# ─────────────────────────────────────────────────────────────
remote_build() {
    step "Construction des images Docker (sur le serveur)"

    log "Build API (Laravel + PHP 8.3 + sodium + intl + bcmath)..."
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker build api" 2>>"$LOG_FILE"
    success "Image API construite"

    log "Build Frontend (Next.js standalone, non-root)..."
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker build frontend" 2>>"$LOG_FILE"
    success "Image Frontend construite"
}

# ─────────────────────────────────────────────────────────────
# Deploiement (demarrage ordonne)
# ─────────────────────────────────────────────────────────────
remote_deploy() {
    step "Demarrage des services"

    local compose_cmd="cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker"

    # 1. MySQL + Redis
    log "Lancement MySQL + Redis..."
    ssh_run "$compose_cmd up -d db redis" 2>>"$LOG_FILE"

    # Attendre MySQL
    log "Attente de MySQL..."
    local try=0
    while [ $try -lt 60 ]; do
        if ssh_run "docker exec crm_db mysqladmin ping -h localhost -u root -p'${DB_ROOT_PASSWORD}' --silent" &>/dev/null; then
            echo ""
            success "MySQL pret"
            break
        fi
        try=$((try + 1))
        echo -ne "\r  Tentative $try/60..."
        sleep 2
    done
    if [ $try -ge 60 ]; then
        echo ""
        error "MySQL timeout"
        ssh_run "docker logs --tail=20 crm_db" 2>/dev/null || true
        exit 1
    fi

    # 2. API (migrations + seeders via entrypoint)
    log "Lancement API (migrations + seeders automatiques)..."
    ssh_run "$compose_cmd up -d api" 2>>"$LOG_FILE"

    log "Attente fin des migrations..."
    local api_try=0
    while [ $api_try -lt 120 ]; do
        if ssh_run "docker exec crm_api pgrep -f 'php-fpm: master'" &>/dev/null; then
            echo ""
            success "API prete (migrations + seeders termines)"
            break
        fi
        # Verifier si le conteneur a plante
        local container_running
        container_running=$(ssh_run "docker inspect --format='{{.State.Running}}' crm_api 2>/dev/null" || echo "false")
        if [ "$container_running" != "true" ]; then
            echo ""
            error "Le conteneur API a plante !"
            ssh_run "docker logs --tail=30 crm_api" 2>/dev/null || true
            exit 1
        fi
        api_try=$((api_try + 1))
        echo -ne "\r  Attente $api_try/120..."
        sleep 2
    done
    if [ $api_try -ge 120 ]; then
        echo ""
        error "API timeout (migrations trop longues ?)"
        ssh_run "docker logs --tail=30 crm_api" 2>/dev/null || true
        exit 1
    fi

    # 3. Frontend + Nginx
    log "Lancement Frontend + Nginx..."
    ssh_run "$compose_cmd up -d frontend nginx" 2>>"$LOG_FILE"

    # Attendre que nginx soit up
    sleep 5
    success "Tous les services sont lances"
}

# ─────────────────────────────────────────────────────────────
# Mise a jour (rebuild + restart)
# ─────────────────────────────────────────────────────────────
remote_update() {
    step "Mise a jour du CRM"

    local compose_cmd="cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker"

    log "Reconstruction des images..."
    ssh_run "$compose_cmd build api frontend" 2>>"$LOG_FILE"
    success "Images reconstruites"

    log "Redemarrage des services..."
    ssh_run "$compose_cmd up -d" 2>>"$LOG_FILE"

    log "Attente de l'API..."
    local t=0
    while [ $t -lt 90 ]; do
        if ssh_run "docker exec crm_api pgrep -f 'php-fpm: master'" &>/dev/null; then
            echo ""
            success "API prete"
            break
        fi
        t=$((t + 1))
        echo -ne "\r  $t/90..."
        sleep 2
    done
    echo ""
}

# ─────────────────────────────────────────────────────────────
# Configuration automatique du proxy Plesk
# ─────────────────────────────────────────────────────────────
remote_configure_plesk() {
    step "Configuration du proxy Plesk"

    local vhost_dir="/var/www/vhosts/system/${DOMAIN}/conf"
    local vhost_file="${vhost_dir}/vhost_nginx.conf"

    # Verifier si Plesk est present
    if ! ssh_run "test -d /var/www/vhosts/system" 2>/dev/null; then
        warn "Plesk non detecte, configuration proxy ignoree"
        warn "Configurez manuellement le reverse proxy vers localhost:${NGINX_PORT}"
        return 0
    fi

    # Creer le repertoire si absent
    ssh_run "mkdir -p '${vhost_dir}'" 2>>"$LOG_FILE"

    # Ecrire la config nginx pour Plesk
    log "Ecriture de ${vhost_file}..."
    ssh_run "cat > '${vhost_file}'" << NGINXEOF
# CRM NetStrategy - Plesk Proxy (genere par deploy.sh)
# Ne pas modifier manuellement

location / {
    proxy_pass http://127.0.0.1:${NGINX_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    client_max_body_size 100M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
NGINXEOF
    success "Proxy Plesk configure (port ${NGINX_PORT})"

    # Reload nginx
    log "Reload nginx Plesk..."
    if ssh_run "nginx -t" &>/dev/null; then
        ssh_run "systemctl reload nginx" 2>>"$LOG_FILE"
        success "Nginx reloaded"
    else
        warn "Config nginx invalide, verifiez manuellement:"
        ssh_run "nginx -t" 2>&1 | tee -a "$LOG_FILE" || true
    fi
}

# ─────────────────────────────────────────────────────────────
# Health checks complets
# ─────────────────────────────────────────────────────────────
remote_health_check() {
    step "Verification de sante"

    local all_ok=1

    # Conteneurs
    local services=("crm_db" "crm_redis" "crm_api" "crm_front" "crm_nginx")
    local labels=("MySQL 8.0" "Redis 7" "API Laravel (PHP 8.3)" "Frontend Next.js" "Nginx Reverse Proxy")

    for i in "${!services[@]}"; do
        local status
        status=$(ssh_run "docker inspect --format='{{.State.Status}}' '${services[$i]}'" 2>/dev/null || echo "absent")
        if [ "$status" = "running" ]; then
            success "${labels[$i]}: running"
        else
            error "${labels[$i]}: $status"
            all_ok=0
        fi
    done

    # HTTP health checks
    echo ""
    log "Tests HTTP..."

    # /health endpoint
    local health_code
    health_code=$(ssh_run "curl -s -o /dev/null -w '%{http_code}' 'http://localhost:${NGINX_PORT}/health'" 2>/dev/null || echo "000")
    if [ "$health_code" = "200" ]; then
        success "GET /health -> 200 OK"
    else
        error "GET /health -> $health_code"
        all_ok=0
    fi

    # API CSRF cookie (Sanctum)
    local api_code
    api_code=$(ssh_run "curl -s -o /dev/null -w '%{http_code}' 'http://localhost:${NGINX_PORT}/sanctum/csrf-cookie'" 2>/dev/null || echo "000")
    if [ "$api_code" = "204" ] || [ "$api_code" = "200" ]; then
        success "GET /sanctum/csrf-cookie -> $api_code (Sanctum OK)"
    else
        warn "GET /sanctum/csrf-cookie -> $api_code"
    fi

    # Frontend
    local front_code
    front_code=$(ssh_run "curl -s -o /dev/null -w '%{http_code}' 'http://localhost:${NGINX_PORT}/'" 2>/dev/null || echo "000")
    if [ "$front_code" = "200" ] || [ "$front_code" = "302" ] || [ "$front_code" = "307" ]; then
        success "GET / -> $front_code (Frontend OK)"
    else
        warn "GET / -> $front_code"
    fi

    # Resume
    local elapsed=$(( $(date +%s) - START_TIME ))
    echo ""

    if [ $all_ok -eq 1 ]; then
        echo -e "${GREEN}${BOLD}"
        echo "╔══════════════════════════════════════════════════╗"
        echo "║          DEPLOIEMENT REUSSI !                    ║"
        echo "╚══════════════════════════════════════════════════╝"
        echo -e "${NC}"
        echo ""
        echo "  URL:    https://${DOMAIN}"
        echo "  Temps:  ${elapsed}s"
        echo ""
        echo "  Securite:"
        echo "    - Cookies chiffres (SESSION_ENCRYPT=true)"
        echo "    - HTTPS only (SESSION_SECURE_COOKIE=true)"
        echo "    - SameSite=lax, HttpOnly=true"
        echo "    - PHP sodium extension active"
        echo "    - Security headers (X-Frame, X-Content-Type, XSS)"
        echo "    - Frontend non-root user"
        echo "    - Redis cache + OPcache actifs"
        echo ""
        echo "  Commandes utiles:"
        echo "    ./deploy.sh --status   Etat des services"
        echo "    ./deploy.sh --logs     Logs temps reel"
        echo "    ./deploy.sh --update   Mise a jour"
        echo "    ./deploy.sh --ssh      Shell serveur"
        echo ""
    else
        echo -e "${YELLOW}${BOLD}"
        echo "╔══════════════════════════════════════════════════╗"
        echo "║    DEPLOIEMENT PARTIEL - Verifiez les logs       ║"
        echo "╚══════════════════════════════════════════════════╝"
        echo -e "${NC}"
        echo ""
        echo "  Diagnostic:"
        echo "    ./deploy.sh --logs     Voir les logs"
        echo "    ./deploy.sh --ssh      Acceder au serveur"
        echo "    ./deploy.sh --status   Etat des conteneurs"
        echo ""
    fi
}

# ─────────────────────────────────────────────────────────────
# Commandes
# ─────────────────────────────────────────────────────────────
cmd_deploy() {
    banner
    echo "" > "$LOG_FILE"

    # Config
    if ! config_load; then
        config_init
    fi

    check_local_prereqs
    cleanup_old_scripts
    ssh_start
    remote_install_docker
    sync_code
    remote_generate_env
    remote_build

    # Detecter update vs fresh
    local is_running
    is_running=$(ssh_run "docker inspect --format='{{.State.Running}}' crm_api 2>/dev/null" || echo "false")

    if [ "$is_running" = "true" ]; then
        log "Services existants detectes -> mise a jour"
        remote_update
    else
        remote_deploy
    fi

    remote_configure_plesk
    remote_health_check
}

cmd_update() {
    banner

    if ! config_load; then
        error "Pas de configuration. Lancez d'abord: ./deploy.sh"
        exit 1
    fi

    echo "" > "$LOG_FILE"
    ssh_start
    cleanup_old_scripts
    sync_code
    remote_generate_env
    remote_build
    remote_update
    remote_health_check
}

cmd_stop() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    banner
    ssh_start
    step "Arret des services"
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker down" 2>>"$LOG_FILE"
    success "Services arretes"
}

cmd_start() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    banner
    ssh_start
    step "Redemarrage des services"
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker up -d" 2>>"$LOG_FILE"

    log "Attente de l'API..."
    local t=0
    while [ $t -lt 90 ]; do
        if ssh_run "docker exec crm_api pgrep -f 'php-fpm: master'" &>/dev/null; then
            echo ""
            success "API prete"
            break
        fi
        t=$((t + 1))
        echo -ne "\r  $t/90..."
        sleep 2
    done
    echo ""
    success "Services redemarres"
}

cmd_status() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    banner
    ssh_start
    step "Etat des services sur ${SSH_HOST}"
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker ps"
}

cmd_logs() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    ssh_start
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker logs -f --tail=100"
}

cmd_reset() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    banner
    echo -e "${RED}${BOLD}"
    echo "  ATTENTION: Ceci va SUPPRIMER toutes les donnees !"
    echo "  (base de donnees, fichiers uploades, cache)"
    echo -e "${NC}"
    read -rp "  Tapez 'RESET' pour confirmer: " confirm
    if [ "$confirm" != "RESET" ]; then
        echo "  Annule."
        exit 0
    fi

    ssh_start
    ssh_run "cd '${REMOTE_PATH}' && docker compose -f docker-compose.production.yml --env-file .env.docker down -v" 2>>"$LOG_FILE"
    success "Volumes supprimes"

    # Relancer un deploy complet
    remote_deploy
    remote_configure_plesk
    remote_health_check
}

cmd_ssh() {
    if ! config_load; then
        error "Pas de configuration."
        exit 1
    fi

    echo -e "${DIM}Connexion SSH vers ${SSH_USER}@${SSH_HOST}...${NC}"
    echo -e "${DIM}Repertoire: ${REMOTE_PATH}${NC}"
    # Use exec to replace current process - no SSH multiplexing needed
    exec ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" -t "cd '${REMOTE_PATH}' && exec \$SHELL -l"
}

# ─────────────────────────────────────────────────────────────
# Point d'entree
# ─────────────────────────────────────────────────────────────
case "${1:-}" in
    --update)  cmd_update ;;
    --stop)    cmd_stop ;;
    --start)   cmd_start ;;
    --status)  cmd_status ;;
    --logs)    cmd_logs ;;
    --reset)   cmd_reset ;;
    --ssh)     cmd_ssh ;;
    --help|-h)
        banner
        echo "Usage: ./deploy.sh [OPTION]"
        echo ""
        echo "  (aucune)     Deploiement complet (build + start)"
        echo "  --update     Mise a jour rapide (sync + rebuild)"
        echo "  --stop       Arreter les services"
        echo "  --start      Redemarrer les services"
        echo "  --status     Etat des services"
        echo "  --logs       Logs temps reel"
        echo "  --reset      Reset complet (SUPPRIME LES DONNEES)"
        echo "  --ssh        Shell SSH sur le serveur"
        echo "  --help       Afficher cette aide"
        echo ""
        echo "Premiere utilisation:"
        echo "  Le script vous demandera les informations SSH."
        echo "  Tout est sauvegarde dans .deploy-config (ne pas commiter)."
        echo ""
        ;;
    *)         cmd_deploy ;;
esac
