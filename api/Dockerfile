# ═══════════════════════════════════════════════════════════════
# Dockerfile pour l'API Laravel - CRM NetStrategy
# ═══════════════════════════════════════════════════════════════

FROM php:8.2-fpm-alpine

# Métadonnées
LABEL maintainer="CRM NetStrategy"
LABEL description="API Laravel pour CRM"

# Installation des dépendances système
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    sqlite \
    sqlite-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    bash \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_sqlite \
        mbstring \
        zip \
        bcmath \
        gd \
        opcache

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configuration PHP pour la production
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'upload_max_filesize=10M'; \
    echo 'post_max_size=10M'; \
    echo 'max_execution_time=300'; \
    echo 'memory_limit=256M'; \
    echo 'expose_php=Off'; \
} > /usr/local/etc/php/conf.d/production.ini

# Créer le répertoire de l'application
WORKDIR /var/www/html

# Copier les fichiers de dépendances
COPY composer.json composer.lock ./

# Installer les dépendances PHP (sans dev pour la production)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copier tout le code source
COPY . .

# Finaliser l'installation de Composer
RUN composer dump-autoload --optimize --classmap-authoritative

# Créer le répertoire de la base de données SQLite
RUN mkdir -p /var/www/html/database && \
    touch /var/www/html/database/database.sqlite

# Définir les permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Configuration Nginx
RUN rm -f /etc/nginx/http.d/default.conf
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Configuration Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Exposer le port
EXPOSE 80

# Script d'entrée
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
