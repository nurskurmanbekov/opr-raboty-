# Probation System Mobile Application

Мобильное приложение для системы пробации с GPS отслеживанием и управлением рабочими сменами.

## 🚀 Технологии

- **React Native 0.73.2** - Кросс-платформенная разработка
- **Hermes Engine** - Оптимизированный JavaScript движок
- **React Navigation** - Навигация между экранами
- **AsyncStorage** - Локальное хранилище данных
- **Background Geolocation** - GPS отслеживание в фоне
- **React Native Maps** - Отображение карт
- **Axios** - HTTP клиент для API запросов
- **Firebase Cloud Messaging** - Push уведомления

## 📱 Функционал

### ✅ Реализованные возможности:

- 🔐 **Авторизация** - Вход по email и паролю
- ⏱️ **Рабочие смены** - Старт/стоп рабочего времени с таймером
- 📍 **GPS отслеживание** - Автоматическое отслеживание местоположения в фоне
- 🗺️ **Карта** - Визуализация текущего местоположения и маршрутов
- 👥 **Клиенты** - Просмотр списка назначенных клиентов
- 👤 **Профиль** - Информация о пользователе и настройки
- 📶 **Offline режим** - Работа без интернета с синхронизацией
- 🔄 **Автосинхронизация** - Отправка данных при восстановлении связи
- 📊 **Статистика** - Информация о сменах и отслеживании

## 🔌 API Endpoints

Приложение подключается к: **http://85.113.27.42:8090/api**

### Используемые эндпоинты:

```
POST   /auth/login              - Вход в систему
GET    /auth/me                 - Получить текущего пользователя
POST   /work-sessions/start     - Начать рабочую смену
PUT    /work-sessions/:id/end   - Завершить рабочую смену
POST   /work-sessions/:id/location - Обновить GPS координаты
GET    /clients                 - Получить список клиентов
GET    /profile/me              - Получить профиль
POST   /sync/batch              - Пакетная синхронизация
```

## 📋 Требования

- **Node.js** >= 18.x
- **npm** >= 9.x или **yarn** >= 1.22.x
- **JDK** 17 (для Android)
- **Android Studio** (для разработки под Android)
- **Android SDK** (API level 33+)

## 🛠️ Установка

### 1. Клонировать репозиторий

```bash
cd mobile-native
```

### 2. Установить зависимости

```bash
npm install
# или
yarn install
```

### 3. Настроить Google Maps API Key

Откройте файл `android/app/src/main/AndroidManifest.xml` и замените:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE"/>
```

Получить API ключ можно на [Google Cloud Console](https://console.cloud.google.com/).

### 4. (Опционально) Настроить Firebase

Для push-уведомлений добавьте файл `google-services.json` в папку `android/app/`.

## 🚀 Запуск приложения

### Режим разработки

#### Android:

```bash
# Запустить Metro bundler
npm start

# В другом терминале:
npm run android
# или
npx react-native run-android
```

#### iOS (macOS only):

```bash
cd ios && pod install && cd ..
npm run ios
# или
npx react-native run-ios
```

### Очистка кэша

Если возникли проблемы, попробуйте:

```bash
# Очистить Metro cache
npm start -- --reset-cache

# Очистить Android build
cd android && ./gradlew clean && cd ..

# Переустановить зависимости
rm -rf node_modules
npm install
```

## 📦 Сборка Release APK

### Генерация ключа подписи (первый раз)

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Сохраните пароли в надежном месте!

### Настройка gradle.properties

Создайте файл `android/gradle.properties` с вашими учетными данными:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

### Сборка APK

```bash
cd android
./gradlew assembleRelease
```

APK будет находиться в:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Сборка с разделением по архитектурам (меньший размер)

APK файлы будут созданы для каждой архитектуры:
- `app-armeabi-v7a-release.apk` (~10-12 MB) - для большинства устройств
- `app-arm64-v8a-release.apk` (~12-15 MB) - для новых 64-bit устройств
- `app-x86-release.apk` - для эмуляторов и Intel устройств
- `app-x86_64-release.apk` - для 64-bit эмуляторов

Используйте **arm64-v8a** версию для современных смартфонов.

### Оптимизация размера APK

Приложение использует следующие оптимизации:

✅ **Hermes Engine** - снижение размера на 30-40%
✅ **ProGuard** - минификация и обфускация кода
✅ **Separate APKs** - раздельные APK для каждой архитектуры
✅ **Strip Debug Symbols** - удаление отладочных символов
✅ **Shrink Resources** - удаление неиспользуемых ресурсов

**Ожидаемый размер:** 12-15 MB (arm64-v8a)

## 🔧 Разработка

### Структура проекта

```
mobile-native/
├── src/
│   ├── api/              # API клиенты
│   │   └── client.js     # Axios instance с interceptors
│   ├── services/         # Бизнес-логика
│   │   ├── gps.js        # GPS отслеживание
│   │   ├── storage.js    # AsyncStorage wrapper
│   │   └── sync.js       # Offline синхронизация
│   ├── screens/          # Экраны приложения
│   │   ├── LoginScreen.js
│   │   ├── MainScreen.js
│   │   ├── ActiveSessionScreen.js
│   │   ├── ClientsListScreen.js
│   │   ├── MapScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/       # React Navigation
│   │   └── AppNavigator.js
│   ├── contexts/         # React Context (State)
│   │   └── AuthContext.js
│   ├── components/       # Переиспользуемые компоненты
│   └── utils/            # Утилиты
├── android/              # Android нативный код
├── App.jsx               # Главный компонент
├── index.js              # Точка входа
└── package.json          # Зависимости
```

### Добавление нового экрана

1. Создать файл в `src/screens/NewScreen.js`
2. Добавить импорт в `src/navigation/AppNavigator.js`
3. Добавить `<Stack.Screen>` в навигацию

### Добавление нового API endpoint

Открыть `src/api/client.js` и добавить в соответствующую секцию:

```javascript
export const myAPI = {
  getData: (params) => api.get('/my-endpoint', { params }),
  postData: (data) => api.post('/my-endpoint', data),
};
```

## 🐛 Отладка

### Android Logcat

```bash
# Просмотр всех логов
adb logcat

# Только React Native логи
adb logcat | grep ReactNative

# Логи конкретного приложения
adb logcat | grep com.probationmobile
```

### React Native Debugger

1. Встряхните устройство или `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Выберите "Debug"
3. Откроется Chrome DevTools

### GPS отладка

Логи GPS сервиса:

```bash
adb logcat | grep -i "gps\|location\|geolocation"
```

## 📝 Конфигурация

### Изменение API URL

Откройте `src/api/client.js` и измените:

```javascript
const API_BASE_URL = 'http://85.113.27.42:8090/api';
```

### Изменение таймаутов

В `src/api/client.js`:

```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 секунд
});
```

### Интервалы GPS обновлений

В `src/services/gps.js`:

```javascript
BackgroundGeolocation.ready({
  distanceFilter: 10,  // Обновлять каждые 10 метров
  locationUpdateInterval: 5000,  // Каждые 5 секунд
});
```

## 🔐 Безопасность

- ✅ Токен авторизации хранится в AsyncStorage (зашифровано на уровне ОС)
- ✅ ProGuard обфусцирует код в production
- ✅ HTTPS для production API (рекомендуется)
- ✅ Certificate pinning (можно добавить)

## 📊 Тестирование

### Тестирование GPS

```bash
# Эмулировать GPS на эмуляторе
adb emu geo fix <longitude> <latitude>

# Пример: Бишкек
adb emu geo fix 74.5698 42.8746
```

### Тестирование Offline режима

1. Включить Airplane Mode на устройстве
2. Выполнить действия (старт смены, обновление локации)
3. Проверить очередь: Профиль → Синхронизация
4. Выключить Airplane Mode
5. Проверить автосинхронизацию

## 🚨 Решение проблем

### Ошибка: "SDK location not found"

```bash
# Создать файл android/local.properties
echo "sdk.dir=/Users/USERNAME/Library/Android/sdk" > android/local.properties
# Linux: /home/USERNAME/Android/Sdk
# Windows: C:\\Users\\USERNAME\\AppData\\Local\\Android\\Sdk
```

### Ошибка: "Unable to load script"

```bash
npm start -- --reset-cache
rm -rf /tmp/metro-*
```

### Ошибка: GPS не работает

1. Проверить permissions в AndroidManifest.xml
2. Запросить permissions в настройках устройства
3. Включить GPS на устройстве
4. Проверить логи: `adb logcat | grep -i location`

## 📚 Документация

- [React Native](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Background Geolocation](https://github.com/transistorsoft/react-native-background-geolocation)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 👨‍💻 Разработка

Создано с использованием React Native + Hermes для оптимальной производительности.

**Версия:** 1.0.0
**Последнее обновление:** 2024-11

## 📄 Лицензия

Proprietary - Система Пробации Кыргызстан
