#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Script de déploiement CRM NetStrategy sur Plesk
# ═══════════════════════════════════════════════════════════════

set -e

echo "══════════════════════════════════════════════"
echo "  CRM NetStrategy - Déploiement Plesk"
echo "══════════════════════════════════════════════"

# ── Vérifications ─────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installe Docker d'abord."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé."
    exit 1
fi

if [ ! -f .env.plesk ]; then
    echo "❌ Fichier .env.plesk introuvable. Copie et configure-le d'abord."
    exit 1
fi

# ── Vérifier que Supabase tourne ──────────────────────────────
echo ""
echo "📋 Vérification de Supabase self-hosted..."
if docker network inspect supabase_docker_default &> /dev/null; then
    echo "✅ Réseau Supabase détecté"
else
    echo "⚠️  Réseau Supabase non trouvé."
    echo "   Assure-toi que Supabase tourne dans /opt/supabase/docker"
    echo "   → cd /opt/supabase/docker && docker compose up -d"
    echo ""
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ── Build et démarrage ────────────────────────────────────────
echo ""
echo "🔨 Build du frontend Next.js..."
docker compose -f docker-compose.plesk.yml build --no-cache

echo ""
echo "🚀 Démarrage des services..."
docker compose -f docker-compose.plesk.yml up -d

echo ""
echo "⏳ Attente du healthcheck..."
sleep 10

# ── Migrations Prisma ─────────────────────────────────────────
echo ""
echo "📦 Exécution des migrations Prisma..."
docker compose -f docker-compose.plesk.yml exec frontend npx prisma migrate deploy

# ── Cron Jobs ─────────────────────────────────────────────────
echo ""
echo "⏰ Configuration des cron jobs..."
CRON_SECRET=$(grep CRON_SECRET .env.plesk | cut -d '=' -f 2)

# Supprimer les anciens crons CRM
crontab -l 2>/dev/null | grep -v "crm-cron" > /tmp/crontab_clean || true

# Ajouter les nouveaux crons
cat >> /tmp/crontab_clean << CRON
# crm-cron: Vérification des todos en retard (tous les jours à 8h)
0 8 * * * curl -s -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:8080/api/cron/check-overdue > /dev/null 2>&1
# crm-cron: Digest quotidien (lundi-vendredi à 7h)
0 7 * * 1-5 curl -s -H "Authorization: Bearer ${CRON_SECRET}" http://localhost:8080/api/cron/daily-digest > /dev/null 2>&1
CRON

crontab /tmp/crontab_clean
rm /tmp/crontab_clean
echo "✅ Cron jobs installés"

# ── Vérification finale ──────────────────────────────────────
echo ""
echo "🔍 Vérification des services..."
echo ""

if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Nginx        → OK"
else
    echo "❌ Nginx        → KO"
fi

if docker compose -f docker-compose.plesk.yml exec frontend node -e "require('http').get('http://localhost:3000', (r) => { console.log(r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1) })" > /dev/null 2>&1; then
    echo "✅ Next.js      → OK"
else
    echo "❌ Next.js      → KO"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ Déploiement terminé !"
echo "  🌐 CRM accessible sur le port 8080"
echo "  📝 Configure Plesk pour proxifier le port 8080"
echo "══════════════════════════════════════════════"
