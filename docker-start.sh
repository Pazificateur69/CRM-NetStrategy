#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Script de démarrage Docker - CRM NetStrategy
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}  🐳 CRM NetStrategy - Démarrage Docker${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# Vérification des prérequis
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[1/5] Vérification des prérequis...${NC}"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "Installez Docker depuis https://www.docker.com/get-started"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    echo "Installez Docker Compose depuis https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker installé : $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose installé : $(docker-compose --version)${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Configuration de l'environnement
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[2/5] Configuration de l'environnement...${NC}"

# Copier le fichier .env.docker en .env s'il n'existe pas
if [ ! -f .env ]; then
    if [ -f .env.docker ]; then
        cp .env.docker .env
        echo -e "${GREEN}✓ Fichier .env créé depuis .env.docker${NC}"
    else
        echo -e "${RED}❌ Fichier .env.docker introuvable${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Fichier .env existant${NC}"
fi

# Vérifier le fichier .env de l'API
if [ ! -f api/.env ]; then
    if [ -f api/.env.example ]; then
        cp api/.env.example api/.env
        echo -e "${GREEN}✓ Fichier api/.env créé depuis .env.example${NC}"
    else
        echo -e "${YELLOW}⚠️  Fichier api/.env.example introuvable${NC}"
    fi
else
    echo -e "${GREEN}✓ Fichier api/.env existant${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# Construction des images
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[3/5] Construction des images Docker...${NC}"
echo -e "${BLUE}Cette étape peut prendre plusieurs minutes lors de la première exécution${NC}"
echo ""

docker-compose build

echo ""
echo -e "${GREEN}✓ Images construites avec succès${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Démarrage des conteneurs
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[4/5] Démarrage des conteneurs...${NC}"
echo ""

docker-compose up -d

echo ""
echo -e "${GREEN}✓ Conteneurs démarrés${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Attendre que les services soient prêts
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}[5/5] Attente du démarrage des services...${NC}"
echo ""

# Attendre l'API (max 60 secondes)
echo -n "⏳ API Laravel : "
for i in {1..60}; do
    if docker-compose exec -T api wget --no-verbose --tries=1 --spider http://localhost/api/health &> /dev/null; then
        echo -e "${GREEN}✓ Prête${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}✗ Timeout${NC}"
        echo -e "${YELLOW}Vérifiez les logs : docker-compose logs api${NC}"
    fi
    sleep 1
done

# Attendre le frontend (max 60 secondes)
echo -n "⏳ Frontend Next.js : "
for i in {1..60}; do
    if curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${GREEN}✓ Prêt${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}✗ Timeout${NC}"
        echo -e "${YELLOW}Vérifiez les logs : docker-compose logs frontend${NC}"
    fi
    sleep 1
done

echo ""

# ═══════════════════════════════════════════════════════════════
# Récapitulatif
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DÉPLOIEMENT DOCKER RÉUSSI !${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 URLs d'accès :"
echo "  • Frontend : http://localhost:3000"
echo "  • API      : http://localhost:8000/api"
echo ""
echo "📋 Commandes utiles :"
echo "  • Voir les logs        : docker-compose logs -f"
echo "  • Arrêter les services : docker-compose down"
echo "  • Redémarrer           : docker-compose restart"
echo "  • Reconstruire         : docker-compose up -d --build"
echo ""
echo "🔍 État des conteneurs :"
docker-compose ps
echo ""
echo "═══════════════════════════════════════════════════════════════"
