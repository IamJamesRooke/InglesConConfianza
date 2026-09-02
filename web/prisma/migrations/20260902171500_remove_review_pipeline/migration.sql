-- DropForeignKey / DropTable: the review pipeline is retired. Curation now edits
-- curriculum_concepts directly, staging deletion candidates in the `trash` role.

-- DropTable
DROP TABLE "review_candidate_collections";

-- DropTable
DROP TABLE "review_candidates";

-- DropTable
DROP TABLE "review_batches";

-- DropEnum
DROP TYPE "ReviewAction";

-- DropEnum
DROP TYPE "ReviewBatchStatus";
