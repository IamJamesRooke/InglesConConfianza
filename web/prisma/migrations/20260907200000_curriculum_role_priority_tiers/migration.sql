-- Split the 3-tier curriculum role (core/supporting/reference) into 5 priority
-- tiers for course sequencing. See docs/curation/role-granularity/plan.md.
--   supporting -> common     reference -> rare
-- core and trash are unchanged. Recreates the enum so the removed values are
-- gone, remapping the column in the same step.

ALTER TYPE "CurriculumRole" RENAME TO "CurriculumRole_old";

CREATE TYPE "CurriculumRole" AS ENUM ('core', 'essential', 'common', 'extended', 'rare', 'trash');

ALTER TABLE "curriculum_concepts"
  ALTER COLUMN "curriculum_role" TYPE "CurriculumRole"
  USING (
    CASE "curriculum_role"::text
      WHEN 'supporting' THEN 'common'
      WHEN 'reference' THEN 'rare'
      ELSE "curriculum_role"::text
    END
  )::"CurriculumRole";

DROP TYPE "CurriculumRole_old";
