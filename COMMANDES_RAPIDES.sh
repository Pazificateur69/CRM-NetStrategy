#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CRM NetStrategy - Commandes Rapides de Déploiement
# ═══════════════════════════════════════════════════════════════
# Ce fichier contient toutes les commandes nécessaires au déploiement
# À exécuter sur le serveur de production

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 CRM NetStrategy - Script de Déploiement"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. INSTALLATION DES DÉPENDANCES SERVEUR
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[1/8] Installation des dépendances serveur...${NC}"

# Mise à jour système
sudo apt update && sudo apt upgrade -y

# PHP 8.2 et extensions
sudo apt install -y php8.2-fpm php8.2-cli php8.2-common \
    php8.2-sqlite3 php8.2-curl php8.2-mbstring \
    php8.2-xml php8.2-zip php8.2-bcmath php8.2-gd

# Composer
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
fi

# Nginx
sudo apt install -y nginx

# Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# Node.js via nvm (si pas déjà installé)
if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install 18
    nvm use 18
fi

# PM2 pour Next.js
npm install -g pm2

echo -e "${GREEN}✓ Dépendances installées${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CONFIGURATION PHP
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[2/8] Configuration PHP...${NC}"

# Modifier php.ini
sudo sed -i 's/upload_max_filesize = .*/upload_max_filesize = 10M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/post_max_size = .*/post_max_size = 10M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/max_execution_time = .*/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/memory_limit = .*/memory_limit = 256M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/expose_php = .*/expose_php = Off/' /etc/php/8.2/fpm/php.ini

# Redémarrer PHP-FPM
sudo systemctl restart php8.2-fpm

echo -e "${GREEN}✓ PHP configuré${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. DÉPLOIEMENT BACKEND
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[3/8] Déploiement backend Laravel...${NC}"

# Créer le dossier du projet
sudo mkdir -p /var/www/crm
cd /var/www/crm

# NOTE : Cloner depuis Git ou transférer via SFTP
# git clone https://github.com/votre-compte/crm.git .

cd /var/www/crm/api

# Installer dépendances PHP
composer install --optimize-autoloader --no-dev

# Copier .env (À CONFIGURER MANUELLEMENT)
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  ATTENTION : Vous devez créer et configurer le fichier .env${NC}"
    echo -e "${RED}   Utilisez api/.env.production.example comme modèle${NC}"
    echo ""
    echo "Appuyez sur ENTRÉE après avoir configuré .env..."
    read
fi

# Générer clé application
php artisan key:generate --force

# Créer la base SQLite (si utilisée)
touch /var/www/crm/api/database/database.sqlite

# Lancer migrations
php artisan migrate --force

# Créer les rôles et permissions
php artisan db:seed --class=RolePermissionSeeder --force

# Optimiser
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permissions
sudo chown -R www-data:www-data /var/www/crm/api
sudo chmod -R 755 /var/www/crm/api
sudo chmod -R 775 /var/www/crm/api/storage
sudo chmod -R 775 /var/www/crm/api/bootstrap/cache

echo -e "${GREEN}✓ Backend déployé${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 4. CONFIGURATION NGINX
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[4/8] Configuration Nginx...${NC}"

# Copier la configuration
sudo cp /var/www/crm/nginx-production.conf /etc/nginx/sites-available/crm

# NOTE : Adapter le domaine dans le fichier
echo -e "${RED}⚠️  ATTENTION : Éditez /etc/nginx/sites-available/crm${NC}"
echo -e "${RED}   Remplacez 'votre-domaine.com' par votre domaine réel${NC}"
echo ""
echo "Appuyez sur ENTRÉE après avoir modifié le fichier..."
read

# Activer le site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

echo -e "${GREEN}✓ Nginx configuré${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 5. CERTIFICATS SSL
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[5/8] Génération certificats SSL...${NC}"

echo "Entrez votre domaine API (ex: api.votre-domaine.com):"
read DOMAIN_API

echo "Entrez votre domaine frontend (ex: votre-domaine.com):"
read DOMAIN_FRONT

# Générer certificats
sudo certbot --nginx -d $DOMAIN_API
sudo certbot --nginx -d $DOMAIN_FRONT -d www.$DOMAIN_FRONT

# Redémarrer Nginx
sudo systemctl restart nginx

echo -e "${GREEN}✓ SSL configuré${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 6. DÉPLOIEMENT FRONTEND
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[6/8] Déploiement frontend Next.js...${NC}"

cd /var/www/crm/front

# Créer .env.production (À CONFIGURER)
if [ ! -f .env.production ]; then
    echo -e "${RED}⚠️  ATTENTION : Créez le fichier .env.production${NC}"
    echo -e "${RED}   Contenu : NEXT_PUBLIC_API_URL=https://$DOMAIN_API/api${NC}"
    echo ""
    echo "Appuyez sur ENTRÉE après avoir créé .env.production..."
    read
fi

# Installer dépendances
npm ci --production=false

# Build
npm run build

# Démarrer avec PM2
pm2 start npm --name "crm-frontend" -- start

# Sauvegarder config PM2
pm2 save
pm2 startup

echo -e "${GREEN}✓ Frontend déployé${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 7. SÉCURITÉ
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[7/8] Configuration firewall et sécurité...${NC}"

# UFW
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000

# Fail2Ban
sudo apt install -y fail2ban

# Configuration Fail2Ban pour Laravel
sudo tee /etc/fail2ban/filter.d/laravel.conf > /dev/null <<EOF
[Definition]
failregex = .*"POST .*\/api\/login.*" 401.*
            .*"POST .*\/api\/login.*" 429.*
ignoreregex =
EOF

sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[laravel]
enabled = true
port = http,https
filter = laravel
logpath = /var/www/crm/api/storage/logs/laravel.log
maxretry = 5
bantime = 3600
EOF

sudo systemctl restart fail2ban

echo -e "${GREEN}✓ Sécurité configurée${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 8. VÉRIFICATIONS FINALES
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[8/8] Vérifications finales...${NC}"

echo ""
echo "Vérification des services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PHP-FPM
if systemctl is-active --quiet php8.2-fpm; then
    echo -e "${GREEN}✓ PHP-FPM actif${NC}"
else
    echo -e "${RED}✗ PHP-FPM inactif${NC}"
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx actif${NC}"
else
    echo -e "${RED}✗ Nginx inactif${NC}"
fi

# PM2
if pm2 list | grep -q "crm-frontend"; then
    echo -e "${GREEN}✓ Next.js actif (PM2)${NC}"
else
    echo -e "${RED}✗ Next.js inactif${NC}"
fi

# Fail2Ban
if systemctl is-active --quiet fail2ban; then
    echo -e "${GREEN}✓ Fail2Ban actif${NC}"
else
    echo -e "${RED}✗ Fail2Ban inactif${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DÉPLOIEMENT TERMINÉ !${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Prochaines étapes :"
echo "  1. Testez l'accès : https://$DOMAIN_FRONT"
echo "  2. Validez PRODUCTION_CHECKLIST.md"
echo "  3. Configurez backups automatiques"
echo "  4. Installez monitoring (Sentry, Netdata)"
echo ""
echo "Logs importants :"
echo "  • Laravel : /var/www/crm/api/storage/logs/laravel.log"
echo "  • Nginx : /var/log/nginx/crm-*-error.log"
echo "  • PM2 : pm2 logs crm-frontend"
echo ""
echo "═══════════════════════════════════════════════════════════════"