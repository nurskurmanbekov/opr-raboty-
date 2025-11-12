# 🚀 Полная инструкция по запуску системы "Пробация КР"

## 📋 Содержание
- [Системные требования](#системные-требования)
- [1. Установка зависимостей](#1-установка-зависимостей)
- [2. Настройка CompreFace (Face ID)](#2-настройка-compreface-face-id)
- [3. Настройка базы данных PostgreSQL](#3-настройка-базы-данных-postgresql)
- [4. Настройка Backend (Node.js)](#4-настройка-backend-nodejs)
- [5. Настройка Frontend (React)](#5-настройка-frontend-react)
- [6. Настройка Mobile App (React Native/Expo)](#6-настройка-mobile-app-react-nativeexpo)
- [7. Запуск всей системы](#7-запуск-всей-системы)
- [8. Тестирование Face ID](#8-тестирование-face-id)
- [9. Troubleshooting](#9-troubleshooting)

---

## Системные требования

### Минимальные требования:
- **CPU:** 4 ядра
- **RAM:** 8 GB (16 GB рекомендуется для CompreFace)
- **Диск:** 20 GB свободного места (SSD рекомендуется)
- **ОС:** Linux (Ubuntu 20.04+), macOS, Windows 10/11 с WSL2

### Программное обеспечение:
- **Docker & Docker Compose:** v20.10+
- **Node.js:** v18.0+
- **PostgreSQL:** v14.0+
- **Git:** v2.30+
- **Expo CLI:** Для мобильного приложения

---

## 1. Установка зависимостей

### 1.1 Docker & Docker Compose

#### Ubuntu/Debian:
```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверить установку
docker --version
docker-compose --version
```

#### macOS:
```bash
# Установить Docker Desktop с официального сайта
# https://www.docker.com/products/docker-desktop

# Или через Homebrew:
brew install --cask docker
```

#### Windows:
```
1. Скачать Docker Desktop: https://www.docker.com/products/docker-desktop
2. Установить WSL2: https://docs.microsoft.com/en-us/windows/wsl/install
3. Запустить Docker Desktop
```

### 1.2 Node.js v18+

#### Ubuntu/Debian:
```bash
# Установить Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверить установку
node --version
npm --version
```

#### macOS:
```bash
# Через Homebrew
brew install node@18

# Или через NVM (рекомендуется)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc  # или ~/.bashrc
nvm install 18
nvm use 18
```

#### Windows:
```
1. Скачать установщик: https://nodejs.org/en/download
2. Запустить установщик (выбрать LTS версию)
3. Проверить: node --version && npm --version
```

### 1.3 PostgreSQL v14+

#### Ubuntu/Debian:
```bash
# Установить PostgreSQL
sudo apt install postgresql postgresql-contrib

# Запустить сервис
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверить статус
sudo systemctl status postgresql
```

#### macOS:
```bash
# Через Homebrew
brew install postgresql@14
brew services start postgresql@14
```

#### Windows:
```
1. Скачать установщик: https://www.postgresql.org/download/windows/
2. Запустить установщик
3. Запомнить пароль для пользователя postgres
```

---

## 2. Настройка CompreFace (Face ID)

CompreFace - это self-hosted система распознавания лиц. Запускается через Docker.

### 2.1 Создать docker-compose файл для CompreFace

Создайте файл `docker-compose.compreface.yml`:

```yaml
version: '3.8'

services:
  compreface-postgres-db:
    image: postgres:14
    container_name: compreface-postgres-db
    restart: always
    environment:
      POSTGRES_USER: compreface
      POSTGRES_PASSWORD: compreface_password
      POSTGRES_DB: compreface
    volumes:
      - compreface-postgres-data:/var/lib/postgresql/data
    networks:
      - compreface-network

  compreface-admin:
    image: exadel/compreface-admin:latest
    container_name: compreface-admin
    restart: always
    environment:
      POSTGRES_USER: compreface
      POSTGRES_PASSWORD: compreface_password
      POSTGRES_URL: jdbc:postgresql://compreface-postgres-db:5432/compreface
      SPRING_PROFILES_ACTIVE: dev
      ENABLE_EMAIL_SERVER: "false"
      EMAIL_HOST: smtp.gmail.com
      EMAIL_USERNAME: your_email@gmail.com
      EMAIL_FROM: your_email@gmail.com
      EMAIL_PASSWORD: your_password
      ADMIN_JAVA_OPTS: -Xmx8g
    ports:
      - "8080:8080"
    depends_on:
      - compreface-postgres-db
    networks:
      - compreface-network

  compreface-api:
    image: exadel/compreface-api:latest
    container_name: compreface-api
    restart: always
    environment:
      POSTGRES_USER: compreface
      POSTGRES_PASSWORD: compreface_password
      POSTGRES_URL: jdbc:postgresql://compreface-postgres-db:5432/compreface
      SPRING_PROFILES_ACTIVE: dev
      API_JAVA_OPTS: -Xmx8g
    depends_on:
      - compreface-postgres-db
      - compreface-admin
    networks:
      - compreface-network

  compreface-fe:
    image: exadel/compreface-fe:latest
    container_name: compreface-fe
    restart: always
    ports:
      - "8000:80"
    depends_on:
      - compreface-api
      - compreface-admin
    networks:
      - compreface-network

volumes:
  compreface-postgres-data:

networks:
  compreface-network:
    driver: bridge
```

### 2.2 Запустить CompreFace

```bash
# Запустить CompreFace
docker-compose -f docker-compose.compreface.yml up -d

# Проверить логи
docker-compose -f docker-compose.compreface.yml logs -f

# Дождаться полного запуска (может занять 2-5 минут)
# CompreFace UI будет доступен на: http://localhost:8000
```

### 2.3 Создать API ключ в CompreFace

1. Откройте браузер: `http://localhost:8000`
2. Зарегистрируйте учетную запись (первый пользователь становится администратором)
3. Создайте новое приложение: `Probation System`
4. Создайте новый сервис: `Recognition Service`
5. Скопируйте **API Key** (понадобится для Backend)

Пример API ключа: `00000000-0000-0000-0000-000000000000`

---

## 3. Настройка базы данных PostgreSQL

### 3.1 Создать базу данных

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# Создать базу данных и пользователя
CREATE DATABASE probation_system;
CREATE USER probation_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE probation_system TO probation_user;

# Выйти
\q
```

### 3.2 Проверить подключение

```bash
# Тест подключения
psql -U probation_user -d probation_system -h localhost

# Если подключение успешно, вы увидите:
# probation_system=>
```

---

## 4. Настройка Backend (Node.js)

### 4.1 Перейти в папку backend

```bash
cd backend
```

### 4.2 Установить зависимости

```bash
npm install
```

### 4.3 Создать .env файл

Создайте файл `.env` в папке `backend/`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=probation_system
DB_USER=probation_user
DB_PASSWORD=your_strong_password_here

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=your_jwt_secret_key_here_generate_random_string_min_32_chars

# JWT Expiration
JWT_EXPIRE=7d

# CompreFace Configuration
COMPREFACE_URL=http://localhost:8080
COMPREFACE_API_KEY=your_compreface_api_key_from_step_2.3

# CORS Origins
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,exp://localhost:19000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
```

**Важно:** Замените следующие значения:
- `DB_PASSWORD` - пароль от PostgreSQL
- `JWT_SECRET` - сгенерируйте случайную строку (минимум 32 символа)
- `COMPREFACE_API_KEY` - API ключ из CompreFace (шаг 2.3)

### 4.4 Запустить миграции базы данных

```bash
# Запустить миграции (создать таблицы)
npm run db:migrate

# Если у вас нет этого скрипта, запустите:
node scripts/runMigrations.js
```

Или создайте файл `scripts/runMigrations.js`:

```javascript
const { sequelize } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    const migrationsPath = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`⬆️  Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
```

Затем запустите:
```bash
node scripts/runMigrations.js
```

### 4.5 Создать начальные данные (опционально)

```bash
# Создать супер-админа
node scripts/createSuperAdmin.js
```

### 4.6 Запустить Backend

```bash
# Development режим
npm run dev

# Production режим
npm start
```

Backend должен быть доступен на: `http://localhost:5000`

Проверьте health check: `http://localhost:5000/api/health`

---

## 5. Настройка Frontend (React)

### 5.1 Перейти в папку frontend

```bash
cd frontend
```

### 5.2 Установить зависимости

```bash
npm install
```

### 5.3 Создать .env файл

Создайте файл `.env` в папке `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Пробация КР
```

### 5.4 Запустить Frontend

```bash
# Development режим
npm run dev
```

Frontend будет доступен на: `http://localhost:5173`

### 5.5 Build для production

```bash
npm run build

# Preview production build
npm run preview
```

---

## 6. Настройка Mobile App (React Native/Expo)

### 6.1 Установить Expo CLI

```bash
npm install -g expo-cli @expo/ngrok
```

### 6.2 Перейти в папку mobile

```bash
cd mobile
```

### 6.3 Установить зависимости

```bash
npm install
```

### 6.4 Найти IP адрес вашего компьютера

#### Linux/macOS:
```bash
# Linux
ip addr show | grep inet

# macOS
ifconfig | grep inet

# Найдите локальный IP (обычно 192.168.x.x или 10.x.x.x)
```

#### Windows:
```cmd
ipconfig

# Найдите IPv4 адрес (обычно 192.168.x.x или 10.x.x.x)
```

### 6.5 Обновить API URL в mobile/src/api/api.js

Откройте файл `mobile/src/api/api.js` и обновите `LOCAL_IP`:

```javascript
const LOCAL_IP = '192.168.1.100'; // Замените на ваш IP адрес
```

### 6.6 Запустить Expo

```bash
# Запустить Expo Development Server
npm start

# Или
expo start
```

### 6.7 Установить Expo Go на телефон

1. **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent
2. **iOS:** https://apps.apple.com/app/expo-go/id982107779

### 6.8 Подключиться к приложению

1. Убедитесь, что телефон и компьютер в одной Wi-Fi сети
2. Откройте Expo Go на телефоне
3. Отсканируйте QR код из терминала

---

## 7. Запуск всей системы

### 7.1 Последовательность запуска

Запускайте в следующем порядке:

```bash
# 1. Запустить CompreFace
cd /path/to/project
docker-compose -f docker-compose.compreface.yml up -d

# Дождаться полного запуска (2-5 минут)
# Проверить: http://localhost:8000

# 2. Запустить Backend
cd backend
npm run dev

# Проверить: http://localhost:5000/api/health

# 3. Запустить Frontend
cd ../frontend
npm run dev

# Проверить: http://localhost:5173

# 4. Запустить Mobile App
cd ../mobile
npm start

# Отсканировать QR код на телефоне
```

### 7.2 Проверка всех сервисов

| Сервис | URL | Статус |
|--------|-----|--------|
| CompreFace UI | http://localhost:8000 | ✅ |
| CompreFace API | http://localhost:8080 | ✅ |
| Backend API | http://localhost:5000/api | ✅ |
| Frontend | http://localhost:5173 | ✅ |
| Mobile (Expo) | exp://localhost:19000 | ✅ |

---

## 8. Тестирование Face ID

### 8.1 Создать тестового пользователя

1. Откройте Frontend: `http://localhost:5173`
2. Зарегистрируйте нового пользователя
3. Войдите в систему

### 8.2 Зарегистрировать Face ID

1. Откройте мобильное приложение
2. Войдите под тестовым пользователем
3. Перейдите в **Профиль**
4. Нажмите **"Сделать селфи для Face ID"**
5. Сделайте селфи (фронтальная камера)
6. Нажмите **"Зарегистрировать Face ID"**
7. Дождитесь сообщения: **"✅ Face ID зарегистрирован!"**

### 8.3 Проверить Face ID верификацию

1. Перейдите в **"Рабочие сессии"**
2. Нажмите **"Сделать селфи для Face ID"**
3. Сделайте селфи
4. Нажмите **"Начать рабочую сессию"**
5. Система верифицирует лицо:
   - ✅ Если совпадает (>85%) - сессия начнется
   - ❌ Если не совпадает - будет отказ с указанием схожести

### 8.4 Проверить антикоррупционную защиту

**Тест 1: Попытка начать сессию без Face ID**
- Ожидаемый результат: ❌ Отказ с сообщением "Face ID обязателен"

**Тест 2: Попытка начать сессию с фото другого человека**
- Ожидаемый результат: ❌ Отказ с низкой схожестью (<85%)

**Тест 3: Попытка начать сессию с правильным селфи**
- Ожидаемый результат: ✅ Успех с высокой схожестью (>85%)

---

## 9. Troubleshooting

### 9.1 CompreFace не запускается

**Проблема:** Docker контейнеры не запускаются

**Решение:**
```bash
# Проверить логи
docker-compose -f docker-compose.compreface.yml logs

# Остановить и удалить контейнеры
docker-compose -f docker-compose.compreface.yml down -v

# Запустить заново
docker-compose -f docker-compose.compreface.yml up -d
```

### 9.2 Backend не подключается к PostgreSQL

**Проблема:** `Connection refused` или `ECONNREFUSED`

**Решение:**
1. Проверить, что PostgreSQL запущен:
   ```bash
   sudo systemctl status postgresql
   ```
2. Проверить .env файл (правильный пароль, хост, порт)
3. Проверить права пользователя:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE probation_system TO probation_user;
   ```

### 9.3 Face ID верификация всегда не проходит

**Проблема:** Схожесть всегда <85%

**Решение:**
1. Проверить качество фото (хорошее освещение, лицо видно полностью)
2. Уменьшить порог в `faceRecognitionService.js`:
   ```javascript
   const VERIFICATION_THRESHOLD = 0.75; // Вместо 0.85
   ```
3. Перерегистрировать Face ID с лучшим фото

### 9.4 Mobile App не подключается к Backend

**Проблема:** `Network request failed`

**Решение:**
1. Проверить, что телефон и компьютер в одной Wi-Fi сети
2. Обновить IP адрес в `mobile/src/api/api.js`
3. Проверить firewall (разрешить порт 5000)
4. Для Android эмулятора использовать: `http://10.0.2.2:5000/api`

### 9.5 Миграция не применяется

**Проблема:** `Migration failed`

**Решение:**
```bash
# Откатить миграции
node scripts/rollbackMigrations.js

# Применить заново
node scripts/runMigrations.js
```

---

## 📚 Дополнительные ресурсы

- **CompreFace документация:** https://github.com/exadel-inc/CompreFace
- **Sequelize документация:** https://sequelize.org/docs/v6/
- **Expo документация:** https://docs.expo.dev/
- **React документация:** https://react.dev/

---

## 🎉 Поздравляем!

Если все сервисы запущены, вы успешно развернули систему "Пробация КР" с Face ID верификацией!

**Что дальше:**
1. Настроить production сервер (Nginx, PM2, SSL)
2. Настроить CI/CD (GitHub Actions, GitLab CI)
3. Настроить мониторинг (Grafana, Prometheus)
4. Настроить backup базы данных

---

## 💬 Поддержка

Если у вас возникли проблемы:
1. Проверьте логи всех сервисов
2. Прочитайте секцию Troubleshooting
3. Создайте issue в репозитории

**Важно:** Это система с антикоррупционной защитой. Face ID - обязательное требование для начала рабочих сессий.
