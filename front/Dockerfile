# ═══════════════════════════════════════════════════════════════
# Dockerfile pour le Frontend Next.js - CRM NetStrategy
# ═══════════════════════════════════════════════════════════════

# Étape 1: Construction (Build)
FROM node:20-alpine AS builder

LABEL maintainer="CRM NetStrategy"
LABEL description="Frontend Next.js pour CRM"

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm ci --prefer-offline --no-audit

# Copier le code source
COPY . .

# Build de l'application Next.js
RUN npm run build

# Étape 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Variables d'environnement pour la production
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Définir les permissions
RUN chown -R nextjs:nodejs /app

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]
