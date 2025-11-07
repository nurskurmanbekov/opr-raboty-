-- Fix AuditorPermission ENUM type
-- Run this in psql: psql -U postgres -d probation_db -f fix_auditor_permission_enum.sql

\c probation_db

-- 1. Drop problematic column
ALTER TABLE "AuditorPermissions" DROP COLUMN IF EXISTS "accessType";

-- 2. Drop problematic ENUM type
DROP TYPE IF EXISTS "enum_AuditorPermissions_accessType";

-- 3. Create ENUM type correctly
CREATE TYPE "enum_AuditorPermissions_accessType" AS ENUM('all', 'mru', 'district');

-- 4. Add column back with correct type
ALTER TABLE "AuditorPermissions"
  ADD COLUMN "accessType" "enum_AuditorPermissions_accessType" NOT NULL DEFAULT 'all';

-- Verify the changes
\d "AuditorPermissions"
