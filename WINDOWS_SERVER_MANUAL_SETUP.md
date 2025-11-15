# 🪟 WINDOWS SERVER - РУЧНАЯ УСТАНОВКА

**Установка Backend + Frontend на Windows Server без Docker**

---

## 📊 СИСТЕМНЫЕ ТРЕБОВАНИЯ

```
OS:         Windows Server 2019/2022
RAM:        4 GB минимум, 8 GB рекомендуется
CPU:        2 cores минимум, 4 cores рекомендуется
Disk:       50 GB свободного места
Network:    Доступ в интернет + локальная сеть
```

---

## 📦 ЧТО БУДЕТ УСТАНОВЛЕНО

```
1. PostgreSQL 15         (~500 MB) - База данных
2. Node.js 18 LTS        (~100 MB) - Runtime для Backend
3. Backend приложение    (~300 MB) - API сервер
4. Frontend приложение   (~200 MB) - Web интерфейс
5. IIS (опционально)     (встроен)  - Web сервер для Frontend
```

**ИТОГО:** ~2-3 GB с зависимостями

---

## 🔧 ШАГ 1: УСТАНОВКА POSTGRESQL

### 1.1 Скачать PostgreSQL

Открой браузер и скачай:

👉 **https://www.postgresql.org/download/windows/**

- Выбери версию: **PostgreSQL 15.x**
- Скачай **Windows x86-64**
- Файл: `postgresql-15.x-windows-x64.exe` (~260 MB)

---

### 1.2 Установить PostgreSQL

1. Запусти `postgresql-15.x-windows-x64.exe`
2. **Installation Directory:**
   ```
   C:\Program Files\PostgreSQL\15
   ```
3. **Select Components:**
   ```
   ☑ PostgreSQL Server
   ☑ pgAdmin 4
   ☑ Stack Builder (можно убрать)
   ☑ Command Line Tools
   ```
4. **Data Directory:**
   ```
   C:\Program Files\PostgreSQL\15\data
   ```
5. **Password:**
   ```
   Введи пароль для пользователя postgres
   Например: PostgreSQL123!
   ЗАПИШИ ЕГО! Понадобится!
   ```
6. **Port:**
   ```
   5432 (по умолчанию)
   ```
7. **Locale:**
   ```
   [Default locale] или Russian, Russia
   ```
8. Нажми **"Next"** → **"Install"**
9. Дождись установки (~5 минут)
10. Нажми **"Finish"**

**PostgreSQL установлен!** ✅

---

### 1.3 Создать базу данных

**Вариант 1: Через pgAdmin (графически)**

1. Запусти **pgAdmin 4** (из меню Пуск)
2. Введи master password (можно любой, например: admin)
3. В левом меню: **Servers** → **PostgreSQL 15**
4. Введи пароль postgres (который задал при установке)
5. Правый клик на **Databases** → **Create** → **Database**
6. Настройки:
   ```
   Database: probation_db
   Owner: postgres
   Encoding: UTF8
   ```
7. Нажми **"Save"**

**Вариант 2: Через SQL (командная строка)**

1. Открой **SQL Shell (psql)** из меню Пуск
2. Нажимай **Enter** на всех вопросах (использует дефолты)
3. Введи пароль postgres
4. Выполни команды:

```sql
-- Создать базу данных
CREATE DATABASE probation_db;

-- Создать пользователя
CREATE USER probation_user WITH PASSWORD 'Probation123!';

-- Дать права
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;

-- Выйти
\q
```

**База данных готова!** ✅

---

## 🟢 ШАГ 2: УСТАНОВКА NODE.JS

### 2.1 Скачать Node.js

👉 **https://nodejs.org/**

- Выбери **LTS версию** (например 18.x или 20.x)
- Скачай **Windows Installer (.msi)** для x64
- Файл: `node-v18.x.x-x64.msi` (~30 MB)

---

### 2.2 Установить Node.js

1. Запусти `node-v18.x.x-x64.msi`
2. Нажимай **"Next"** на всех экранах
3. Убедись что галочки стоят:
   ```
   ☑ Node.js runtime
   ☑ npm package manager
   ☑ Add to PATH
   ```
4. Нажми **"Install"**
5. Дождись установки (~2 минуты)
6. Нажми **"Finish"**

---

### 2.3 Проверить установку

Открой **PowerShell** (или Command Prompt):

```powershell
# Проверить Node.js
node --version
# Должно показать: v18.x.x

# Проверить npm
npm --version
# Должно показать: 9.x.x или 10.x.x
```

**Node.js установлен!** ✅

---

## 📥 ШАГ 3: СКАЧАТЬ ПРОЕКТ

### 3.1 Установить Git (если нет)

**Скачать:**
👉 **https://git-scm.com/download/win**

**Установить:**
- Нажимай **"Next"** везде (настройки по умолчанию)

---

### 3.2 Клонировать проект

Открой **PowerShell**:

```powershell
# Создать папку для проектов
cd C:\
mkdir probation
cd probation

# Клонировать проект
git clone https://github.com/nurskurmanbekov/opr-raboty-.git
cd opr-raboty-

# Проверить что скачалось
dir
```

**Должны увидеть папки:**
```
backend/
frontend/
mobile/
docker-compose.yml
README.md
```

**Проект скачан!** ✅

---

## ⚙️ ШАГ 4: НАСТРОЙКА BACKEND

### 4.1 Создать .env файл

```powershell
cd C:\probation\opr-raboty-\backend
notepad .env
```

**Вставь в файл:**

```bash
# Database Configuration
DATABASE_URL=postgres://probation_user:Probation123!@localhost:5432/probation_db

# JWT Secret (можешь изменить на любой случайный текст)
JWT_SECRET=super_secret_jwt_key_change_in_production_2024

# Server Port
PORT=5000
NODE_ENV=production

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CompreFace Configuration (из Proxmox LXC)
COMPREFACE_ENABLED=true
COMPREFACE_API_URL=http://192.168.1.100:8002
COMPREFACE_API_KEY=00000000-0000-0000-0000-000000000002
COMPREFACE_FACE_COLLECTION=probation_clients

# Face ID Settings
FACE_SIMILARITY_THRESHOLD=0.85
FACE_MAX_ATTEMPTS=10
FACE_LOCKOUT_DURATION_MINUTES=30

# CORS (если Frontend на другом сервере)
CORS_ORIGIN=*
```

**Сохрани файл:** Ctrl+S → закрой Notepad

**ВАЖНО:** Замени:
- `Probation123!` → пароль который создал для probation_user
- `192.168.1.100` → IP твоего Proxmox LXC
- `COMPREFACE_API_KEY` → ключ из CompreFace Admin

---

### 4.2 Установить зависимости

```powershell
cd C:\probation\opr-raboty-\backend

# Установить пакеты (первый раз долго, ~5-10 минут)
npm install
```

**Должно скачать ~300 пакетов без ошибок**

---

### 4.3 Запустить миграции БД

```powershell
# Создать таблицы в базе данных
npm run migrate
```

**Должно показать:**
```
✅ Running migrations...
✅ Migration 001_initial_schema.js - Success
✅ Migration 002_add_face_tables.js - Success
...
✅ All migrations completed
```

---

### 4.4 Создать Superadmin

```powershell
# Создать первого администратора
node scripts/createSuperadmin.js
```

**Ответь на вопросы:**
```
Enter username: superadmin
Enter password: Admin123!
Enter full name: Системный Администратор
```

**Должно показать:**
```
✅ Superadmin created successfully!
Username: superadmin
Password: Admin123!
```

---

### 4.5 Запустить Backend (тест)

```powershell
# Запустить сервер в режиме разработки
npm start
```

**Должно показать:**
```
✅ Server running on port 5000
✅ Database connected
✅ CompreFace connected (если настроен)
```

**Открой браузер:** http://localhost:5000/api

**Должен показать:** `{"message": "Probation API is running"}`

**Backend работает!** ✅

Нажми **Ctrl+C** чтобы остановить (запустим как службу позже)

---

## 🎨 ШАГ 5: НАСТРОЙКА FRONTEND

### 5.1 Создать .env файл

```powershell
cd C:\probation\opr-raboty-\frontend
notepad .env
```

**Вставь:**

```bash
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Или если Backend на другом сервере:
# VITE_API_URL=http://192.168.1.50:5000/api
```

**Сохрани:** Ctrl+S → закрой

---

### 5.2 Установить зависимости

```powershell
cd C:\probation\opr-raboty-\frontend

# Установить пакеты (~5-10 минут)
npm install
```

---

### 5.3 Собрать production build

```powershell
# Собрать оптимизированную версию
npm run build
```

**Должно создать папку `dist/` с готовым приложением**

---

### 5.4 Запустить Frontend (тест)

**Вариант 1: Тестовый сервер (для проверки)**

```powershell
# Запустить dev сервер
npm run dev
```

**Открой браузер:** http://localhost:5173

**Должен открыться интерфейс!** ✅

---

## 🌐 ШАГ 6: ДЕПЛОЙ НА IIS (PRODUCTION)

### 6.1 Установить IIS

**Открой Server Manager:**

1. **Manage** → **Add Roles and Features**
2. **Next** → **Next** → **Next**
3. **Server Roles:**
   ```
   ☑ Web Server (IIS)
   ```
4. Нажми **"Add Features"** если спросит
5. **Next** → **Next** → **Next**
6. **Role Services:**
   ```
   ☑ Default Document
   ☑ Directory Browsing
   ☑ HTTP Errors
   ☑ Static Content
   ☑ HTTP Logging
   ```
7. **Install** → дождись установки
8. **Close**

**IIS установлен!** ✅

---

### 6.2 Настроить IIS для Frontend

**Открой IIS Manager:**

1. Меню Пуск → **Internet Information Services (IIS) Manager**
2. В левом меню: **Server** → **Sites**
3. Правый клик на **Default Web Site** → **Remove** (удалить)
4. Правый клик на **Sites** → **Add Website**

**Настройки сайта:**
```
Site name: ProbationFrontend
Physical path: C:\probation\opr-raboty-\frontend\dist
Binding:
  Type: http
  IP: All Unassigned
  Port: 80
  Host name: (пусто)
```

5. Нажми **OK**

---

### 6.3 Настроить URL Rewrite (для React Router)

**Установить URL Rewrite Module:**

1. Скачай: **https://www.iis.net/downloads/microsoft/url-rewrite**
2. Установи `rewrite_amd64_en-US.msi`

**Создать web.config в папке frontend/dist:**

```powershell
cd C:\probation\opr-raboty-\frontend\dist
notepad web.config
```

**Вставь:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

**Сохрани и закрой**

---

### 6.4 Проверить Frontend

**Открой браузер:** http://localhost

**Должен открыться интерфейс приложения!** 🎉

**Войди:**
- Логин: `superadmin`
- Пароль: `Admin123!`

---

## 🔄 ШАГ 7: BACKEND КАК СЛУЖБА WINDOWS

### 7.1 Установить node-windows

```powershell
cd C:\probation\opr-raboty-\backend

# Установить глобально
npm install -g node-windows
```

---

### 7.2 Создать скрипт службы

```powershell
notepad install-service.js
```

**Вставь:**

```javascript
var Service = require('node-windows').Service;

// Создать службу
var svc = new Service({
  name: 'Probation Backend',
  description: 'Probation System Backend API Server',
  script: 'C:\\probation\\opr-raboty-\\backend\\server.js',
  nodeOptions: [
    '--max-old-space-size=2048'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ]
});

// Обработчики событий
svc.on('install', function() {
  console.log('✅ Service installed!');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('⚠️  Service already installed');
});

svc.on('start', function() {
  console.log('✅ Service started!');
});

// Установить
svc.install();
```

**Сохрани:** Ctrl+S → закрой

---

### 7.3 Установить службу

```powershell
# Запустить как администратор!
node install-service.js
```

**Должно показать:**
```
✅ Service installed!
✅ Service started!
```

---

### 7.4 Проверить службу

**Открой Services:**

1. Win+R → `services.msc` → Enter
2. Найди: **Probation Backend**
3. Статус должен быть: **Running**

**Управление:**
- **Restart** - перезапустить
- **Stop** - остановить
- **Start** - запустить

**Backend работает как служба!** ✅

---

## 🔥 FIREWALL (если нужен доступ извне)

### Открыть порты:

```powershell
# Открыть PowerShell как администратор

# Порт 80 (Frontend)
New-NetFirewallRule -DisplayName "Probation Frontend" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Порт 5000 (Backend API)
New-NetFirewallRule -DisplayName "Probation Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

## ✅ ПРОВЕРКА ВСЕГО

### 1. Backend

```powershell
# Проверить API
Invoke-WebRequest http://localhost:5000/api
```

### 2. Frontend

Открой браузер: **http://localhost** или **http://<IP сервера>**

### 3. Логин

- Логин: `superadmin`
- Пароль: `Admin123!`

### 4. Проверить Face ID (если настроен CompreFace)

- Создай клиента
- Загрузи 3-5 фото лица
- Должно загрузиться без ошибок

**ВСЁ РАБОТАЕТ!** 🎉

---

## 🔄 ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

### Обновить Backend:

```powershell
cd C:\probation\opr-raboty-

# Скачать изменения
git pull

# Обновить зависимости
cd backend
npm install

# Запустить миграции (если есть новые)
npm run migrate

# Перезапустить службу
Restart-Service "Probation Backend"
```

---

### Обновить Frontend:

```powershell
cd C:\probation\opr-raboty-

# Скачать изменения
git pull

# Пересобрать
cd frontend
npm install
npm run build

# IIS автоматически подхватит новые файлы
```

---

## 📊 МОНИТОРИНГ

### Логи Backend (служба Windows):

```
C:\ProgramData\node-windows\Probation Backend\daemon\
```

### Логи PostgreSQL:

```
C:\Program Files\PostgreSQL\15\data\log\
```

### Логи IIS:

```
C:\inetpub\logs\LogFiles\
```

---

## 🚨 РЕШЕНИЕ ПРОБЛЕМ

### Backend не стартует:

```powershell
# Проверить логи службы
Get-EventLog -LogName Application -Source "Probation Backend" -Newest 10

# Проверить что PostgreSQL запущен
Get-Service postgresql*

# Проверить подключение к БД
psql -U probation_user -d probation_db
```

---

### Frontend показывает ошибки:

1. Проверь что Backend работает: http://localhost:5000/api
2. Проверь `frontend/.env` - правильный ли API URL
3. Пересобери Frontend: `npm run build`
4. Перезапусти IIS: `iisreset`

---

### CompreFace не подключается:

```powershell
# Проверить доступность
Invoke-WebRequest http://192.168.1.100:8002/api/actuator/health

# Должно вернуть: {"status":"UP"}
```

Если не работает - проверь:
1. LXC запущен в Proxmox
2. CompreFace контейнеры работают: `docker-compose ps`
3. Firewall не блокирует порт 8002

---

## ✅ ЧЕКЛИСТ ГОТОВНОСТИ

- [ ] PostgreSQL установлен и запущен
- [ ] База probation_db создана
- [ ] Node.js установлен (v18+)
- [ ] Проект скачан в C:\probation\opr-raboty-
- [ ] Backend .env настроен
- [ ] Backend зависимости установлены (npm install)
- [ ] Миграции выполнены (npm run migrate)
- [ ] Superadmin создан
- [ ] Backend служба запущена
- [ ] Frontend собран (npm run build)
- [ ] IIS настроен
- [ ] Frontend открывается (http://localhost)
- [ ] Вход в систему работает
- [ ] CompreFace подключен (если настроен)

**Всё готово?** → Система работает! 🚀

---

## 🎯 ИТОГОВАЯ КОНФИГУРАЦИЯ

```
┌──────────────────────────────────────┐
│      WINDOWS SERVER                  │
│      IP: 192.168.1.50                │
│                                      │
│  📦 PostgreSQL:15                    │
│     └─ probation_db (порт 5432)     │
│                                      │
│  🟢 Node.js Backend                  │
│     └─ Служба Windows (порт 5000)   │
│     └─ Подключен к CompreFace        │
│                                      │
│  🎨 React Frontend                   │
│     └─ IIS (порт 80)                 │
│     └─ API: http://localhost:5000    │
│                                      │
│  🔗 CompreFace:                      │
│     └─ http://192.168.1.100:8002     │
└──────────────────────────────────────┘
```

**Production Ready!** 🎉
