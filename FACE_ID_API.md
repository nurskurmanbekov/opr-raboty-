# 🔐 Face ID API Документация

## Обзор

Face ID API обеспечивает биометрическую верификацию клиентов пробационной системы через распознавание лиц. Система использует CompreFace для сравнения лиц и требует минимальную схожесть 85% для успешной верификации.

**Базовый URL:** `http://localhost:5000/api`

**Аутентификация:** Все запросы требуют JWT токен в header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Содержание

- [1. Регистрация Face ID](#1-регистрация-face-id)
- [2. Верификация Face ID](#2-верификация-face-id)
- [3. Получение статуса Face ID](#3-получение-статуса-face-id)
- [4. Получение истории верификаций](#4-получение-истории-верификаций)
- [5. Получение статистики](#5-получение-статистики)
- [6. Удаление Face ID](#6-удаление-face-id)
- [7. Интеграция с Work Sessions](#7-интеграция-с-work-sessions)
- [8. Коды ошибок](#8-коды-ошибок)
- [9. Примеры использования](#9-примеры-использования)

---

## 1. Регистрация Face ID

Регистрирует Face ID для клиента. Каждый клиент может иметь только один зарегистрированный Face ID.

### Endpoint

```
POST /api/face-verification/register
```

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Request Body

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| faceImage | File | ✅ Да | Фото лица клиента (JPEG, JPG, PNG). Макс размер: 10MB |

### Требования к фото

- **Формат:** JPEG, JPG, PNG
- **Размер:** До 10 MB
- **Качество:**
  - Лицо должно занимать минимум 30% изображения
  - Хорошее освещение
  - Лицо должно быть видно полностью
  - Без солнцезащитных очков, масок
  - Фронтальный ракурс

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Face ID registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "faceImageUrl": "/uploads/faces/face-1234567890-123456789.jpg",
    "faceEncodingId": "img_abc123def456",
    "isRegistered": true,
    "verificationType": "registration",
    "verified": true,
    "similarity": 1.0,
    "confidence": 0.99,
    "createdAt": "2025-11-11T10:30:00.000Z"
  }
}
```

### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "No face detected in the image",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "verified": false,
    "similarity": null,
    "metadata": {
      "error": "No faces found"
    }
  }
}
```

### Response Error (409 Conflict)

```json
{
  "success": false,
  "message": "Face ID already registered for this user"
}
```

---

## 2. Верификация Face ID

Верифицирует лицо клиента против зарегистрированного Face ID. Используется при начале рабочих сессий.

### Endpoint

```
POST /api/face-verification/verify
```

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Request Body

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| faceImage | File | ✅ Да | Селфи для верификации |
| verificationType | String | ✅ Да | Тип верификации: `work_session_start`, `work_session_end`, `manual` |
| workSessionId | UUID | ❌ Нет | ID рабочей сессии (если `verificationType` = work_session_*) |
| photoId | UUID | ❌ Нет | ID фотографии (если применимо) |

### Response Success (200 OK) - Match

```json
{
  "success": true,
  "message": "Face verified successfully",
  "data": {
    "isMatch": true,
    "matchScore": 0.92,
    "threshold": 0.85,
    "verification": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "verified": true,
      "similarity": 0.92,
      "confidence": 0.91,
      "verificationType": "work_session_start",
      "workSessionId": "770e8400-e29b-41d4-a716-446655440002",
      "metadata": {
        "age": 28,
        "gender": "male",
        "genderConfidence": 0.98,
        "boundingBox": {
          "x_min": 120,
          "y_min": 80,
          "x_max": 320,
          "y_max": 380
        }
      },
      "createdAt": "2025-11-11T10:35:00.000Z"
    }
  }
}
```

### Response Success (200 OK) - No Match

```json
{
  "success": false,
  "message": "Face verification failed - no match",
  "data": {
    "isMatch": false,
    "matchScore": 0.62,
    "threshold": 0.85,
    "verification": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "verified": false,
      "similarity": 0.62,
      "confidence": 0.60,
      "verificationType": "work_session_start",
      "metadata": {
        "reason": "Similarity below threshold"
      },
      "createdAt": "2025-11-11T10:35:00.000Z"
    }
  }
}
```

### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Face ID not registered. Please register Face ID first."
}
```

---

## 3. Получение статуса Face ID

Проверяет, зарегистрирован ли Face ID для текущего пользователя.

### Endpoint

```
GET /api/face-verification/status
```

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "isRegistered": true,
    "registrationDate": "2025-11-10T14:20:00.000Z",
    "lastVerification": {
      "date": "2025-11-11T10:35:00.000Z",
      "success": true,
      "similarity": 0.92
    },
    "totalVerifications": 15,
    "successRate": 93.3
  }
}
```

### Response Success (200 OK) - Not Registered

```json
{
  "success": true,
  "data": {
    "isRegistered": false,
    "registrationDate": null,
    "lastVerification": null,
    "totalVerifications": 0,
    "successRate": 0
  }
}
```

---

## 4. Получение истории верификаций

Получает историю всех попыток верификации Face ID для пользователя.

### Endpoint

```
GET /api/face-verification/history
```

### Query Parameters

| Параметр | Тип | Обязательно | Описание | По умолчанию |
|----------|-----|-------------|----------|--------------|
| limit | Integer | ❌ Нет | Количество записей | 50 |
| offset | Integer | ❌ Нет | Смещение для пагинации | 0 |
| startDate | Date | ❌ Нет | Начальная дата (YYYY-MM-DD) | - |
| endDate | Date | ❌ Нет | Конечная дата (YYYY-MM-DD) | - |

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "verifications": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "verified": true,
        "similarity": 0.92,
        "confidence": 0.91,
        "verificationType": "work_session_start",
        "workSessionId": "770e8400-e29b-41d4-a716-446655440002",
        "metadata": {
          "age": 28,
          "gender": "male"
        },
        "createdAt": "2025-11-11T10:35:00.000Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "verified": false,
        "similarity": 0.62,
        "confidence": 0.60,
        "verificationType": "manual",
        "metadata": {
          "reason": "Similarity below threshold"
        },
        "createdAt": "2025-11-11T09:15:00.000Z"
      }
    ]
  }
}
```

---

## 5. Получение статистики

Получает статистику верификаций Face ID для пользователя за период.

### Endpoint

```
GET /api/face-verification/stats
```

### Query Parameters

| Параметр | Тип | Обязательно | Описание |
|----------|-----|-------------|----------|
| startDate | Date | ❌ Нет | Начальная дата (YYYY-MM-DD) |
| endDate | Date | ❌ Нет | Конечная дата (YYYY-MM-DD) |

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-11"
    },
    "totalVerifications": 15,
    "successfulVerifications": 14,
    "failedVerifications": 1,
    "successRate": 93.3,
    "averageSimilarity": 0.89,
    "byType": {
      "work_session_start": {
        "total": 10,
        "successful": 10,
        "failed": 0,
        "successRate": 100
      },
      "work_session_end": {
        "total": 4,
        "successful": 4,
        "failed": 0,
        "successRate": 100
      },
      "manual": {
        "total": 1,
        "successful": 0,
        "failed": 1,
        "successRate": 0
      }
    },
    "similarityDistribution": {
      "90-100%": 10,
      "85-90%": 4,
      "80-85%": 0,
      "below 80%": 1
    }
  }
}
```

---

## 6. Удаление Face ID

Удаляет регистрацию Face ID для пользователя. Доступно только администраторам.

### Endpoint

```
DELETE /api/face-verification/:userId
```

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| userId | UUID | ID пользователя |

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Face registration deleted successfully"
}
```

### Response Error (403 Forbidden)

```json
{
  "success": false,
  "message": "Permission denied"
}
```

### Response Error (404 Not Found)

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 7. Интеграция с Work Sessions

Face ID верификация интегрирована в процесс начала рабочих сессий.

### Endpoint

```
POST /api/work-sessions/start
```

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Request Body

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| photo | File | ✅ Да | Селфи для Face ID верификации |
| clientId | UUID | ✅ Да | ID клиента |
| startLatitude | Float | ✅ Да | Широта начальной точки |
| startLongitude | Float | ✅ Да | Долгота начальной точки |
| workLocation | String | ❌ Нет | Название местоположения |
| biometricType | String | ❌ Нет | Тип биометрии (по умолчанию: FaceID) |
| deviceId | String | ❌ Нет | ID устройства |

### Response Success (201 Created)

```json
{
  "success": true,
  "message": "✅ Рабочая сессия начата! Face ID верифицирован.",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "startTime": "2025-11-11T10:40:00.000Z",
    "startLatitude": 42.8746,
    "startLongitude": 74.5698,
    "workLocation": "Парк Ата-Тюрк",
    "status": "in_progress",
    "faceVerified": true,
    "verificationPhotoUrl": "/uploads/sessions/123-verify-1731323200000.jpg",
    "faceVerificationAttemptId": "660e8400-e29b-41d4-a716-446655440004",
    "biometricType": "FaceID",
    "faceVerificationConfidence": 0.92,
    "faceVerification": {
      "verified": true,
      "confidence": 0.92,
      "similarity": "92.0%"
    },
    "createdAt": "2025-11-11T10:40:00.000Z"
  }
}
```

### Response Error (400 Bad Request) - No Photo

```json
{
  "success": false,
  "message": "❌ Фото для Face ID верификации обязательно! Это требование антикоррупционной защиты."
}
```

### Response Error (400 Bad Request) - Not Registered

```json
{
  "success": false,
  "message": "❌ Face ID не зарегистрирован. Зарегистрируйте Face ID в настройках профиля.",
  "requireFaceRegistration": true
}
```

### Response Error (403 Forbidden) - Verification Failed

```json
{
  "success": false,
  "message": "❌ Face ID верификация не прошла! Ваше лицо не совпадает с зарегистрированным.",
  "faceVerificationFailed": true,
  "details": {
    "similarity": 0.62,
    "threshold": 0.85,
    "confidence": 0.60
  }
}
```

---

## 8. Коды ошибок

| HTTP Code | Описание | Причина |
|-----------|----------|---------|
| 200 | OK | Запрос выполнен успешно |
| 201 | Created | Ресурс создан успешно |
| 400 | Bad Request | Неверные параметры запроса, Face ID не зарегистрирован, нет фото |
| 401 | Unauthorized | Отсутствует или неверный JWT токен |
| 403 | Forbidden | Face ID верификация не прошла, нет прав доступа |
| 404 | Not Found | Пользователь не найден |
| 409 | Conflict | Face ID уже зарегистрирован |
| 413 | Payload Too Large | Размер файла превышает 10MB |
| 500 | Internal Server Error | Ошибка сервера, ошибка CompreFace |

### Структура ошибок

```json
{
  "success": false,
  "message": "Описание ошибки",
  "error": "Техническое сообщение (только в dev режиме)",
  "data": {
    "additionalInfo": "Дополнительная информация"
  }
}
```

---

## 9. Примеры использования

### 9.1 JavaScript/Fetch API

#### Регистрация Face ID

```javascript
const registerFaceId = async (faceImageFile) => {
  const formData = new FormData();
  formData.append('faceImage', faceImageFile);

  const response = await fetch('http://localhost:5000/api/face-verification/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Face ID registered:', result.data);
  } else {
    console.error('❌ Registration failed:', result.message);
  }

  return result;
};
```

#### Верификация Face ID

```javascript
const verifyFaceId = async (faceImageFile, workSessionId) => {
  const formData = new FormData();
  formData.append('faceImage', faceImageFile);
  formData.append('verificationType', 'work_session_start');
  formData.append('workSessionId', workSessionId);

  const response = await fetch('http://localhost:5000/api/face-verification/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  const result = await response.json();

  if (result.data.isMatch) {
    console.log(`✅ Verified! Similarity: ${result.data.matchScore * 100}%`);
  } else {
    console.log(`❌ Failed! Similarity: ${result.data.matchScore * 100}% (threshold: ${result.data.threshold * 100}%)`);
  }

  return result;
};
```

### 9.2 React Native/Expo

#### Сделать селфи и зарегистрировать Face ID

```javascript
import * as ImagePicker from 'expo-image-picker';

const handleRegisterFaceId = async () => {
  // Request camera permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Необходимо разрешение на камеру');
    return;
  }

  // Take selfie
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
    cameraType: ImagePicker.CameraType.front,
  });

  if (result.canceled) return;

  // Create FormData
  const formData = new FormData();
  const uri = result.assets[0].uri;
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('faceImage', {
    uri,
    name: `faceid-${Date.now()}.jpg`,
    type,
  });

  // Send request
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch('http://192.168.1.100:5000/api/face-verification/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      Alert.alert('✅ Успех', 'Face ID зарегистрирован!');
    } else {
      Alert.alert('❌ Ошибка', result.message);
    }
  } catch (error) {
    Alert.alert('❌ Ошибка', error.message);
  }
};
```

#### Начать сессию с Face ID

```javascript
const startWorkSessionWithFaceId = async (faceImageUri, location) => {
  const formData = new FormData();

  // Add photo
  const filename = faceImageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('photo', {
    uri: faceImageUri,
    name: `faceid-${Date.now()}.jpg`,
    type,
  });

  // Add session data
  formData.append('clientId', user.id);
  formData.append('startLatitude', location.latitude.toString());
  formData.append('startLongitude', location.longitude.toString());
  formData.append('workLocation', 'Парк Ата-Тюрк');
  formData.append('biometricType', 'FaceID');
  formData.append('deviceId', `${Platform.OS}-${Date.now()}`);

  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch('http://192.168.1.100:5000/api/work-sessions/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      Alert.alert(
        '✅ Сессия начата!',
        `Face ID верифицирован: ${result.data.faceVerification.similarity}`
      );
    } else {
      if (result.requireFaceRegistration) {
        Alert.alert('❌ Face ID не зарегистрирован', 'Зарегистрируйте Face ID в профиле');
      } else if (result.faceVerificationFailed) {
        Alert.alert(
          '❌ Верификация не прошла',
          `Схожесть: ${(result.details.similarity * 100).toFixed(1)}%\nТребуется: ${(result.details.threshold * 100).toFixed(0)}%`
        );
      } else {
        Alert.alert('❌ Ошибка', result.message);
      }
    }
  } catch (error) {
    Alert.alert('❌ Ошибка', error.message);
  }
};
```

### 9.3 Axios (Node.js/Browser)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Register Face ID
const registerFace = async (file) => {
  const formData = new FormData();
  formData.append('faceImage', file);

  try {
    const { data } = await api.post('/face-verification/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

// Get verification history
const getHistory = async (limit = 50) => {
  try {
    const { data } = await api.get('/face-verification/history', {
      params: { limit }
    });
    return data.data.verifications;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};
```

---

## 📊 Threshold Configuration

Порог схожести для успешной верификации можно настроить в `backend/services/faceRecognitionService.js`:

```javascript
// Порог верификации: 0.85 (85% схожести)
const VERIFICATION_THRESHOLD = 0.85;
```

**Рекомендации:**
- **Высокая безопасность:** 0.90 (90%) - Меньше false positives, больше false negatives
- **Сбалансированный:** 0.85 (85%) - Оптимальный баланс (рекомендуется)
- **Удобство:** 0.80 (80%) - Больше false positives, меньше false negatives

---

## 🔒 Безопасность

### Защита от подделок:

1. **Liveness Detection** (планируется):
   - Проверка, что фото сделано с живого человека, а не с экрана/фотографии

2. **Временные метки:**
   - Все верификации логируются с timestamp
   - Можно отследить подозрительные паттерны

3. **Audit Trail:**
   - Все попытки верификации сохраняются в БД
   - Неудачные попытки логируются с причинами

4. **Rate Limiting:**
   - Максимум 10 попыток верификации в минуту на пользователя

---

## 📝 Changelog

### v1.0.0 (2025-11-11)
- ✅ Регистрация Face ID
- ✅ Верификация Face ID
- ✅ История верификаций
- ✅ Статистика верификаций
- ✅ Интеграция с Work Sessions
- ✅ Антикоррупционная защита (обязательная верификация)

---

## 🤝 Поддержка

Для вопросов и баг репортов:
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@probation.kg

---

**Важно:** Face ID верификация является обязательным требованием антикоррупционной защиты. Без успешной верификации рабочая сессия не может быть начата.
