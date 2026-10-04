-- The AI assistant answers a question that repeats an earlier one, as a comment by
-- its own profile, pointing at the earlier threads and a lecturer from the program
-- directory (an id only - no names are stored)
ALTER TABLE "profiles" ADD COLUMN "is_assistant" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "comments" ADD COLUMN "recommended_faculty_id" VARCHAR(64),
ADD COLUMN "related_question_ids" UUID[] DEFAULT ARRAY[]::UUID[];
