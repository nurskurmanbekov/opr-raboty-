# PowerShell скрипт для настройки IP адреса (Windows)

Write-Host "🔧 Настройка IP адреса для мобильного приложения" -ForegroundColor Green
Write-Host ""

# Получаем IP адрес WiFi адаптера
$IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object -First 1).IPAddress

if (-not $IP) {
    # Если WiFi не найден, пробуем Ethernet
    $IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Select-Object -First 1).IPAddress
}

if (-not $IP) {
    Write-Host "❌ Не удалось определить IP адрес автоматически" -ForegroundColor Red
    Write-Host ""
    Write-Host "Узнайте IP вручную:" -ForegroundColor Yellow
    Write-Host "  1. Откройте командную строку (cmd)"
    Write-Host "  2. Введите: ipconfig"
    Write-Host "  3. Найдите IPv4 Address в разделе WiFi адаптера"
    Write-Host ""
    exit 1
}

Write-Host "📍 Обнаружен IP адрес: " -ForegroundColor Yellow -NoNewline
Write-Host $IP -ForegroundColor Green
Write-Host ""

# Создаем .env файл
$ENV_FILE = ".env"
$API_URL = "http://${IP}:5000/api"

"EXPO_PUBLIC_API_URL=$API_URL" | Out-File -FilePath $ENV_FILE -Encoding utf8

Write-Host "✅ Файл .env создан успешно!" -ForegroundColor Green
Write-Host ""
Write-Host "Настройки:" -ForegroundColor Yellow
Write-Host "  API URL: $API_URL"
Write-Host ""
Write-Host "📱 Теперь можете собрать APK:" -ForegroundColor Green
Write-Host "  eas build --profile preview --platform android"
Write-Host ""
Write-Host "⚠️  Убедитесь что:" -ForegroundColor Yellow
Write-Host "  1. Бэкенд запущен на порту 5000"
Write-Host "  2. Телефон и компьютер в одной WiFi сети"
Write-Host "  3. Windows Firewall разрешает подключения на порт 5000"
Write-Host ""
Write-Host "🔥 Как открыть порт 5000 в Windows Firewall:" -ForegroundColor Cyan
Write-Host "  1. Панель управления → Брандмауэр Windows"
Write-Host "  2. Дополнительные параметры"
Write-Host "  3. Правила для входящих подключений → Создать правило"
Write-Host "  4. Порт → TCP → 5000 → Разрешить подключение"
Write-Host ""
