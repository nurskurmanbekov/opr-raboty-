-- Fix PendingApproval ENUM types
-- Run this in psql: psql -U postgres -d probation_db -f fix_pending_approval_enums.sql

\c probation_db

-- 1. Drop problematic columns
ALTER TABLE "PendingApprovals" DROP COLUMN IF EXISTS "type";
ALTER TABLE "PendingApprovals" DROP COLUMN IF EXISTS "status";

-- 2. Drop problematic ENUM types
DROP TYPE IF EXISTS "enum_PendingApprovals_type";
DROP TYPE IF EXISTS "enum_PendingApprovals_status";

-- 3. Create ENUM types correctly
CREATE TYPE "enum_PendingApprovals_type" AS ENUM('officer', 'client');
CREATE TYPE "enum_PendingApprovals_status" AS ENUM('pending', 'approved', 'rejected');

-- 4. Add columns back with correct types
ALTER TABLE "PendingApprovals"
  ADD COLUMN "type" "enum_PendingApprovals_type" NOT NULL;

ALTER TABLE "PendingApprovals"
  ADD COLUMN "status" "enum_PendingApprovals_status" NOT NULL DEFAULT 'pending';

-- Verify the changes
\d "PendingApprovals"
