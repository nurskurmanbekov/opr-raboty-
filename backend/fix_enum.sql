-- Скрипт для исправления проблемы с ENUM в PostgreSQL
-- Выполните эти команды в psql или pgAdmin

-- 1. Удалить столбец approvalStatus если он существует
ALTER TABLE "Users" DROP COLUMN IF EXISTS "approvalStatus";

-- 2. Удалить проблемный ENUM тип если он существует
DROP TYPE IF EXISTS "enum_Users_approvalStatus";

-- 3. Создать ENUM тип заново правильно
CREATE TYPE "enum_Users_approvalStatus" AS ENUM('pending', 'approved', 'rejected');

-- 4. Добавить столбец с новым ENUM типом
ALTER TABLE "Users"
ADD COLUMN "approvalStatus" "enum_Users_approvalStatus" DEFAULT 'approved';

-- Готово! Теперь можете запустить backend: npm start
