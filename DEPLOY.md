# Guía de despliegue — Tempo (Ubuntu 22.04)

---

## 1. Preparar el servidor

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
CREATE USER tempo WITH PASSWORD 'TuPasswordSegura123';
CREATE DATABASE tempo_prod OWNER tempo;
GRANT ALL PRIVILEGES ON DATABASE tempo_prod TO tempo;
EOF
```

> **Nota:** En Ubuntu con PostgreSQL 16, el servicio real es `postgresql@16-main`.
> Verificar con: `sudo systemctl status 'postgresql@*'`

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
sudo git clone https://github.com/AntauriTheBest/Tempo.git tempo
sudo chown -R $USER:$USER tempo
cd tempo
```

---

## 6. Variables de entorno de la API

```bash
nano /var/www/tempo/apps/api/.env
```

Contenido:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://tempo:TuPasswordSegura123@127.0.0.1:5432/tempo_prod
JWT_SECRET=GENERA_UNO_CON_EL_COMANDO_DE_ABAJO
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
UPLOADS_DIR=/var/www/tempo/uploads
MAX_FILE_SIZE_MB=10
FRONTEND_URL=https://tudominio.com
EMAIL_VERIFICATION_ENABLED=false
SUPERADMIN_EMAIL=tu@email.com

# Stripe (dejar vacío si no está configurado)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

Generar JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 7. Instalar dependencias

```bash
cd /var/www/tempo
npm install
```

---

## 8. Aplicar schema de base de datos

```bash
cd /var/www/tempo/apps/api
npx prisma generate
npx prisma db push
```

> **Importante:** Ejecutar `prisma db push` en cada deploy que incluya cambios de schema.

---

## 9. Compilar

```bash
cd /var/www/tempo

# API (TypeScript → CommonJS)
npm run build --workspace=apps/api

# Frontend (Vite)
npm run build --workspace=apps/web
```

---

## 10. Iniciar la API con PM2

```bash
# IMPORTANTE: --cwd debe apuntar a apps/api para que lea el .env
pm2 delete api 2>/dev/null || true
pm2 start /var/www/tempo/apps/api/dist/server.js \
  --name api \
  --cwd /var/www/tempo/apps/api
pm2 save
pm2 startup   # sigue las instrucciones que imprime
```

Verificar:

```bash
pm2 status
pm2 logs api --lines 20
curl http://localhost:3001/api/auth/me
# Debe devolver: {"success":false,"message":"Access token required"}
```

---

## 11. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/tempo
```

Contenido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/tempo/apps/web/dist;
    index index.html;

    location /uploads/ {
        alias /var/www/tempo/uploads/;
    }

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

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tempo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. Carpeta de uploads

```bash
mkdir -p /var/www/tempo/uploads
chmod 755 /var/www/tempo/uploads
```

---

## 13. Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 14. SSL con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
sudo systemctl reload nginx
```

---

## Actualizar en producción

```bash
cd /var/www/tempo

# Si hay conflictos de archivos locales:
git checkout -- apps/api/package.json package-lock.json

git pull origin master
npm install
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Si hubo cambios de schema de Prisma:
cd apps/api && npx prisma db push && cd ../..

pm2 restart api --update-env
pm2 logs api --lines 15
```

---

## Solución de problemas frecuentes

### Puerto 3001 ocupado
```bash
sudo fuser -k 3001/tcp
pm2 restart api --update-env
```

### API no lee el .env
```bash
pm2 show api | grep cwd
# Debe mostrar: /var/www/tempo/apps/api
# Si no, recrear el proceso:
pm2 delete api
pm2 start /var/www/tempo/apps/api/dist/server.js --name api --cwd /var/www/tempo/apps/api
pm2 save
```

### npm install falla con EOVERRIDE
```bash
git checkout -- package.json package-lock.json
npm install
```

### No puede conectar a la base de datos
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status 'postgresql@*'

# Probar conexión directa
psql -h 127.0.0.1 -U tempo -d tempo_prod -c "SELECT 1"

# Asegurarse de que DATABASE_URL usa 127.0.0.1, no localhost
```

### 500 en rutas nuevas (graph, team-dashboard)
```bash
# Probablemente falta ejecutar prisma db push
cd /var/www/tempo/apps/api
npx prisma db push
pm2 restart api --update-env
```
