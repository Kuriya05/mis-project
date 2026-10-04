-- Subsystems keep no names or e-mail addresses (reference-data.md 8): an author
-- is shown by person_code from Core Hub GET /people/me, or by role while it is null
ALTER TABLE "profiles" DROP COLUMN "display_name";
ALTER TABLE "profiles" ADD COLUMN "person_code" VARCHAR(64);
