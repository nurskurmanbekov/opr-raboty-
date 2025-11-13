# 🏛️ ПОЛНАЯ СПЕЦИФИКАЦИЯ СИСТЕМЫ МОНИТОРИНГА
## Департамент пробации КР - v2.0

**Дата:** 15 января 2025  
**Для:** Claude Code  
**Статус:** Готова к реализации

---

## 📑 КРАТКОЕ СОДЕРЖАНИЕ

Эта спецификация содержит ПОЛНУЮ информацию для обновления системы:

### ЧТО НУЖНО ДОБАВИТЬ/ИЗМЕНИТЬ:

**1. РОЛИ (обновить права доступа):**
- superadmin - полный доступ
- district_head - заведующий района (может переназначать клиентов)
- district_officer - районный сотрудник (создает клиентов только на себя)
- client - клиенты

**2. МТУ (Места Работы) - НОВЫЙ ФУНКЦИОНАЛ:**
- Создание МТУ с КВАДРАТНОЙ геозоной (50м - 1км)
- Автоматическая генерация QR кода для каждого МТУ
- PDF для печати с QR кодом и инструкцией
- Назначение клиентов на МТУ

**3. FACE ID с CompreFace - НОВЫЙ ФУНКЦИОНАЛ:**
- Загрузка 3-5 фото лица при регистрации клиента
- Liveness Detection (3 фото: влево, вправо, анфас)
- До 10 попыток Face ID
- Блокировка на 30 минут после 10 неудач

**4. ОПИСАНИЕ РАБОТЫ - НОВОЕ ПОЛЕ:**
- Клиент пишет описание при завершении работы
- Минимум 20 символов обязательно
- Офицер видит описание при проверке

---

## 1. ИЗМЕНЕНИЯ В РОЛЯХ

### Новая иерархия:

```
SUPERADMIN
    ├─ DISTRICT_HEAD (Заведующий)
    │    └─ DISTRICT_OFFICER (Сотрудник) × 5-6
    │         └─ CLIENT (Клиенты) × N
    └─ ANALYST (только просмотр)
```

### Права доступа - таблица:

| Действие | super | head | officer | client |
|----------|-------|------|---------|--------|
| Создать МТУ | ✅ | ❌ | ❌ | ❌ |
| Создать officer | ✅ | ✅ | ❌ | ❌ |
| Создать client | ❌ | ❌ | ✅ | ❌ |
| Удалить client | ✅ | ❌ | ❌ | ❌ |
| Переназначить client | ❌ | ✅ | ❌ | ❌ |
| Видеть всех | ✅ | район | своих | себя |

---

## 2. БАЗА ДАННЫХ - НОВЫЕ ТАБЛИЦЫ

### Таблица: mtu_locations
```sql
CREATE TABLE mtu_locations (
  id SERIAL PRIMARY KEY,
  mtu_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address TEXT,
  
  -- Квадратная геозона:
  geofence_type VARCHAR(20) DEFAULT 'square',
  geofence_center_lat DECIMAL(10, 8),
  geofence_center_lon DECIMAL(11, 8),
  geofence_size INTEGER,  -- метров (50-1000)
  geofence_north DECIMAL(10, 8),
  geofence_south DECIMAL(10, 8),
  geofence_east DECIMAL(11, 8),
  geofence_west DECIMAL(11, 8),
  
  -- QR код:
  qr_code_data TEXT,
  qr_code_image_url TEXT,
  qr_pdf_url TEXT,
  
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: client_mtu_assignments
```sql
CREATE TABLE client_mtu_assignments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id),
  mtu_id INTEGER REFERENCES mtu_locations(id),
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, mtu_id)
);
```

### Таблица: client_faces
```sql
CREATE TABLE client_faces (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  photo_path VARCHAR(500),
  photo_type VARCHAR(50),  -- 'frontal', 'left', 'right'
  compreFace_image_id VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: face_verification_attempts
```sql
CREATE TABLE face_verification_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  work_session_id INTEGER,
  attempt_number INTEGER,  -- 1-10
  similarity_score DECIMAL(5,4),
  liveness_check BOOLEAN,
  success BOOLEAN,
  photo_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Обновить таблицу users:
```sql
ALTER TABLE users 
ADD COLUMN compreFace_subject_id VARCHAR(255),
ADD COLUMN face_registered BOOLEAN DEFAULT false,
ADD COLUMN face_registered_at TIMESTAMP;
```

### Обновить таблицу work_sessions:
```sql
ALTER TABLE work_sessions
ADD COLUMN work_description TEXT;  -- описание от клиента
```

---

## 3. COMPREFACE - УСТАНОВКА

### Docker Compose (добавить):
```yaml
compreface_db:
  image: postgres:15
  environment:
    POSTGRES_DB: compreface
    POSTGRES_USER: compreface
    POSTGRES_PASSWORD: compreface_pwd
  volumes:
    - compreface_db:/var/lib/postgresql/data

compreface_admin:
  image: exadel/compreface-admin:latest
  environment:
    POSTGRES_URL: jdbc:postgresql://compreface_db:5432/compreface
  ports:
    - "8001:8080"

compreface_api:
  image: exadel/compreface-api:latest
  environment:
    POSTGRES_URL: jdbc:postgresql://compreface_db:5432/compreface
  ports:
    - "8002:8080"

compreface_core:
  image: exadel/compreface-core:latest
  ports:
    - "8003:3000"
```

### .env переменные:
```
COMPREFACE_API_URL=http://compreface_api:8080
COMPREFACE_API_KEY=<получить_из_admin>
FACE_SIMILARITY_THRESHOLD=0.85
FACE_MAX_ATTEMPTS=10
```

---

## 4. BACKEND API - НОВЫЕ ENDPOINTS

### POST /api/mtu/create (только superadmin)
```javascript
Request:
{
  name: "Парк Ата-Тюрк",
  district: "Bishkek",
  address: "ул. Киевская, 1",
  geofence_center_lat: 42.8746,
  geofence_center_lon: 74.5698,
  geofence_size: 500  // метров
}

Response:
{
  success: true,
  mtu_code: "MTU_BISHKEK_001",
  qr_code_url: "/qr-codes/MTU_BISHKEK_001.png",
  qr_pdf_url: "/pdf/MTU_BISHKEK_001.pdf"
}
```

### POST /api/face-verification/verify
```javascript
Request:
{
  user_id: 123,
  mtu_id: 1,
  photos: [base64_left, base64_right, base64_frontal],
  gps_location: {lat: 42.8746, lon: 74.5698}
}

Response (Success):
{
  success: true,
  similarity: 0.9786,
  liveness: true,
  message: "Личность подтверждена"
}

Response (Failure):
{
  success: false,
  attempts_left: 7,
  message: "Лицо не распознано"
}
```

### POST /api/users/create (обновить)
```javascript
Request:
{
  full_name: "...",
  // ... другие поля
  assigned_mtu: [1, 3, 5],  // ID МТУ (NEW!)
  face_photos: [            // NEW!
    {data: base64, type: "frontal"},
    {data: base64, type: "left"},
    {data: base64, type: "right"}
  ]
}
```

### POST /api/work-sessions/complete (обновить)
```javascript
Request:
{
  work_session_id: 789,
  photos: [...],  // минимум 3
  work_description: "..."  // NEW! минимум 20 символов
}
```

---

## 5. FRONTEND - НОВЫЕ КОМПОНЕНТЫ

### Создать: components/FacePhotosUpload.jsx
```jsx
// Загрузка 3-5 фото лица клиента
// Drag & drop или выбор файла
// Превью + валидация
// Минимум 3 фото обязательно
```

### Создать: components/MTUMapPicker.jsx
```jsx
// Карта Leaflet с квадратной геозоной
// Клик по карте → центр
// Ползунок: 50-1000 метров
// Rectangle для отображения квадрата
// Автоматический расчет границ
```

### Создать: pages/CreateMTUPage.jsx
```jsx
// Форма создания МТУ
// Использует MTUMapPicker
// Генерирует QR и PDF
```

### Обновить: pages/CreateClientPage.jsx
```jsx
// Добавить:
// 1. <FacePhotosUpload /> (3-5 фото)
// 2. Checkbox список МТУ
// 3. Валидация
```

### Обновить: pages/SessionDetailsPage.jsx
```jsx
// Добавить отображение:
// - work_description от клиента
// - Квадратная геозона на карте
```

---

## 6. MOBILE APP - НОВЫЕ ЭКРАНЫ

### Создать: QRScannerScreen.js
```javascript
// Сканер QR кода
// expo-barcode-scanner
// Отправка на backend для проверки
```

### Создать: FaceVerificationScreen.js
```javascript
// Face ID с Liveness Detection
// 3 этапа:
// 1. "Поверните голову влево" → фото
// 2. "Поверните голову вправо" → фото
// 3. "Смотрите прямо" → фото
// Отправка на backend
// 10 попыток с подсказками
```

### Создать: CompleteSessionScreen.js
```javascript
// Форма завершения работы
// - Загрузка 3+ фото
// - Текстовое поле описания (минимум 20 символов)
// - Валидация перед отправкой
```

### Обновить: WorkSessionScreen.js
```javascript
// Добавить:
// - Индикатор Face ID прошел
// - Проверка квадратной геозоны
```

---

## 7. ПРОЦЕСС РАБОТЫ КЛИЕНТА (ПОЛНЫЙ)

```
1. Клиент приходит на МТУ
2. Сканирует QR код
3. Backend проверяет: МТУ, назначение, геозона
4. Face ID: 3 фото (влево, вправо, анфас)
5. CompreFace проверяет (similarity > 0.85)
6. Если ОК → начать сессию + GPS каждые 30 сек
7. Работа 4-8 часов
8. Завершить → загрузить 3+ фото + описание
9. Офицер проверяет → одобрить/отклонить
10. Если одобрено → часы засчитаны
```

---

## 8. КВАДРАТНАЯ ГЕОЗОНА - КАК РАБОТАЕТ

### Проверка попадания в квадрат:
```javascript
function isInSquare(lat, lon, bounds) {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lon >= bounds.west &&
    lon <= bounds.east
  );
}
```

### Расчет границ из центра + размера:
```javascript
function calculateSquareBounds(centerLat, centerLon, sizeMeters) {
  const latDelta = (sizeMeters / 2) / 111000;
  const lonDelta = (sizeMeters / 2) / (111000 * Math.cos(centerLat * Math.PI / 180));
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
}
```

---

## 9. ГЕНЕРАЦИЯ QR КОДА И PDF

### Backend - генерация QR:
```javascript
const QRCode = require('qrcode');

// Данные для QR:
const qrData = {
  type: "mtu_checkin",
  mtu_id: 1,
  mtu_code: "MTU_BISHKEK_001",
  name: "Парк Ата-Тюрк"
};

// Генерация PNG:
await QRCode.toFile(
  '/public/qr-codes/MTU_BISHKEK_001.png',
  JSON.stringify(qrData),
  { width: 500 }
);
```

### Backend - генерация PDF:
```javascript
const PDFDocument = require('pdfkit');

const doc = new PDFDocument();
doc.fontSize(24).text('МЕСТО ОБЩЕСТВЕННЫХ РАБОТ');
doc.fontSize(16).text(`Название: ${mtu.name}`);
doc.image(qrCodePath, { fit: [300, 300] });
doc.text('Инструкция: ...');
doc.end();
```

---

## 10. ПРИОРИТЕТЫ РЕАЛИЗАЦИИ

### Первая очередь:
1. БД таблицы (mtu_locations, client_faces, и т.д.)
2. CompreFace Docker
3. Backend API для МТУ и Face ID
4. Frontend: FacePhotosUpload
5. Frontend: MTUMapPicker
6. Mobile: QRScanner
7. Mobile: FaceVerification

### Вторая очередь:
- Описание работы
- PDF генерация
- Оффлайн синхронизация Face ID
- Улучшенный UI

---

## 11. ЧЕКЛИСТ ТЕСТИРОВАНИЯ

**Backend:**
- [ ] Создать МТУ с QR кодом
- [ ] Создать клиента с 3 фото
- [ ] Face ID проверка работает
- [ ] QR код проверяется
- [ ] Квадратная геозона работает
- [ ] Описание работы сохраняется

**Frontend:**
- [ ] Создать МТУ на карте
- [ ] Загрузить 3-5 фото лица
- [ ] Скачать QR и PDF
- [ ] Просмотр сессии с описанием

**Mobile:**
- [ ] QR сканер
- [ ] Face ID (3 фото)
- [ ] 10 попыток работает
- [ ] Описание работы
- [ ] Оффлайн режим

---

## 12. КОНТАКТЫ И ДОКУМЕНТАЦИЯ

**CompreFace:**
- Docs: https://github.com/exadel-inc/CompreFace
- API: http://localhost:8002 после запуска

**React Leaflet:**
- Docs: https://react-leaflet.js.org/

**Expo:**
- Docs: https://docs.expo.dev/

---

**КОНЕЦ СПЕЦИФИКАЦИИ**

Все необходимое для Claude Code реализации системы! 🚀
