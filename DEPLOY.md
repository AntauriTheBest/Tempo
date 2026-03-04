# Guía de despliegue en servidor Linux

Instrucciones para instalar la aplicación en un servidor Ubuntu 22.04 LTS con acceso solo por consola.

---

## 1. Actualizar el servidor

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # debe mostrar v20.x.x
```

---

## 3. Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Crear base de datos y usuario
sudo -u postgres psql <<EOF
CREATE USER tempoalfa WITH PASSWORD 'TuPasswordSegura123';
CREATE DATABASE tempoalfa_prod OWNER tempoalfa;
GRANT ALL PRIVILEGES ON DATABASE tempoalfa_prod TO tempoalfa;
EOF
```

---

## 4. Instalar PM2 y Nginx

```bash
sudo npm install -g pm2
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 5. Clonar el repositorio

```bash
cd /var/www
sudo git clone https://github.com/AntauriTheBest/Tempo.git tempoalfa
sudo chown -R $USER:$USER tempoalfa
cd tempoalfa
```

O si subes el código desde tu PC con rsync:

```bash
# Ejecutar desde tu PC (Git Bash o WSL)
rsync -avz --exclude node_modules --exclude .git \
  "ruta/al/proyecto/" \
  usuario@IP_SERVIDOR:/var/www/tempoalfa/
```

---

## 6. Variables de entorno del API

```bash
cd /var/www/tempoalfa/apps/api
nano .env
```

Contenido:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://tempoalfa:TuPasswordSegura123@127.0.0.1:5432/tempoalfa_prod
JWT_SECRET=GENERA_UNO_CON_EL_COMANDO_DE_ABAJO
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
UPLOADS_DIR=/var/www/tempoalfa/uploads
MAX_FILE_SIZE_MB=10
FRONTEND_URL=https://tudominio.com

# Stripe (dejar vacío si no está configurado aún)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

Generar un JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 7. Variables de entorno del frontend

```bash
cd /var/www/tempoalfa/apps/web
nano .env.production
```

Contenido:

```env
VITE_API_URL=https://tudominio.com/api
```

---

## 8. Instalar dependencias y preparar la base de datos

```bash
cd /var/www/tempoalfa

# Instalar dependencias del monorepo
npm install

# Generar cliente Prisma y aplicar schema
cd apps/api
npx prisma generate
npx prisma db push

# Ejecutar seed (crea organización demo + usuario demo)
npx tsx prisma/seed.ts
```

---

## 9. Compilar el frontend

```bash
cd /var/www/tempoalfa
npm run build --workspace=apps/web
# El output queda en apps/web/dist/
```

---

## 10. Iniciar la API con PM2

```bash
# Crear archivo de configuración PM2
cat > /var/www/tempoalfa/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tempoalfa-api',
    cwd: '/var/www/tempoalfa/apps/api',
    script: 'npx',
    args: 'tsx src/server.ts',
    env: { NODE_ENV: 'production' },
    restart_delay: 3000,
    max_restarts: 10,
  }]
}
EOF

pm2 start /var/www/tempoalfa/ecosystem.config.js
pm2 save
pm2 startup   # sigue las instrucciones que imprime
```

Verificar que está corriendo:

```bash
pm2 status
pm2 logs tempoalfa-api --lines 20
curl http://localhost:3001/api/health
```

---

## 11. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/tempoalfa
```

Contenido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend (archivos estáticos)
    root /var/www/tempoalfa/apps/web/dist;
    index index.html;

    # Uploads
    location /uploads/ {
        alias /var/www/tempoalfa/uploads/;
    }

    # API → proxy al backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        client_max_body_size 15M;
    }

    # SPA fallback — todas las rutas van al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tempoalfa /etc/nginx/sites-enabled/
sudo nginx -t          # verificar sintaxis
sudo systemctl reload nginx
```

---

## 12. SSL con Let's Encrypt (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
sudo systemctl reload nginx
```

---

## 13. Carpeta de uploads

```bash
mkdir -p /var/www/tempoalfa/uploads
chmod 755 /var/www/tempoalfa/uploads
```

---

## 14. Firewall

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## Verificación final

```bash
curl https://tudominio.com/api/health   # debe devolver { "status": "ok" }
curl -I https://tudominio.com           # debe devolver 200
pm2 logs tempoalfa-api                  # logs en tiempo real
```

---

## Actualizaciones futuras

```bash
cd /var/www/tempoalfa
git pull
npm install
npm run build --workspace=apps/web
pm2 restart tempoalfa-api
```

Si hubo cambios en el schema de Prisma:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```
