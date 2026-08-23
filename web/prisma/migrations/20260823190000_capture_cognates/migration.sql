ALTER TABLE "mapping_source_documents"
  ADD COLUMN "pillar" TEXT NOT NULL DEFAULT 'mappings',
  ADD CONSTRAINT "mapping_source_documents_pillar_nonempty" CHECK (btrim("pillar") <> '');

CREATE INDEX "mapping_source_documents_pillar_idx" ON "mapping_source_documents"("pillar");

CREATE TABLE "cognate_items" (
  "id" TEXT NOT NULL,
  "spanish" TEXT NOT NULL,
  "english" TEXT NOT NULL,
  "part_of_speech" TEXT NOT NULL,
  "cognate_type" TEXT NOT NULL,
  "cognate_status" TEXT NOT NULL,
  "group_label" TEXT NOT NULL,
  "pattern" TEXT NOT NULL,
  "curriculum_role" "CurriculumRole" NOT NULL,
  "tags" TEXT[],
  "source_paths" TEXT[],
  "existing_concept_id" TEXT,
  "sort_order" INTEGER NOT NULL,
  CONSTRAINT "cognate_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cognate_items_spanish_nonempty" CHECK (btrim("spanish") <> ''),
  CONSTRAINT "cognate_items_english_nonempty" CHECK (btrim("english") <> ''),
  CONSTRAINT "cognate_items_part_of_speech_nonempty" CHECK (btrim("part_of_speech") <> ''),
  CONSTRAINT "cognate_items_group_label_nonempty" CHECK (btrim("group_label") <> '')
);

CREATE UNIQUE INDEX "cognate_items_sort_order_key" ON "cognate_items"("sort_order");
CREATE UNIQUE INDEX "cognate_items_spanish_english_key" ON "cognate_items"("spanish", "english");
CREATE INDEX "cognate_items_part_of_speech_curriculum_role_idx" ON "cognate_items"("part_of_speech", "curriculum_role");
CREATE INDEX "cognate_items_cognate_type_cognate_status_idx" ON "cognate_items"("cognate_type", "cognate_status");
CREATE INDEX "cognate_items_tags_idx" ON "cognate_items" USING GIN ("tags");
CREATE INDEX "cognate_items_spanish_search_idx" ON "cognate_items" USING GIN ("spanish" gin_trgm_ops);
CREATE INDEX "cognate_items_english_search_idx" ON "cognate_items" USING GIN ("english" gin_trgm_ops);
