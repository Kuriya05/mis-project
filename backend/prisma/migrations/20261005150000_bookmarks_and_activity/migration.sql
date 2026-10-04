-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "activity_seen_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "question_bookmarks" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "question_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_bookmarks_profile_id_created_at_idx" ON "question_bookmarks"("profile_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "question_bookmarks_question_id_profile_id_key" ON "question_bookmarks"("question_id", "profile_id");

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bookmarks" ADD CONSTRAINT "question_bookmarks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

