-- The AI assistant recommends every lecturer who fits the question, not one:
-- keep the lecturer already recommended as the first of the list
ALTER TABLE "comments" ADD COLUMN "recommended_faculty_ids" VARCHAR(64)[] DEFAULT ARRAY[]::VARCHAR(64)[];

UPDATE "comments" SET "recommended_faculty_ids" = ARRAY["recommended_faculty_id"]::VARCHAR(64)[]
WHERE "recommended_faculty_id" IS NOT NULL;

ALTER TABLE "comments" DROP COLUMN "recommended_faculty_id";
