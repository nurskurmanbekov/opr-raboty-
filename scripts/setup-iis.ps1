# ========================================================
# Настройка IIS для Frontend
# ========================================================
#
# Использование:
#   1. Запустите PowerShell от администратора
#   2. Выполните:
#      Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#      .\scripts\setup-iis.ps1
#
# ========================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Настройка IIS для OPR Raboty          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[✗] Запустите PowerShell от имени администратора!" -ForegroundColor Red
    exit 1
}

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
# Проверка и установка IIS
# ========================================
Write-Host "Шаг 1: Проверка IIS..." -ForegroundColor Yellow
Write-Host ""

$iisInstalled = (Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole).State -eq "Enabled"

if (-not $iisInstalled) {
    Write-Status "IIS не установлен. Устанавливаем..." "WARNING"

    # Установка IIS
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit -All -NoRestart

    Write-Status "IIS установлен" "OK"
    Write-Host ""
    Write-Status "ТРЕБУЕТСЯ ПЕРЕЗАГРУЗКА!" "WARNING"
    Write-Host "После перезагрузки запустите этот скрипт снова." -ForegroundColor Yellow

    $reboot = Read-Host "Перезагрузить сейчас? (Y/N)"
    if ($reboot -eq "Y" -or $reboot -eq "y") {
        Restart-Computer -Force
    }
    exit 0
} else {
    Write-Status "IIS установлен" "OK"
}

# Импорт модуля WebAdministration
Import-Module WebAdministration -ErrorAction SilentlyContinue

# ========================================
# Проверка URL Rewrite Module
# ========================================
Write-Host ""
Write-Host "Шаг 2: Проверка URL Rewrite Module..." -ForegroundColor Yellow
Write-Host ""

$urlRewriteInstalled = Test-Path "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite"

if (-not $urlRewriteInstalled) {
    Write-Status "URL Rewrite Module НЕ установлен!" "ERROR"
    Write-Host ""
    Write-Host "Скачайте и установите URL Rewrite Module:" -ForegroundColor Yellow
    Write-Host "https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor White
    Write-Host ""

    $download = Read-Host "Открыть страницу загрузки? (Y/N)"
    if ($download -eq "Y" -or $download -eq "y") {
        Start-Process "https://www.iis.net/downloads/microsoft/url-rewrite"
    }

    Write-Host "После установки запустите этот скрипт снова." -ForegroundColor Yellow
    exit 1
} else {
    Write-Status "URL Rewrite Module установлен" "OK"
}

# ========================================
# Определение пути к проекту
# ========================================
Write-Host ""
Write-Host "Шаг 3: Настройка путей..." -ForegroundColor Yellow
Write-Host ""

$projectPath = $PSScriptRoot | Split-Path -Parent
$frontendDistPath = Join-Path $projectPath "frontend\dist"

Write-Status "Путь к проекту: $projectPath" "INFO"
Write-Status "Путь к frontend: $frontendDistPath" "INFO"

# Проверка что frontend собран
if (-not (Test-Path $frontendDistPath)) {
    Write-Status "Frontend не собран!" "ERROR"
    Write-Host "Выполните сначала: cd frontend && npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Status "Frontend найден" "OK"

# ========================================
# Создание Application Pool
# ========================================
Write-Host ""
Write-Host "Шаг 4: Создание Application Pool..." -ForegroundColor Yellow
Write-Host ""

$appPoolName = "OPR-Raboty-Pool"

# Удалить если существует
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Status "Application Pool уже существует, пересоздаем..." "WARNING"
    Remove-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
}

# Создать новый
New-WebAppPool -Name $appPoolName | Out-Null

# Настроить Application Pool
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"

Write-Status "Application Pool создан: $appPoolName" "OK"

# ========================================
# Создание сайта
# ========================================
Write-Host ""
Write-Host "Шаг 5: Создание веб-сайта..." -ForegroundColor Yellow
Write-Host ""

$siteName = "OPR-Raboty-Frontend"
$port = 8091

# Удалить если существует
if (Get-Website -Name $siteName -ErrorAction SilentlyContinue) {
    Write-Status "Сайт уже существует, удаляем..." "WARNING"
    Remove-Website -Name $siteName -ErrorAction SilentlyContinue
}

# Остановить Default Web Site
Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

# Создать новый сайт
New-Website -Name $siteName `
    -Port $port `
    -PhysicalPath $frontendDistPath `
    -ApplicationPool $appPoolName `
    -Force | Out-Null

Write-Status "Сайт создан: $siteName на порту $port" "OK"

# ========================================
# Настройка web.config для SPA
# ========================================
Write-Host ""
Write-Host "Шаг 6: Настройка URL Rewrite..." -ForegroundColor Yellow
Write-Host ""

$webConfigPath = Join-Path $frontendDistPath "web.config"
$webConfigContent = @'
<?xml version="1.0" encoding="utf-8"?>
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
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
    </staticContent>
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
'@

Set-Content -Path $webConfigPath -Value $webConfigContent -Force
Write-Status "web.config создан" "OK"

# ========================================
# Запуск сайта
# ========================================
Write-Host ""
Write-Host "Шаг 7: Запуск сайта..." -ForegroundColor Yellow
Write-Host ""

Start-Website -Name $siteName
Write-Status "Сайт запущен" "OK"

# ========================================
# Проверка
# ========================================
Write-Host ""
Write-Host "Шаг 8: Проверка..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

# Получить IP адрес
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Select-Object -First 1).IPAddress
if (-not $ipAddress) {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1"} | Select-Object -First 1).IPAddress
}

$url = "http://localhost:$port"

try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Status "Сайт доступен" "OK"
    }
} catch {
    Write-Status "Сайт не отвечает!" "ERROR"
    Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# Информация
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  IIS настроен успешно!                 " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Информация о сайте:" -ForegroundColor Cyan
Write-Host "  Имя сайта:      $siteName" -ForegroundColor White
Write-Host "  Application Pool: $appPoolName" -ForegroundColor White
Write-Host "  Порт:           $port" -ForegroundColor White
Write-Host "  Путь:           $frontendDistPath" -ForegroundColor White
Write-Host ""

Write-Host "Доступ:" -ForegroundColor Cyan
Write-Host "  Локально:       http://localhost:$port" -ForegroundColor White
Write-Host "  Из сети:        http://${ipAddress}:$port" -ForegroundColor White
Write-Host ""

Write-Host "Полезные команды:" -ForegroundColor Cyan
Write-Host "  Start-Website -Name '$siteName'     # Запустить сайт" -ForegroundColor Gray
Write-Host "  Stop-Website -Name '$siteName'      # Остановить сайт" -ForegroundColor Gray
Write-Host "  Restart-Website -Name '$siteName'   # Перезапустить сайт" -ForegroundColor Gray
Write-Host "  iisreset                            # Перезапустить IIS" -ForegroundColor Gray
Write-Host ""

# Открыть IIS Manager
$openIIS = Read-Host "Открыть IIS Manager? (Y/N)"
if ($openIIS -eq "Y" -or $openIIS -eq "y") {
    Start-Process "inetmgr.exe"
}

# Открыть сайт в браузере
$openBrowser = Read-Host "Открыть сайт в браузере? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Start-Process $url
}

Write-Host ""
Write-Host "Готово!" -ForegroundColor Green
Write-Host ""
