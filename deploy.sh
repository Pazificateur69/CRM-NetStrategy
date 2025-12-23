#!/bin/bash

# 🚀 NetStrategy CRM - One-Click Magic Deploy
# Ce script automatise le déploiement complet (API + Front)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting One-Click Deployment...${NC}"

# 1. Dossier API (Backend)
if [ -d "api" ]; then
    echo -e "${YELLOW}--- Updating Backend (API) ---${NC}"
    cd api
    
    # Dependencies
    composer install --optimize-autoloader --no-dev
    
    # Environment
    if [ ! -f .env ]; then
        echo -e "${RED}Warning: .env missing in api/. Copying from .env.example...${NC}"
        cp .env.example .env
        php artisan key:generate
    fi
    
    # Database
    php artisan migrate --force
    php artisan db:seed --class=RolePermissionSeeder --force
    
    # Cache Optimization
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    # Permissions
    chmod -R 775 storage bootstrap/cache
    
    cd ..
    echo -e "${GREEN}✓ Backend Updated${NC}"
else
    echo -e "${RED}Error: 'api' directory not found.${NC}"
fi

# 2. Dossier Front (Next.js)
if [ -d "front" ]; then
    echo -e "${YELLOW}--- Updating Frontend (Next.js) ---${NC}"
    cd front
    
    # Dependencies
    npm install
    
    # Build
    npm run build
    
    # Restart PM2 if available
    if command -v pm2 &> /dev/null; then
        pm2 restart crm-frontend || pm2 start "npm run start" --name "crm-frontend" --env production
    fi
    
    cd ..
    echo -e "${GREEN}✓ Frontend Updated${NC}"
else
    echo -e "${RED}Error: 'front' directory not found.${NC}"
fi

# 3. Laravel Reverb (WebSockets)
if command -v pm2 &> /dev/null && [ -d "api" ]; then
    echo -e "${YELLOW}--- Restarting WebSockets (Reverb) ---${NC}"
    pm2 restart crm-reverb || pm2 start php --name "crm-reverb" -- api/artisan reverb:start --host=0.0.0.0 --port=8080
    echo -e "${GREEN}✓ Reverb Restarted${NC}"
fi

echo -e "${GREEN}🚀 DEPLOYMENT SUCCESSFUL!${NC}"
echo "Your CRM is now up to date."
