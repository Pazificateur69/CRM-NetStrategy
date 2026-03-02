# ═══════════════════════════════════════════════════════════════
# Dockerfile pour l'API Laravel - CRM NetStrategy (Production)
# ═══════════════════════════════════════════════════════════════

FROM php:8.3-fpm-alpine AS base

# Métadonnées
LABEL maintainer="CRM NetStrategy"
LABEL description="API Laravel pour CRM - Production"

# Installation des dépendances système
RUN apk add --no-cache \
    curl \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    icu-dev \
    libsodium-dev \
    bash \
    mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        zip \
        bcmath \
        gd \
        opcache \
        pcntl \
        intl \
        sodium

# Installation Redis extension
RUN apk add --no-cache --virtual .build-deps autoconf make g++ \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Configuration PHP pour la production
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'upload_max_filesize=100M'; \
    echo 'post_max_size=100M'; \
    echo 'max_execution_time=300'; \
    echo 'memory_limit=512M'; \
    echo 'expose_php=Off'; \
} > /usr/local/etc/php/conf.d/production.ini

# ═══════════════════════════════════════════════════════════════
# Stage: Builder (install dependencies)
# ═══════════════════════════════════════════════════════════════
FROM base AS builder

WORKDIR /var/www/html

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copier les fichiers de dépendances d'abord (cache layer)
COPY composer.json composer.lock ./

# Installer les dépendances PHP (sans dev pour la production)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copier tout le code source
COPY . .

# Finaliser l'installation de Composer
RUN composer dump-autoload --optimize --classmap-authoritative

# ═══════════════════════════════════════════════════════════════
# Stage: Production
# ═══════════════════════════════════════════════════════════════
FROM base AS production

WORKDIR /var/www/html

# Copier l'application depuis le builder
COPY --from=builder /var/www/html /var/www/html

# Copier le script d'entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Créer les répertoires nécessaires
RUN mkdir -p storage/app/public storage/framework/{sessions,views,cache} bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Exposer le port PHP-FPM
EXPOSE 9000

# Entrypoint avec migrations
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
