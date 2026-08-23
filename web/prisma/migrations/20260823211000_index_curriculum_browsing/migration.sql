CREATE INDEX "curriculum_concepts_spanish_search_idx"
  ON "curriculum_concepts" USING GIN ("spanish" gin_trgm_ops);

CREATE INDEX "curriculum_concepts_english_search_idx"
  ON "curriculum_concepts" USING GIN ("english" gin_trgm_ops);

CREATE INDEX "concept_collections_collection_name_idx"
  ON "concept_collections" ("collection_name");
