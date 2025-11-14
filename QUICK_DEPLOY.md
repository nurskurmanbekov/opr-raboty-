# 🚀 Быстрое развертывание на Ubuntu Server

## 📋 Предварительные требования
- Ubuntu 20.04 или выше
- Доступ root или sudo
- Локальный IP: 10.99.7.100
- Внешний IP: 85.113.27.42

---

## 1️⃣ Подготовка системы

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl git build-essential
```

---

## 2️⃣ Установка Node.js 18.x

```bash
# Добавить репозиторий Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Установить Node.js и npm
apt install -y nodejs

# Проверка версии
node --version  # должно быть v18.x или выше
npm --version
```

---

## 3️⃣ Установка PostgreSQL

```bash
# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Отключить SSL для упрощения (опционально)
sed -i "s/ssl = on/ssl = off/" /etc/postgresql/*/main/postgresql.conf

# Настроить аутентификацию
sed -i 's/local   all             postgres                                peer/local   all             postgres                                trust/' /etc/postgresql/*/main/pg_hba.conf

# Запустить PostgreSQL
service postgresql start

# Создать базу данных и пользователя
su - postgres -c "psql -c \"CREATE DATABASE opr_raboty;\""
su - postgres -c "psql -c \"CREATE USER opr_user WITH ENCRYPTED PASSWORD 'opr_secure_password_2024';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE opr_raboty TO opr_user;\""
su - postgres -c "psql -c \"ALTER DATABASE opr_raboty OWNER TO opr_user;\""
su - postgres -c "psql opr_raboty -c \"GRANT ALL ON SCHEMA public TO opr_user;\""
```

---

## 4️⃣ Установка Nginx и PM2

```bash
# Установка Nginx
apt install -y nginx

# Установка PM2 глобально
npm install -g pm2
```

---

## 5️⃣ Клонирование проекта

```bash
# Создать директорию
mkdir -p /home/user
cd /home/user

# Клонировать репозиторий (замените на ваш URL)
git clone https://github.com/nurskurmanbekov/opr-raboty-.git
cd opr-raboty-

# Переключиться на рабочую ветку
git checkout claude/analyze-project-017NU4eVUbQ37K7VLdn3pVFY

# Или клонировать конкретную ветку сразу
# git clone -b claude/analyze-project-017NU4eVUbQ37K7VLdn3pVFY https://github.com/nurskurmanbekov/opr-raboty-.git
```

---

## 6️⃣ Настройка Backend

```bash
cd /home/user/opr-raboty-/backend

# Установить зависимости
npm install

# Создать директории для загрузок
mkdir -p uploads/profiles uploads/faces uploads/qrcodes uploads/work_photos logs

# Создать .env файл
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opr_raboty
DB_USER=opr_user
DB_PASSWORD=opr_secure_password_2024

# JWT
JWT_SECRET=b3f8a9c2d5e7f1a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2
JWT_EXPIRE=7d

# CompreFace API (если не установлен - можно оставить так)
COMPREFACE_API_URL=http://localhost:8000
COMPREFACE_API_KEY=your_compreface_api_key_here

# API Keys
API_KEY=9f2a8b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0

# CORS Origins
CORS_ORIGIN=http://10.99.7.100:8091,http://localhost:8091,http://85.113.27.42:8091,http://85.113.27.42:8090

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Face Recognition
FACE_SIMILARITY_THRESHOLD=0.85
MAX_FACE_ATTEMPTS=10
FACE_BLOCK_DURATION=30
EOF

# Запустить backend через PM2
pm2 start ecosystem.config.js

# Сохранить PM2 конфигурацию
pm2 save

# Настроить автозапуск PM2
pm2 startup systemd
# ВАЖНО: Выполните команду, которую предложит PM2!

# Создать суперадминистратора
node scripts/createSuperadmin.js
```

---

## 7️⃣ Настройка Frontend

```bash
cd /home/user/opr-raboty-/frontend

# Установить зависимости
npm install

# Создать .env.production
cat > .env.production << 'EOF'
VITE_API_URL=http://10.99.7.100:8090/api
VITE_APP_NAME=Департамент пробации КР
EOF

# Собрать для production
npm run build
```

---

## 8️⃣ Настройка Nginx

```bash
# Создать конфигурацию Nginx
cat > /etc/nginx/sites-available/opr-raboty << 'EOF'
# Frontend на порту 8091
server {
    listen 0.0.0.0:8091;
    server_name 10.99.7.100 localhost 85.113.27.42;

    root /home/user/opr-raboty-/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Backend API на порту 8090
server {
    listen 0.0.0.0:8090;
    server_name 85.113.27.42 10.99.7.100;

    client_max_body_size 50M;

    # Proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Serve uploaded files
    location /uploads {
        alias /home/user/opr-raboty-/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
    }

    # CORS headers for mobile app
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
EOF

# Активировать конфигурацию
ln -sf /etc/nginx/sites-available/opr-raboty /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Запустить Nginx
service nginx start
```

---

## 9️⃣ Проверка развертывания

```bash
# Проверить PostgreSQL
service postgresql status

# Проверить Backend (PM2)
pm2 status
pm2 logs opr-raboty-backend --lines 20

# Проверить Nginx
service nginx status

# Проверить порты
ss -tlnp | grep -E "(5000|8090|8091)"

# Тест Frontend
curl -I http://localhost:8091

# Тест Backend API
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@probation.kg","password":"admin123456"}'
```

---

## 🔟 Доступ к системе

### **Учетные данные:**
```
Email:    admin@probation.kg
Пароль:   admin123456
```

⚠️ **ВАЖНО:** Смените пароль после первого входа!

### **URL для доступа:**
- Frontend: http://10.99.7.100:8091 или http://85.113.27.42:8091
- Backend API: http://85.113.27.42:8090/api

---

## 🔄 Команды управления

### PM2 (Backend):
```bash
pm2 list                      # Список процессов
pm2 logs opr-raboty-backend   # Логи
pm2 restart opr-raboty-backend # Перезапуск
pm2 stop opr-raboty-backend   # Остановка
```

### Nginx:
```bash
service nginx status    # Статус
service nginx reload    # Перезагрузка
service nginx restart   # Перезапуск
nginx -t               # Проверка конфигурации
```

### PostgreSQL:
```bash
service postgresql status   # Статус
service postgresql restart  # Перезапуск
```

---

## 🐛 Решение проблем

### Backend не запускается:
```bash
pm2 logs opr-raboty-backend --lines 50
# Проверить .env файл
cat /home/user/opr-raboty-/backend/.env
```

### Nginx 502 Bad Gateway:
```bash
# Проверить что backend работает
pm2 status
curl http://localhost:5000/api/
```

### База данных не подключается:
```bash
# Проверить PostgreSQL
service postgresql status
# Проверить подключение
psql -U opr_user -d opr_raboty -h localhost
```

---

## 🎉 Готово!

Система развернута и готова к работе!

Войдите в веб-интерфейс:
- URL: http://10.99.7.100:8091
- Email: admin@probation.kg
- Пароль: admin123456

**Не забудьте сменить пароль после первого входа!**
