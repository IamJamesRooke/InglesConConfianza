-- CreateEnum
CREATE TYPE "CurriculumRole" AS ENUM ('core', 'supporting', 'reference');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('add', 'revise');

-- CreateEnum
CREATE TYPE "ReviewBatchStatus" AS ENUM ('open', 'migrated');

-- CreateTable
CREATE TABLE "curriculum_concepts" (
    "id" TEXT NOT NULL,
    "spanish" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "example_spanish" TEXT NOT NULL,
    "example_english" TEXT NOT NULL,
    "curriculum_role" "CurriculumRole" NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "curriculum_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "name" TEXT NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "concept_collections" (
    "concept_id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "concept_collections_pkey" PRIMARY KEY ("concept_id","collection_name")
);

-- CreateTable
CREATE TABLE "review_batches" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_paths" TEXT[],
    "created_at" DATE NOT NULL,
    "status" "ReviewBatchStatus" NOT NULL,
    "migrated_at" DATE,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "review_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_candidates" (
    "batch_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "existing_concept_id" TEXT,
    "suggested_curriculum_role" "CurriculumRole" NOT NULL,
    "spanish" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "example_spanish" TEXT NOT NULL,
    "example_english" TEXT NOT NULL,
    "curriculum_role" "CurriculumRole" NOT NULL,
    "source_paths" TEXT[],
    "rationale" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "migrated" BOOLEAN NOT NULL DEFAULT false,
    "owner_note" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "review_candidates_pkey" PRIMARY KEY ("batch_id","id")
);

-- CreateTable
CREATE TABLE "review_candidate_collections" (
    "batch_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "review_candidate_collections_pkey" PRIMARY KEY ("batch_id","candidate_id","collection_name")
);

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_concepts_sort_order_key" ON "curriculum_concepts"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_concepts_spanish_english_key" ON "curriculum_concepts"("spanish", "english");

-- CreateIndex
CREATE UNIQUE INDEX "concept_collections_concept_id_position_key" ON "concept_collections"("concept_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "review_batches_sort_order_key" ON "review_batches"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "review_candidates_batch_id_sort_order_key" ON "review_candidates"("batch_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "review_candidate_collections_batch_id_candidate_id_position_key" ON "review_candidate_collections"("batch_id", "candidate_id", "position");

-- AddForeignKey
ALTER TABLE "concept_collections" ADD CONSTRAINT "concept_collections_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "curriculum_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_collections" ADD CONSTRAINT "concept_collections_collection_name_fkey" FOREIGN KEY ("collection_name") REFERENCES "collections"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_candidates" ADD CONSTRAINT "review_candidates_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "review_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_candidate_collections" ADD CONSTRAINT "review_candidate_collections_batch_id_candidate_id_fkey" FOREIGN KEY ("batch_id", "candidate_id") REFERENCES "review_candidates"("batch_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_candidate_collections" ADD CONSTRAINT "review_candidate_collections_collection_name_fkey" FOREIGN KEY ("collection_name") REFERENCES "collections"("name") ON DELETE CASCADE ON UPDATE CASCADE;
