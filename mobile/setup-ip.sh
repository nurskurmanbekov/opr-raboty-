#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Настройка IP адреса для мобильного приложения${NC}"
echo ""

# Определяем IP адрес автоматически
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
else
    echo -e "${RED}❌ Неподдерживаемая ОС. Укажите IP вручную.${NC}"
    exit 1
fi

if [ -z "$IP" ]; then
    echo -e "${RED}❌ Не удалось определить IP адрес автоматически${NC}"
    echo ""
    echo "Узнайте IP вручную:"
    echo "  Windows: ipconfig"
    echo "  Linux: hostname -I"
    echo "  macOS: ipconfig getifaddr en0"
    exit 1
fi

echo -e "${YELLOW}📍 Обнаружен IP адрес: ${GREEN}$IP${NC}"
echo ""

# Создаем .env файл
ENV_FILE=".env"
API_URL="http://$IP:5000/api"

echo "EXPO_PUBLIC_API_URL=$API_URL" > $ENV_FILE

echo -e "${GREEN}✅ Файл .env создан успешно!${NC}"
echo ""
echo -e "${YELLOW}Настройки:${NC}"
echo "  API URL: $API_URL"
echo ""
echo -e "${GREEN}📱 Теперь можете собрать APK:${NC}"
echo "  eas build --profile preview --platform android"
echo ""
echo -e "${YELLOW}⚠️  Убедитесь что:${NC}"
echo "  1. Бэкенд запущен на порту 5000"
echo "  2. Телефон и компьютер в одной WiFi сети"
echo "  3. Firewall разрешает подключения на порт 5000"
echo ""
