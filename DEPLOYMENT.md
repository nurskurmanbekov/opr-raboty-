# 🚀 Развертывание на Ubuntu сервере с Docker

Полная инструкция по развертыванию системы пробации на Ubuntu сервере с использованием Docker.

## 📋 Требования

- Ubuntu 20.04+ (у вас 24.04 LTS ✅)
- Минимум 4GB RAM (рекомендуется 8GB для CompreFace)
- 20GB свободного места на диске
- Доступ к интернету

## 🔧 Шаг 1: Установка Docker

```bash
# Подключиться к серверу
ssh opr@10.99.7.100

# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
sudo apt install -y docker.io docker-compose

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Применить изменения (или перезайти)
newgrp docker

# Проверить установку
docker --version
docker-compose --version
```

## 📥 Шаг 2: Клонировать проект

```bash
cd ~
git clone https://github.com/nurskurmanbekov/opr-raboty-.git
cd opr-raboty-
```

## ⚙️ Шаг 3: Настройка окружения

```bash
# Скопировать пример конфигурации
cp .env.production.example .env.production

# Отредактировать файл (замените пароли и ключи!)
nano .env.production
```

**Обязательно измените:**
- `DB_PASSWORD` - пароль PostgreSQL
- `JWT_SECRET` - секретный ключ JWT (длинная случайная строка)
- `VITE_API_URL` - URL вашего backend API (например: `http://10.99.7.100:5000`)
- `ALLOWED_ORIGINS` - URL вашего frontend (например: `http://10.99.7.100:3000`)

## 🐳 Шаг 4: Запуск всех сервисов

```bash
# Запустить всё одной командой!
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# Посмотреть статус
docker-compose -f docker-compose.production.yml ps

# Посмотреть логи
docker-compose -f docker-compose.production.yml logs -f
```

## 📊 Шаг 5: Проверка запуска

### Проверить, что все контейнеры запустились:

```bash
docker ps
```

Должны быть запущены:
- ✅ `probation_postgres` (порт 5432)
- ✅ `probation_backend` (порт 5000)
- ✅ `probation_frontend` (порт 3000)
- ✅ `compreface_postgres` (внутренний)
- ✅ `compreface_admin` (порт 8001)
- ✅ `compreface_api` (порт 8002)
- ✅ `compreface_core` (порт 8003)

### Проверить доступность сервисов:

```bash
# Backend API
curl http://10.99.7.100:5000/api

# Frontend
curl http://10.99.7.100:3000

# CompreFace Admin
curl http://10.99.7.100:8001/admin
```

## 🗄️ Шаг 6: Инициализация базы данных

```bash
# Зайти в контейнер backend
docker exec -it probation_backend sh

# Внутри контейнера выполнить миграции
npx sequelize-cli db:migrate

# Создать первого superadmin пользователя (опционально)
node seed.js

# Выйти из контейнера
exit
```

## 🔑 Шаг 7: Настройка CompreFace

1. Откройте в браузере: `http://10.99.7.100:8001/admin`
2. Зарегистрируйте аккаунт администратора
3. Создайте новое приложение (Application)
4. Скопируйте API Key
5. Обновите `.env.production`:
   ```bash
   nano .env.production
   # Добавьте скопированный ключ:
   COMPREFACE_API_KEY=ваш_api_key_здесь
   ```
6. Перезапустите backend:
   ```bash
   docker-compose -f docker-compose.production.yml restart backend
   ```

## 🌐 Доступ к приложению

После успешного запуска:

- **Frontend (Web-интерфейс):** http://10.99.7.100:3000
- **Backend API:** http://10.99.7.100:5000
- **CompreFace Admin:** http://10.99.7.100:8001/admin
- **Swagger API Docs:** http://10.99.7.100:5000/api-docs (если настроен)

## 📝 Полезные команды

### Управление контейнерами:

```bash
# Остановить все сервисы
docker-compose -f docker-compose.production.yml stop

# Запустить все сервисы
docker-compose -f docker-compose.production.yml start

# Перезапустить все сервисы
docker-compose -f docker-compose.production.yml restart

# Остановить и удалить контейнеры (данные сохранятся)
docker-compose -f docker-compose.production.yml down

# Остановить и удалить контейнеры И данные (осторожно!)
docker-compose -f docker-compose.production.yml down -v
```

### Логи:

```bash
# Посмотреть все логи
docker-compose -f docker-compose.production.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs postgres

# Следить за логами в реальном времени
docker-compose -f docker-compose.production.yml logs -f backend
```

### Зайти в контейнер:

```bash
# Backend
docker exec -it probation_backend sh

# PostgreSQL
docker exec -it probation_postgres psql -U postgres -d probation_db

# Frontend (nginx)
docker exec -it probation_frontend sh
```

## 🔄 Обновление приложения

```bash
# Остановить сервисы
docker-compose -f docker-compose.production.yml stop backend frontend

# Получить последние изменения
git pull origin main

# Пересобрать и запустить
docker-compose -f docker-compose.production.yml up -d --build backend frontend

# Выполнить новые миграции (если есть)
docker exec -it probation_backend npx sequelize-cli db:migrate
```

## 🔒 Безопасность

### Firewall (UFW):

```bash
# Установить UFW
sudo apt install ufw

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Разрешить порты приложения
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 8001/tcp  # CompreFace Admin

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

### SSL сертификат (рекомендуется):

Используйте Nginx как reverse proxy с Let's Encrypt:

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🧹 Обслуживание

### Очистка Docker:

```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a --volumes
```

### Бэкап базы данных:

```bash
# Создать backup
docker exec probation_postgres pg_dump -U postgres probation_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из backup
cat backup_20251113_120000.sql | docker exec -i probation_postgres psql -U postgres probation_db
```

## 🆘 Решение проблем

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.production.yml logs имя_сервиса

# Проверить статус
docker-compose -f docker-compose.production.yml ps
```

### Проблема: База данных не доступна

```bash
# Проверить PostgreSQL
docker exec probation_postgres pg_isready -U postgres

# Зайти в PostgreSQL
docker exec -it probation_postgres psql -U postgres
```

### Проблема: Недостаточно памяти для CompreFace

Уменьшите выделяемую память в `docker-compose.production.yml`:
```yaml
ADMIN_JAVA_OPTS: -Xmx1g  # было -Xmx2g
API_JAVA_OPTS: -Xmx1g    # было -Xmx2g
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте конфигурацию `.env.production`
3. Убедитесь что все порты свободны: `sudo netstat -tulpn`

---

🎉 **Готово!** Система развернута и готова к работе!
