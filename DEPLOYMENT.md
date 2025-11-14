# 🚀 Инструкция по развертыванию на Ubuntu Server

## Требования

- Ubuntu 20.04 или выше
- Доступ к серверу через SSH с правами sudo
- Домен или IP адрес

## 1️⃣ Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии
node --version  # должно быть v18.x
npm --version

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2 (процесс-менеджер)
sudo npm install -g pm2

# Установка Git (если еще не установлен)
sudo apt install -y git
```

## 2️⃣ Настройка PostgreSQL

```bash
# Переключиться на пользователя postgres
sudo -u postgres psql

# В PostgreSQL консоли:
CREATE DATABASE opr_raboty;
CREATE USER opr_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE opr_raboty TO opr_user;
\q

# Проверка подключения
psql -U opr_user -d opr_raboty -h localhost
```

## 3️⃣ Клонирование проекта

```bash
# Создать директорию для проектов
cd /var/www
sudo mkdir -p opr-raboty
sudo chown $USER:$USER opr-raboty
cd opr-raboty

# Клонировать репозиторий
git clone https://github.com/nurskurmanbekov/opr-raboty- .
# или
git pull origin claude/analyze-project-017NU4eVUbQ37K7VLdn3pVFY
```

## 4️⃣ Настройка Backend

```bash
cd /var/www/opr-raboty/backend

# Установка зависимостей
npm install

# Создание .env файла
cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opr_raboty
DB_USER=opr_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d

# CompreFace API
COMPREFACE_API_URL=http://localhost:8000
COMPREFACE_API_KEY=your_compreface_api_key

# API Keys
API_KEY=$(openssl rand -base64 32)

# CORS Origins
CORS_ORIGIN=http://your-domain.com,http://85.113.27.42

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Face Recognition
FACE_SIMILARITY_THRESHOLD=0.85
MAX_FACE_ATTEMPTS=10
FACE_BLOCK_DURATION=30
EOF

# Создание директорий для загрузок
mkdir -p uploads/profiles uploads/faces uploads/qrcodes uploads/work_photos

# Запуск миграций базы данных
npm run migrate
# или если нет скрипта миграции:
node server.js  # Sequelize.sync() создаст таблицы

# Создание супер-админа
node scripts/createSuperadmin.js
# или через SQL:
# psql -U opr_user -d opr_raboty
# INSERT INTO users (full_name, email, password, role, phone) VALUES ('Admin', 'admin@example.com', '$2a$10$...', 'superadmin', '+996555000000');
```

## 5️⃣ Настройка Frontend

```bash
cd /var/www/opr-raboty/frontend

# Установка зависимостей
npm install

# Создание .env для production
cat > .env.production << EOF
VITE_API_URL=http://your-domain.com/api
VITE_APP_NAME="Департамент пробации КР"
EOF

# Сборка для production
npm run build

# Результат будет в папке dist/
```

## 6️⃣ Настройка Nginx

```bash
# Создать конфигурацию Nginx
sudo nano /etc/nginx/sites-available/opr-raboty

# Вставить следующую конфигурацию:
```

```nginx
server {
    listen 80;
    server_name your-domain.com 85.113.27.42;

    # Frontend (React Vite)
    location / {
        root /var/www/opr-raboty/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Увеличение таймаутов для загрузки файлов
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;

        # Увеличение максимального размера загружаемых файлов
        client_max_body_size 50M;
    }

    # Uploads (статические файлы)
    location /uploads {
        alias /var/www/opr-raboty/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

```bash
# Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/opr-raboty /etc/nginx/sites-enabled/

# Удалить дефолтную конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 7️⃣ Запуск Backend с PM2

```bash
cd /var/www/opr-raboty/backend

# Создать PM2 ecosystem файл
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'opr-raboty-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
EOF

# Создать директорию для логов
mkdir -p logs

# Запустить приложение
pm2 start ecosystem.config.js

# Сохранить PM2 конфигурацию для автозапуска
pm2 save

# Настроить автозапуск PM2 при перезагрузке сервера
pm2 startup systemd
# Выполните команду, которую предложит PM2

# Полезные команды PM2:
pm2 list              # Список процессов
pm2 logs              # Просмотр логов
pm2 monit             # Мониторинг в реальном времени
pm2 restart all       # Перезапуск всех приложений
pm2 reload all        # Перезагрузка без даунтайма
pm2 stop all          # Остановка всех приложений
```

## 8️⃣ Настройка CompreFace (опционально)

Если CompreFace еще не установлен:

```bash
# Установка Docker
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Клонировать CompreFace
cd /opt
sudo git clone https://github.com/exadel-inc/CompreFace.git
cd CompreFace

# Запустить CompreFace
sudo docker-compose up -d

# CompreFace будет доступен на http://localhost:8000
# Создайте API ключ в веб-интерфейсе и добавьте в .env файл backend
```

## 9️⃣ Настройка SSL (опционально, но рекомендуется)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление сертификата
sudo certbot renew --dry-run
```

## 🔟 Настройка Firewall

```bash
# Установка UFW
sudo apt install -y ufw

# Разрешить SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Активировать firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

## 📱 Сборка мобильного приложения

Мобильное приложение собирается локально, не на сервере:

```bash
# На вашей локальной машине:
cd mobile

# Установка зависимостей
npm install

# Обновить API URL в конфигурации
# Отредактировать mobile/src/api/axios.js
# baseURL: 'http://your-domain.com/api'

# Для Android:
npx expo build:android
# или с EAS Build:
npx eas build --platform android

# Для iOS:
npx expo build:ios
# или с EAS Build:
npx eas build --platform ios
```

## ✅ Проверка развертывания

```bash
# 1. Проверить статус PostgreSQL
sudo systemctl status postgresql

# 2. Проверить статус Nginx
sudo systemctl status nginx

# 3. Проверить PM2 процессы
pm2 status

# 4. Проверить логи backend
pm2 logs opr-raboty-backend

# 5. Проверить подключение к базе данных
psql -U opr_user -d opr_raboty -c "SELECT COUNT(*) FROM users;"

# 6. Проверить API
curl http://localhost:5000/api/health
# или
curl http://your-domain.com/api/health

# 7. Проверить frontend
curl http://your-domain.com

# 8. Проверить Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Обновление приложения

```bash
# 1. Получить последние изменения
cd /var/www/opr-raboty
git pull origin main  # или ваша ветка

# 2. Обновить backend
cd backend
npm install
pm2 reload all

# 3. Обновить frontend
cd ../frontend
npm install
npm run build

# 4. Перезапустить Nginx
sudo systemctl reload nginx
```

## 🐛 Решение проблем

### Backend не запускается

```bash
# Проверить логи
pm2 logs opr-raboty-backend --lines 100

# Проверить .env файл
cat /var/www/opr-raboty/backend/.env

# Проверить подключение к БД
psql -U opr_user -d opr_raboty -h localhost
```

### Nginx выдает 502 Bad Gateway

```bash
# Проверить что backend запущен
pm2 status

# Проверить логи Nginx
sudo tail -f /var/log/nginx/error.log

# Перезапустить backend
pm2 restart all
```

### База данных не подключается

```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
sudo -u postgres psql -c "\l"

# Проверить права пользователя
sudo -u postgres psql -c "\du"
```

## 📊 Мониторинг

```bash
# PM2 мониторинг
pm2 monit

# Установка PM2 Web Dashboard
pm2 install pm2-server-monit

# Системные ресурсы
htop

# Логи в реальном времени
pm2 logs --lines 200
tail -f /var/log/nginx/access.log
```

## 🔐 Безопасность

1. **Изменить пароли по умолчанию** в .env файле
2. **Настроить SSL сертификат** через Let's Encrypt
3. **Регулярно обновлять систему**: `sudo apt update && sudo apt upgrade`
4. **Настроить backup базы данных**:
   ```bash
   # Создать backup скрипт
   cat > /var/www/backup-db.sh << 'EOF'
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump -U opr_user opr_raboty > /var/backups/opr_raboty_$DATE.sql
   # Удалить backup старше 7 дней
   find /var/backups -name "opr_raboty_*.sql" -mtime +7 -delete
   EOF

   chmod +x /var/www/backup-db.sh

   # Добавить в cron (каждый день в 2:00)
   (crontab -l 2>/dev/null; echo "0 2 * * * /var/www/backup-db.sh") | crontab -
   ```

## 📞 Поддержка

При возникновении проблем проверьте:
- Логи PM2: `pm2 logs`
- Логи Nginx: `/var/log/nginx/error.log`
- Логи PostgreSQL: `/var/log/postgresql/postgresql-XX-main.log`

---

✅ **Готово!** Ваше приложение развернуто и работает на Ubuntu сервере.

Доступ:
- Frontend: http://your-domain.com
- Backend API: http://your-domain.com/api
- Мониторинг PM2: `pm2 monit`
