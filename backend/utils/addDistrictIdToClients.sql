-- =====================================================
-- Миграция: Добавление districtId в таблицу Clients
-- Дата: 2025-11-08
-- =====================================================

BEGIN;

-- 1. Добавить колонку districtId в таблицу Clients
ALTER TABLE "Clients"
ADD COLUMN IF NOT EXISTS "districtId" UUID NULL;

-- 2. Добавить внешний ключ на таблицу Districts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Clients_districtId_fkey'
  ) THEN
    ALTER TABLE "Clients"
    ADD CONSTRAINT "Clients_districtId_fkey"
    FOREIGN KEY ("districtId")
    REFERENCES "Districts"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Сделать поле district необязательным (nullable)
ALTER TABLE "Clients"
ALTER COLUMN "district" DROP NOT NULL;

-- 4. Проверить структуру таблицы
SELECT
  column_name AS "Колонка",
  data_type AS "Тип",
  is_nullable AS "Nullable",
  column_default AS "По умолчанию"
FROM information_schema.columns
WHERE table_name = 'Clients'
AND column_name IN ('district', 'districtId')
ORDER BY column_name;

-- 5. Вывести количество клиентов
SELECT COUNT(*) AS "Всего клиентов" FROM "Clients";

COMMIT;

-- =====================================================
-- РЕЗУЛЬТАТ:
--
-- ✅ Колонка districtId добавлена (UUID, nullable)
-- ✅ Внешний ключ на Districts создан
-- ✅ Поле district теперь nullable
--
-- СЛЕДУЮЩИЕ ШАГИ:
-- 1. Перезапустите backend сервер
-- 2. Попробуйте создать клиента через форму
-- =====================================================
