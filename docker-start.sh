#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}🐳 CRM NetStrategy – Déploiement Docker${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────
# 1. Vérifications
# ─────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Vérification des prérequis...${NC}"

command -v docker >/dev/null || { echo -e "${RED}Docker manquant${NC}"; exit 1; }
command -v docker-compose >/dev/null || { echo -e "${RED}Docker Compose manquant${NC}"; exit 1; }

echo -e "${GREEN}✓ Docker OK${NC}"
echo -e "${GREEN}✓ Docker Compose OK${NC}"
echo ""

# ─────────────────────────────────────────────
# 2. Build & démarrage
# ─────────────────────────────────────────────
echo -e "${YELLOW}[2/4] Build & démarrage des conteneurs...${NC}"

docker-compose up -d --build

echo -e "${GREEN}✓ Conteneurs lancés${NC}"
echo ""

# ─────────────────────────────────────────────
# 3. Initialisation Laravel
# ─────────────────────────────────────────────
echo -e "${YELLOW}[3/4] Initialisation Laravel...${NC}"

sleep 8

docker-compose exec -T api php artisan key:generate || true
docker-compose exec -T api php artisan migrate --force
docker-compose exec -T api php artisan config:clear
docker-compose exec -T api php artisan route:clear

echo -e "${GREEN}✓ Laravel prêt${NC}"
echo ""


# ─────────────────────────────────────────────
# 5. Vérification santé
# ─────────────────────────────────────────────
echo -e "${YELLOW}[4/4] Vérification des services...${NC}"

# Attendre que Nginx réponde sur 8080
echo -n "⏳ Attente CRM (http://localhost:8080)... "
for i in {1..60}; do
    if curl -s http://localhost:8080 >/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        break
    fi
    sleep 1
done

echo ""

# ─────────────────────────────────────────────
# 6. Récap
# ─────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Accès :"
echo "• CRM : http://localhost:8080"
echo ""
echo "📋 Commandes utiles :"
echo "• Logs      : docker-compose logs -f"
echo "• Stop      : docker-compose down"
echo "• Restart   : docker-compose restart"
echo ""
docker-compose ps
echo ""
echo "═══════════════════════════════════════════════════════════════"
