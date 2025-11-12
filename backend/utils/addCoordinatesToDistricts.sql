-- Миграция для добавления поля coordinates в таблицу Districts
-- Использование: выполнить в pgAdmin или psql

BEGIN;

-- Добавляем колонку coordinates (JSON)
ALTER TABLE "Districts"
ADD COLUMN IF NOT EXISTS "coordinates" JSON NULL;

-- Добавляем комментарий
COMMENT ON COLUMN "Districts"."coordinates" IS 'Координаты для отображения на карте: { lat: number, lng: number, svgPath?: string }';

-- Проверяем результат
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Districts'
AND column_name = 'coordinates';

-- Выводим количество районов
SELECT COUNT(*) as total_districts FROM "Districts";

COMMIT;

-- Пример данных для заполнения coordinates (выполнять после миграции):
-- UPDATE "Districts" SET coordinates = '{"lat": 42.8746, "lng": 74.5698}' WHERE name = 'Октябрьский';
-- UPDATE "Districts" SET coordinates = '{"lat": 42.8406, "lng": 74.6067}' WHERE name = 'Ленинский';
