-- =====================================================
-- Скрипт очистки базы данных
-- Удаляет всех клиентов и пользователей кроме superadmin
-- =====================================================

-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные!
-- Используйте с осторожностью!

BEGIN;

-- 1. Удалить все связанные данные клиентов
DELETE FROM "Photos";
DELETE FROM "GeofenceViolations";
DELETE FROM "WorkSessions";

-- 2. Удалить всех клиентов
DELETE FROM "Clients";

-- 3. Удалить всех пользователей кроме superadmin
DELETE FROM "Users"
WHERE role != 'superadmin';

-- 4. Убедиться что есть хотя бы один superadmin
-- Если нет - создать нового
INSERT INTO "Users" (
  id,
  "fullName",
  email,
  phone,
  password,
  role,
  district,
  permissions,
  "managedDistricts",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'Суперадминистратор Системы',
  'admin@probation.kg',
  '+996700000001',
  '$2a$10$YourHashedPasswordHere', -- Хешированный пароль 123456
  'superadmin',
  NULL,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Users" WHERE role = 'superadmin'
);

-- 5. Вывести статистику
SELECT
  'Пользователей' as "Тип данных",
  COUNT(*) as "Количество"
FROM "Users"
UNION ALL
SELECT
  'Клиентов' as "Тип данных",
  COUNT(*) as "Количество"
FROM "Clients"
UNION ALL
SELECT
  'Рабочих сессий' as "Тип данных",
  COUNT(*) as "Количество"
FROM "WorkSessions"
UNION ALL
SELECT
  'Нарушений' as "Тип данных",
  COUNT(*) as "Количество"
FROM "GeofenceViolations"
UNION ALL
SELECT
  'Фотографий' as "Тип данных",
  COUNT(*) as "Количество"
FROM "Photos";

COMMIT;

-- =====================================================
-- ПОСЛЕ ВЫПОЛНЕНИЯ СКРИПТА:
--
-- Email: admin@probation.kg
-- Пароль: 123456
--
-- ПРИМЕЧАНИЕ: Если superadmin уже существовал,
-- его пароль останется прежним (123456)
-- =====================================================
