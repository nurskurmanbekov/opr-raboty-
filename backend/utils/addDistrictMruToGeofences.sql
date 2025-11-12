-- Миграция: Добавление полей districtId и mruId в таблицу Geofences
-- Дата: 2025-11-08
-- Цель: Обновить систему геозон для использования UUID ссылок вместо строковых значений

-- Step 1: Add districtId column
ALTER TABLE "Geofences"
ADD COLUMN IF NOT EXISTS "districtId" UUID NULL;

-- Step 2: Add mruId column
ALTER TABLE "Geofences"
ADD COLUMN IF NOT EXISTS "mruId" UUID NULL;

-- Step 3: Add foreign key for districtId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Geofences_districtId_fkey'
  ) THEN
    ALTER TABLE "Geofences"
    ADD CONSTRAINT "Geofences_districtId_fkey"
    FOREIGN KEY ("districtId")
    REFERENCES "Districts"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 4: Add foreign key for mruId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Geofences_mruId_fkey'
  ) THEN
    ALTER TABLE "Geofences"
    ADD CONSTRAINT "Geofences_mruId_fkey"
    FOREIGN KEY ("mruId")
    REFERENCES "MRUs"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 5: Make old district column nullable
ALTER TABLE "Geofences"
ALTER COLUMN "district" DROP NOT NULL;

-- Step 6: Add comments
COMMENT ON COLUMN "Geofences"."district" IS 'Устаревшее поле, используйте districtId';
COMMENT ON COLUMN "Geofences"."districtId" IS 'ID района из справочника';
COMMENT ON COLUMN "Geofences"."mruId" IS 'ID МРУ из справочника (опционально)';

-- Готово!
