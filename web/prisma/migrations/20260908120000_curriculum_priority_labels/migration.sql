-- Fresh start on curriculum prioritisation. The old frequency-ish tiers
-- (core/essential/common/extended/rare) are retired in favour of a hand-assigned
-- priority ladder P1..P5, plus Unranked (the untriaged default) and Trash.
--
-- Enum declaration order is the priority order, so `ORDER BY curriculum_role`
-- sorts P1 -> P5 -> Unranked -> Trash.
--
-- Every priority row is reset to Unranked: prioritisation is now done organically,
-- one row at a time, so the previous machine-assigned signal is intentionally
-- discarded. Rows already marked `trash` keep that disposition as `Trash`.

ALTER TYPE "CurriculumRole" RENAME TO "CurriculumRole_old";

CREATE TYPE "CurriculumRole" AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5', 'Unranked', 'Trash');

ALTER TABLE "curriculum_concepts" ALTER COLUMN "curriculum_role" DROP DEFAULT;

ALTER TABLE "curriculum_concepts"
  ALTER COLUMN "curriculum_role" TYPE "CurriculumRole"
  USING (
    CASE
      WHEN "curriculum_role"::text = 'trash' THEN 'Trash'
      ELSE 'Unranked'
    END
  )::"CurriculumRole";

ALTER TABLE "curriculum_concepts"
  ALTER COLUMN "curriculum_role" SET DEFAULT 'Unranked';

DROP TYPE "CurriculumRole_old";
