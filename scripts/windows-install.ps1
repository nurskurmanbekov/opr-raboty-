# ========================================================
# Автоматическая установка проекта на Windows Server
# ========================================================
#
# Использование:
#   1. Запустите PowerShell от администратора
#   2. Разрешите выполнение скриптов:
#      Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#   3. Запустите скрипт:
#      .\scripts\windows-install.ps1
#
# ========================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Установка OPR Raboty на Windows       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ОШИБКА: Запустите PowerShell от имени администратора!" -ForegroundColor Red
    exit 1
}

# Функция для проверки установленной программы
function Test-ProgramInstalled {
    param([string]$ProgramName)

    $installed = Get-Command $ProgramName -ErrorAction SilentlyContinue
    return $null -ne $installed
}

# Функция для вывода статуса
function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "INFO"
    )

    switch ($Status) {
        "OK"      { Write-Host "[✓] $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[✗] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[!] $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[i] $Message" -ForegroundColor Cyan }
        default   { Write-Host "    $Message" }
    }
}

# ========================================
# ШАГ 1: Проверка предварительных требований
# ========================================
Write-Host ""
Write-Host "ШАГ 1: Проверка системных требований..." -ForegroundColor Yellow
Write-Host ""

# Проверка Node.js
if (Test-ProgramInstalled "node") {
    $nodeVersion = (node --version)
    Write-Status "Node.js установлен: $nodeVersion" "OK"
} else {
    Write-Status "Node.js НЕ установлен!" "ERROR"
    Write-Host "    Скачайте Node.js 18.x LTS: https://nodejs.org/" -ForegroundColor Yellow
    $install = Read-Host "Открыть страницу загрузки? (Y/N)"
    if ($install -eq "Y" -or $install -eq "y") {
        Start-Process "https://nodejs.org/en/download/"
    }
    exit 1
}

# Проверка npm
if (Test-ProgramInstalled "npm") {
    $npmVersion = (npm --version)
    Write-Status "npm установлен: $npmVersion" "OK"
} else {
    Write-Status "npm НЕ установлен!" "ERROR"
    exit 1
}

# Проверка Git
if (Test-ProgramInstalled "git") {
    $gitVersion = (git --version)
    Write-Status "Git установлен: $gitVersion" "OK"
} else {
    Write-Status "Git НЕ установлен (опционально)" "WARNING"
}

# Проверка PostgreSQL
$pgPath = "C:\Program Files\PostgreSQL\14\bin\psql.exe"
if (Test-Path $pgPath) {
    Write-Status "PostgreSQL установлен" "OK"
} else {
    Write-Status "PostgreSQL НЕ установлен!" "ERROR"
    Write-Host "    Скачайте PostgreSQL 14+: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    $install = Read-Host "Открыть страницу загрузки? (Y/N)"
    if ($install -eq "Y" -or $install -eq "y") {
        Start-Process "https://www.postgresql.org/download/windows/"
    }
    exit 1
}

Write-Host ""
Write-Host "Все предварительные требования выполнены!" -ForegroundColor Green
Write-Host ""

# ========================================
# ШАГ 2: Настройка проекта
# ========================================
Write-Host "ШАГ 2: Настройка проекта..." -ForegroundColor Yellow
Write-Host ""

$projectPath = $PSScriptRoot | Split-Path -Parent
Write-Status "Путь к проекту: $projectPath" "INFO"

# Проверка структуры проекта
$backendPath = Join-Path $projectPath "backend"
$frontendPath = Join-Path $projectPath "frontend"

if (-not (Test-Path $backendPath)) {
    Write-Status "Папка backend не найдена!" "ERROR"
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Status "Папка frontend не найдена!" "ERROR"
    exit 1
}

Write-Status "Структура проекта корректна" "OK"

# ========================================
# ШАГ 3: Настройка базы данных
# ========================================
Write-Host ""
Write-Host "ШАГ 3: Настройка базы данных PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

$pgPassword = Read-Host "Введите пароль пользователя postgres" -AsSecureString
$pgPasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# Установка переменной окружения для psql
$env:PGPASSWORD = $pgPasswordText

# Создание базы данных
Write-Status "Создание базы данных opr_raboty..." "INFO"
& $pgPath -U postgres -c "CREATE DATABASE opr_raboty;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Status "База данных создана успешно" "OK"
} else {
    Write-Status "База данных уже существует (это нормально)" "WARNING"
}

# Очистка переменной окружения
Remove-Item Env:\PGPASSWORD

# ========================================
# ШАГ 4: Установка Backend
# ========================================
Write-Host ""
Write-Host "ШАГ 4: Установка Backend..." -ForegroundColor Yellow
Write-Host ""

Set-Location $backendPath

# Установка зависимостей
Write-Status "Установка npm зависимостей..." "INFO"
npm install --silent

if ($LASTEXITCODE -eq 0) {
    Write-Status "Зависимости установлены" "OK"
} else {
    Write-Status "Ошибка установки зависимостей!" "ERROR"
    exit 1
}

# Создание директорий
Write-Status "Создание директорий..." "INFO"
$dirs = @("uploads\profiles", "uploads\faces", "uploads\qrcodes", "uploads\work_photos", "logs")
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
Write-Status "Директории созданы" "OK"

# Создание .env файла
if (-not (Test-Path ".env")) {
    Write-Status "Создание .env файла..." "INFO"

    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

    # Получение IP адреса
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Select-Object -First 1).IPAddress
    if (-not $ipAddress) {
        $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1"} | Select-Object -First 1).IPAddress
    }

    $envContent = @"
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opr_raboty
DB_USER=postgres
DB_PASSWORD=$pgPasswordText

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRE=7d

# CompreFace Configuration
COMPREFACE_ENABLED=false
COMPREFACE_API_URL=http://localhost:8000
COMPREFACE_API_KEY=your_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8091,http://${ipAddress}:8091

# File Upload
MAX_FILE_SIZE=10485760
"@

    Set-Content -Path ".env" -Value $envContent
    Write-Status ".env файл создан" "OK"
} else {
    Write-Status ".env файл уже существует" "WARNING"
}

# Инициализация базы данных
Write-Status "Инициализация базы данных..." "INFO"
Write-Host "    (это может занять несколько секунд)" -ForegroundColor Gray

$initProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 5
Stop-Process -Id $initProcess.Id -Force -ErrorAction SilentlyContinue

Write-Status "База данных инициализирована" "OK"

# Создание тестовых данных
$createSeed = Read-Host "Создать тестовые данные? (Y/N)"
if ($createSeed -eq "Y" -or $createSeed -eq "y") {
    Write-Status "Создание тестовых данных..." "INFO"
    node seed.js
    Write-Status "Тестовые данные созданы" "OK"
}

# ========================================
# ШАГ 5: Установка Frontend
# ========================================
Write-Host ""
Write-Host "ШАГ 5: Установка Frontend..." -ForegroundColor Yellow
Write-Host ""

Set-Location $frontendPath

# Установка зависимостей
Write-Status "Установка npm зависимостей..." "INFO"
npm install --silent

if ($LASTEXITCODE -eq 0) {
    Write-Status "Зависимости установлены" "OK"
} else {
    Write-Status "Ошибка установки зависимостей!" "ERROR"
    exit 1
}

# Создание .env.production
if (-not (Test-Path ".env.production")) {
    Write-Status "Создание .env.production..." "INFO"

    $envProdContent = @"
VITE_API_URL=http://${ipAddress}:5000/api
VITE_APP_NAME=Департамент пробации КР
"@

    Set-Content -Path ".env.production" -Value $envProdContent
    Write-Status ".env.production создан" "OK"
}

# Сборка Frontend
Write-Status "Сборка Frontend (это займет 1-2 минуты)..." "INFO"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Status "Frontend собран успешно" "OK"
} else {
    Write-Status "Ошибка сборки Frontend!" "ERROR"
    exit 1
}

# ========================================
# ШАГ 6: Установка PM2
# ========================================
Write-Host ""
Write-Host "ШАГ 6: Установка PM2..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-ProgramInstalled "pm2")) {
    Write-Status "Установка PM2..." "INFO"
    npm install -g pm2
    npm install -g pm2-windows-service
    Write-Status "PM2 установлен" "OK"
} else {
    Write-Status "PM2 уже установлен" "OK"
}

# Запуск Backend через PM2
Set-Location $backendPath
Write-Status "Запуск Backend через PM2..." "INFO"

# Остановить если уже запущен
pm2 stop opr-raboty-backend 2>&1 | Out-Null
pm2 delete opr-raboty-backend 2>&1 | Out-Null

# Запустить
pm2 start server.js --name opr-raboty-backend
pm2 save

Write-Status "Backend запущен" "OK"

# Установка PM2 как службы Windows
$installService = Read-Host "Установить PM2 как службу Windows? (Y/N)"
if ($installService -eq "Y" -or $installService -eq "y") {
    Write-Status "Установка PM2 как службы..." "INFO"
    pm2-service-install -n PM2
    Start-Service PM2
    Write-Status "PM2 служба установлена и запущена" "OK"
}

# ========================================
# ШАГ 7: Настройка Firewall
# ========================================
Write-Host ""
Write-Host "ШАГ 7: Настройка Firewall..." -ForegroundColor Yellow
Write-Host ""

$setupFirewall = Read-Host "Настроить правила Firewall? (Y/N)"
if ($setupFirewall -eq "Y" -or $setupFirewall -eq "y") {

    Write-Status "Добавление правил Firewall..." "INFO"

    # Backend порт 5000
    New-NetFirewallRule -DisplayName "OPR Backend API" `
        -Direction Inbound `
        -LocalPort 5000 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction SilentlyContinue | Out-Null

    # Frontend порт 8091
    New-NetFirewallRule -DisplayName "OPR Frontend Web" `
        -Direction Inbound `
        -LocalPort 8091 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction SilentlyContinue | Out-Null

    Write-Status "Firewall настроен" "OK"
}

# ========================================
# ШАГ 8: Проверка установки
# ========================================
Write-Host ""
Write-Host "ШАГ 8: Проверка установки..." -ForegroundColor Yellow
Write-Host ""

# Проверка PM2
$pm2Status = pm2 status
if ($pm2Status -match "online") {
    Write-Status "Backend работает" "OK"
} else {
    Write-Status "Backend НЕ запущен!" "ERROR"
}

# Проверка API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Status "API отвечает" "OK"
    }
} catch {
    Write-Status "API не отвечает!" "WARNING"
}

# ========================================
# ГОТОВО!
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Установка завершена успешно!          " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Информация о доступе:" -ForegroundColor Cyan
Write-Host "  Backend API:  http://${ipAddress}:5000/api" -ForegroundColor White
Write-Host "  Frontend:     http://${ipAddress}:8091" -ForegroundColor White
Write-Host ""
Write-Host "  Логин:        admin@probation.kg" -ForegroundColor White
Write-Host "  Пароль:       admin123456" -ForegroundColor White
Write-Host ""

Write-Host "Для настройки IIS выполните:" -ForegroundColor Yellow
Write-Host "  .\scripts\setup-iis.ps1" -ForegroundColor White
Write-Host ""

Write-Host "Полезные команды:" -ForegroundColor Cyan
Write-Host "  pm2 status                          # Статус Backend" -ForegroundColor Gray
Write-Host "  pm2 logs opr-raboty-backend         # Логи Backend" -ForegroundColor Gray
Write-Host "  pm2 restart opr-raboty-backend      # Перезапуск Backend" -ForegroundColor Gray
Write-Host ""

Write-Host "Документация: WINDOWS_SERVER_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

# Открыть браузер
$openBrowser = Read-Host "Открыть Frontend в браузере? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    # Проверить что IIS настроен
    if ((Get-Website -Name "OPR-Raboty-Frontend" -ErrorAction SilentlyContinue)) {
        Start-Process "http://${ipAddress}:8091"
    } else {
        Write-Status "IIS еще не настроен. Запустите .\scripts\setup-iis.ps1" "WARNING"
    }
}

Write-Host "Готово! Спасибо за использование OPR Raboty!" -ForegroundColor Green
Write-Host ""
