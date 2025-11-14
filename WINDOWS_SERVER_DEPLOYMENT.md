# 🚀 Развертывание на Windows Server

## 📋 Системные требования

- **Windows Server 2016/2019/2022** или Windows 10/11 Pro
- **4 GB RAM** минимум (рекомендуется 8 GB)
- **20 GB** свободного места на диске
- **Права администратора**
- **Доступ к интернету** для загрузки зависимостей

---

## 🎯 Обзор архитектуры

Система состоит из трех компонентов:

1. **Backend** (Node.js + Express) - API сервер на порту `5000`
2. **Frontend** (React + Vite) - Веб-панель на порту `8091` (через IIS)
3. **Database** (PostgreSQL) - База данных на порту `5432`

---

## 📦 ШАГ 1: Установка Node.js

### Вариант A: Через установщик (рекомендуется)

1. Скачайте Node.js 18.x LTS с официального сайта:
   ```
   https://nodejs.org/en/download/
   ```

2. Запустите установщик (`node-v18.x.x-x64.msi`)

3. Следуйте инструкциям установщика:
   - ✅ Отметьте "Add to PATH"
   - ✅ Отметьте "Automatically install necessary tools"

4. **Перезагрузите компьютер** для применения PATH

5. Проверьте установку в PowerShell:
   ```powershell
   node --version
   # Должно вывести: v18.x.x

   npm --version
   # Должно вывести: 9.x.x или выше
   ```

### Вариант B: Через Chocolatey

```powershell
# Запустите PowerShell от администратора
choco install nodejs-lts -y

# Проверка
node --version
npm --version
```

---

## 🐘 ШАГ 2: Установка PostgreSQL

### Вариант A: Через установщик (рекомендуется)

1. Скачайте PostgreSQL 14+ с официального сайта:
   ```
   https://www.postgresql.org/download/windows/
   ```

2. Запустите установщик (`postgresql-14.x-windows-x64.exe`)

3. При установке:
   - **Порт:** оставьте `5432`
   - **Пароль суперпользователя:** запомните! (например, `postgres123`)
   - **Locale:** Russian, Russia или English, United States

4. После установки найдите pgAdmin 4 в меню Пуск

5. Создайте базу данных:

   **Через pgAdmin 4:**
   - Откройте pgAdmin 4
   - Подключитесь к серверу (введите пароль)
   - ПКМ на "Databases" → "Create" → "Database"
   - Имя: `opr_raboty`
   - Owner: `postgres`
   - Нажмите "Save"

   **Через psql (CMD):**
   ```cmd
   cd "C:\Program Files\PostgreSQL\14\bin"
   psql -U postgres
   # Введите пароль

   CREATE DATABASE opr_raboty;
   \q
   ```

### Вариант B: Через Chocolatey

```powershell
# PowerShell от администратора
choco install postgresql14 -y

# Создать БД
cd "C:\Program Files\PostgreSQL\14\bin"
.\psql -U postgres -c "CREATE DATABASE opr_raboty;"
```

---

## 📥 ШАГ 3: Клонирование проекта

### Установка Git (если нет)

```powershell
# Скачайте Git с https://git-scm.com/download/win
# Или через Chocolatey:
choco install git -y
```

### Клонирование репозитория

```powershell
# Создайте директорию проекта
cd C:\
mkdir Projects
cd Projects

# Клонируйте репозиторий
git clone https://github.com/nurskurmanbekov/opr-raboty-.git
cd opr-raboty-

# Или если у вас есть ZIP архив:
# Извлеките в C:\Projects\opr-raboty-
```

---

## ⚙️ ШАГ 4: Настройка Backend

```powershell
# Перейдите в папку backend
cd C:\Projects\opr-raboty-\backend

# Установите зависимости
npm install

# Создайте директории для загрузок
mkdir uploads\profiles, uploads\faces, uploads\qrcodes, uploads\work_photos, logs
```

### Создание .env файла

**Вариант A: Через PowerShell**

```powershell
@"
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opr_raboty
DB_USER=postgres
DB_PASSWORD=ВАШ_ПАРОЛЬ_POSTGRES

# JWT Configuration
JWT_SECRET=b3f8a9c2d5e7f1a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2
JWT_EXPIRE=7d

# CompreFace Configuration (опционально)
COMPREFACE_ENABLED=false
COMPREFACE_API_URL=http://localhost:8000
COMPREFACE_API_KEY=your_api_key_here
COMPREFACE_FACE_COLLECTION=probation_clients
FACE_SIMILARITY_THRESHOLD=0.85
FACE_MAX_ATTEMPTS=10
FACE_LOCKOUT_DURATION_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8091,http://ВАШ_IP:8091

# File Upload
MAX_FILE_SIZE=10485760
"@ | Out-File -FilePath .env -Encoding utf8
```

**Вариант B: Вручную**

1. Создайте файл `backend\.env` в Блокноте
2. Скопируйте содержимое из `backend\.env.example`
3. **ВАЖНО:** Измените `DB_PASSWORD` на пароль PostgreSQL
4. Сохраните файл

### Инициализация базы данных

```powershell
# Запустите сервер один раз для создания таблиц
npm start

# Нажмите Ctrl+C для остановки

# Создайте тестовые данные
node seed.js
```

---

## 🌐 ШАГ 5: Настройка Frontend

```powershell
# Перейдите в папку frontend
cd C:\Projects\opr-raboty-\frontend

# Установите зависимости
npm install
```

### Создание .env.production

```powershell
# Узнайте свой IP адрес
ipconfig
# Найдите IPv4 Address (например, 192.168.1.100)

# Создайте .env.production
@"
VITE_API_URL=http://ВАШ_IP:5000/api
VITE_APP_NAME=Департамент пробации КР
"@ | Out-File -FilePath .env.production -Encoding utf8
```

### Сборка Frontend

```powershell
npm run build

# Результат будет в папке C:\Projects\opr-raboty-\frontend\dist
```

---

## 🔧 ШАГ 6: Установка IIS (Internet Information Services)

### Включение IIS

```powershell
# PowerShell от администратора
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit -All

# Или через Server Manager (для Windows Server):
# 1. Откройте Server Manager
# 2. Add Roles and Features
# 3. Выберите Web Server (IIS)
# 4. Отметьте все компоненты
# 5. Install
```

### Установка URL Rewrite Module

1. Скачайте URL Rewrite Module:
   ```
   https://www.iis.net/downloads/microsoft/url-rewrite
   ```

2. Запустите установщик `rewrite_amd64_en-US.msi`

### Настройка сайта в IIS

1. Откройте **IIS Manager** (Пуск → Internet Information Services (IIS) Manager)

2. В левой панели разверните сервер → Sites

3. **Создайте новый сайт:**
   - ПКМ на "Sites" → Add Website
   - Site name: `OPR-Raboty-Frontend`
   - Physical path: `C:\Projects\opr-raboty-\frontend\dist`
   - Binding:
     - Type: http
     - IP address: All Unassigned
     - Port: `8091`
   - Нажмите OK

4. **Настройте URL Rewrite для SPA:**
   - Выберите сайт `OPR-Raboty-Frontend`
   - Двойной клик на "URL Rewrite"
   - Add Rule → Blank Rule
   - Name: `SPA Fallback`
   - Match URL:
     - Requested URL: Matches the Pattern
     - Pattern: `^(.*)$`
   - Conditions:
     - Нажмите Add
     - Condition input: `{REQUEST_FILENAME}`
     - Check if input string: Is Not a File
     - Нажмите Add еще раз
     - Condition input: `{REQUEST_FILENAME}`
     - Check if input string: Is Not a Directory
   - Action:
     - Action type: Rewrite
     - Rewrite URL: `/index.html`
   - Apply

5. **Настройте MIME types для .js:**
   - Выберите сайт → MIME Types
   - Убедитесь что `.js` имеет тип `application/javascript`

---

## 🚀 ШАГ 7: Установка PM2 для Windows

PM2 - менеджер процессов для Node.js приложений.

```powershell
# Установка PM2 глобально
npm install -g pm2
npm install -g pm2-windows-service

# Проверка
pm2 --version
```

### Создание Windows Service для Backend

```powershell
cd C:\Projects\opr-raboty-\backend

# Запустить backend через PM2
pm2 start server.js --name opr-raboty-backend

# Сохранить конфигурацию PM2
pm2 save

# Установить PM2 как Windows Service
pm2-service-install

# При установке выберите:
# - PM2_HOME: C:\ProgramData\pm2\home (по умолчанию)
# - PM2 service name: PM2 (по умолчанию)

# Запустить PM2 service
Start-Service PM2

# Проверить статус
pm2 status
```

### Настройка автозапуска

```powershell
# PM2 уже настроен как служба Windows и запустится автоматически

# Полезные команды PM2:
pm2 list                          # Список процессов
pm2 logs opr-raboty-backend       # Просмотр логов
pm2 restart opr-raboty-backend    # Перезапуск
pm2 stop opr-raboty-backend       # Остановка
pm2 monit                         # Мониторинг
```

---

## 🔥 ШАГ 8: Настройка Firewall

```powershell
# PowerShell от администратора

# Разрешить Backend (порт 5000)
New-NetFirewallRule -DisplayName "OPR Backend API" `
    -Direction Inbound `
    -LocalPort 5000 `
    -Protocol TCP `
    -Action Allow

# Разрешить Frontend IIS (порт 8091)
New-NetFirewallRule -DisplayName "OPR Frontend Web" `
    -Direction Inbound `
    -LocalPort 8091 `
    -Protocol TCP `
    -Action Allow

# Разрешить PostgreSQL (порт 5432) - только если нужен внешний доступ
New-NetFirewallRule -DisplayName "PostgreSQL Database" `
    -Direction Inbound `
    -LocalPort 5432 `
    -Protocol TCP `
    -Action Allow
```

---

## ✅ ШАГ 9: Проверка развертывания

### Проверка PostgreSQL

```powershell
# Откройте Services (services.msc)
# Найдите "postgresql-x64-14" или "PostgreSQL 14"
# Статус должен быть "Running"

# Или через PowerShell:
Get-Service postgresql*
```

### Проверка Backend

```powershell
pm2 status
# Должен показать: opr-raboty-backend | online

pm2 logs opr-raboty-backend --lines 20
# Должно быть: "Server running on port 5000"

# Тест API
curl http://localhost:5000/api
```

### Проверка Frontend (IIS)

```powershell
# Откройте браузер
# Перейдите на http://localhost:8091
# Должна открыться страница входа

# Или через curl:
curl http://localhost:8091
```

### Проверка из локальной сети

```powershell
# Узнайте свой IP
ipconfig
# Найдите IPv4 Address (например, 192.168.1.100)

# На другом компьютере/телефоне откройте:
# http://192.168.1.100:8091
```

---

## 🔐 ШАГ 10: Создание суперадминистратора

### Вариант A: Через скрипт

```powershell
cd C:\Projects\opr-raboty-\backend
node scripts\createSuperadmin.js
```

### Вариант B: Через pgAdmin

1. Откройте pgAdmin 4
2. Подключитесь к серверу
3. Откройте базу `opr_raboty` → Schemas → public → Tables → Users
4. ПКМ → View/Edit Data → All Rows
5. Добавьте запись вручную (пароль нужно захешировать bcrypt)

### Вариант C: Через SQL

```sql
-- В psql или pgAdmin Query Tool
INSERT INTO "Users" (
    id,
    "fullName",
    email,
    phone,
    password,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'Администратор',
    'admin@probation.kg',
    '+996555000000',
    '$2a$10$rN7xKJVQ8Xm5nP4yR0tY5uGx1LjKvZ9mW2hF3sT8dE6cU9vB0aI1K', -- пароль: admin123456
    'superadmin',
    true,
    NOW(),
    NOW()
);
```

---

## 🎯 ШАГ 11: Первый вход в систему

### Учетные данные по умолчанию:

```
Email:    admin@probation.kg
Пароль:   admin123456
```

### Вход в веб-панель:

1. Откройте браузер
2. Перейдите на `http://localhost:8091` или `http://ВАШ_IP:8091`
3. Введите учетные данные
4. **ВАЖНО:** Сразу смените пароль в профиле!

---

## 📱 ШАГ 12: Настройка мобильного приложения

### Обновление API URL

```powershell
cd C:\Projects\opr-raboty-\mobile

# Создайте .env файл
@"
EXPO_PUBLIC_API_URL=http://ВАШ_IP:5000/api
EXPO_PUBLIC_APP_NAME=Департамент пробации КР
"@ | Out-File -FilePath .env -Encoding utf8
```

### Запуск Expo (для тестирования)

```powershell
npm install
npm start

# Отсканируйте QR-код в Expo Go приложении
```

### Сборка APK для Android

```powershell
# Установите EAS CLI
npm install -g eas-cli

# Войдите в Expo аккаунт
eas login

# Настройте проект
eas build:configure

# Соберите APK
eas build --platform android --profile preview
```

---

## 🔄 Обновление приложения

### Обновление через Git

```powershell
cd C:\Projects\opr-raboty-

# Получить последние изменения
git pull origin main

# Обновить Backend
cd backend
npm install
pm2 restart opr-raboty-backend

# Обновить Frontend
cd ..\frontend
npm install
npm run build

# Перезапустить IIS
iisreset
```

---

## 🐛 Решение проблем

### Backend не запускается

```powershell
# Проверьте логи PM2
pm2 logs opr-raboty-backend --lines 50

# Проверьте .env файл
type C:\Projects\opr-raboty-\backend\.env

# Проверьте подключение к БД
cd "C:\Program Files\PostgreSQL\14\bin"
.\psql -U postgres -d opr_raboty

# Проверьте порт 5000 не занят
netstat -ano | findstr :5000
```

### Frontend показывает пустую страницу

```powershell
# Проверьте что dist собран
dir C:\Projects\opr-raboty-\frontend\dist

# Пересоберите
cd C:\Projects\opr-raboty-\frontend
npm run build

# Проверьте IIS
# Откройте IIS Manager
# Проверьте что сайт запущен (Start)

# Проверьте логи IIS
type C:\inetpub\logs\LogFiles\W3SVC*\u_ex*.log
```

### Ошибка "Cannot connect to API"

1. Проверьте что Backend запущен:
   ```powershell
   pm2 status
   curl http://localhost:5000/api
   ```

2. Проверьте `.env.production` в frontend:
   ```powershell
   type C:\Projects\opr-raboty-\frontend\.env.production
   ```

3. Проверьте CORS в `backend\.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:8091,http://ВАШ_IP:8091
   ```

4. Пересоберите frontend после изменений:
   ```powershell
   cd C:\Projects\opr-raboty-\frontend
   npm run build
   ```

### PostgreSQL не запускается

```powershell
# Проверьте службу
Get-Service postgresql*

# Запустите службу
Start-Service postgresql-x64-14

# Проверьте логи
type "C:\Program Files\PostgreSQL\14\data\log\postgresql-*.log"
```

### Порт уже занят

```powershell
# Найти процесс на порту 5000
netstat -ano | findstr :5000

# Убить процесс (замените PID на ID из предыдущей команды)
taskkill /PID 12345 /F
```

---

## 📊 Мониторинг и логи

### PM2 мониторинг

```powershell
# Интерактивный мониторинг
pm2 monit

# Статус процессов
pm2 status

# Логи в реальном времени
pm2 logs

# Информация о процессе
pm2 info opr-raboty-backend
```

### Логи IIS

```powershell
# Откройте IIS Manager
# Выберите сайт → Logging
# Посмотрите путь к логам (обычно C:\inetpub\logs\LogFiles)

# Просмотр логов
type C:\inetpub\logs\LogFiles\W3SVC*\u_ex*.log | Select-Object -Last 50
```

### Логи PostgreSQL

```
C:\Program Files\PostgreSQL\14\data\log\
```

---

## 🔐 Безопасность

### 1. Смените пароли по умолчанию

```powershell
# В веб-панели: Профиль → Изменить пароль
```

### 2. Настройте сильный JWT_SECRET

```powershell
# Сгенерируйте случайный ключ
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Обновите backend\.env
# JWT_SECRET=новый_сгенерированный_ключ

# Перезапустите backend
pm2 restart opr-raboty-backend
```

### 3. Включите HTTPS (для production)

1. Получите SSL сертификат (Let's Encrypt, Certbot)
2. Установите сертификат в IIS
3. Настройте binding на порт 443

### 4. Ограничьте доступ к PostgreSQL

```powershell
# Отредактируйте pg_hba.conf
# C:\Program Files\PostgreSQL\14\data\pg_hba.conf

# Разрешите только localhost:
# host    all    all    127.0.0.1/32    md5

# Перезапустите PostgreSQL
Restart-Service postgresql-x64-14
```

### 5. Настройте резервное копирование

```powershell
# Создайте скрипт backup.ps1
@"
`$date = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupPath = "C:\Backups\opr_raboty_`$date.backup"
cd "C:\Program Files\PostgreSQL\14\bin"
.\pg_dump -U postgres -F c -b -v -f `$backupPath opr_raboty
Write-Host "Backup created: `$backupPath"
"@ | Out-File -FilePath C:\Scripts\backup.ps1 -Encoding utf8

# Создайте планировщик задач
# Откройте Task Scheduler
# Create Basic Task → Daily → Start a program
# Program: powershell.exe
# Arguments: -File C:\Scripts\backup.ps1
```

---

## 📞 Поддержка

При возникновении проблем проверьте:

1. **Логи PM2:** `pm2 logs opr-raboty-backend`
2. **Логи IIS:** `C:\inetpub\logs\LogFiles\`
3. **Логи PostgreSQL:** `C:\Program Files\PostgreSQL\14\data\log\`
4. **Статус служб:**
   ```powershell
   Get-Service postgresql*
   Get-Service PM2
   Get-Service W3SVC  # IIS
   ```

---

## ✅ Чек-лист развертывания

- [ ] Windows Server настроен и обновлен
- [ ] Node.js 18+ установлен
- [ ] PostgreSQL 14+ установлен и запущен
- [ ] База данных `opr_raboty` создана
- [ ] Git установлен
- [ ] Проект клонирован в `C:\Projects\opr-raboty-`
- [ ] Backend: зависимости установлены (`npm install`)
- [ ] Backend: `.env` файл настроен
- [ ] Backend: таблицы созданы (`npm start`)
- [ ] Backend: тестовые данные загружены (`node seed.js`)
- [ ] Backend: PM2 установлен и запущен как служба
- [ ] Frontend: зависимости установлены
- [ ] Frontend: `.env.production` настроен
- [ ] Frontend: собран (`npm run build`)
- [ ] IIS установлен и настроен
- [ ] IIS: сайт создан на порту 8091
- [ ] IIS: URL Rewrite настроен
- [ ] Firewall: порты 5000 и 8091 открыты
- [ ] Суперадминистратор создан
- [ ] Вход в систему работает

---

## 🎉 Готово!

Ваше приложение развернуто на Windows Server!

**Доступ:**
- **Frontend:** http://ВАШ_IP:8091
- **Backend API:** http://ВАШ_IP:5000/api
- **Логин:** admin@probation.kg
- **Пароль:** admin123456 (смените!)

**Управление:**
- PM2 Dashboard: `pm2 monit`
- IIS Manager: Пуск → Internet Information Services (IIS) Manager
- pgAdmin 4: Управление базой данных

---

**📧 Контакты:**
- Email: support@probation.kg
- Телефон: +996 XXX XXX XXX

**Спасибо за использование нашей системы!** 🙏
