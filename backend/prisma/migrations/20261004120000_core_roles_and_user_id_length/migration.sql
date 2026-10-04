-- Core Hub has six roles (contracts/vocabulary.json): lecturer and guest were missing
ALTER TYPE "core_role" ADD VALUE 'lecturer';
ALTER TYPE "core_role" ADD VALUE 'guest';

-- `sub` is an opaque string of at most 64 characters (auth-contract 4)
ALTER TABLE "profiles" ALTER COLUMN "core_user_id" SET DATA TYPE VARCHAR(64);
