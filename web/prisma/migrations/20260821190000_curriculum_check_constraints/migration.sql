ALTER TABLE "curriculum_concepts"
  ADD CONSTRAINT "curriculum_concepts_id_nonempty" CHECK (btrim("id") <> ''),
  ADD CONSTRAINT "curriculum_concepts_spanish_nonempty" CHECK (btrim("spanish") <> ''),
  ADD CONSTRAINT "curriculum_concepts_english_nonempty" CHECK (btrim("english") <> ''),
  ADD CONSTRAINT "curriculum_concepts_english_single_target" CHECK ("english" NOT LIKE '% / %'),
  ADD CONSTRAINT "curriculum_concepts_example_spanish_nonempty" CHECK (btrim("example_spanish") <> ''),
  ADD CONSTRAINT "curriculum_concepts_example_english_nonempty" CHECK (btrim("example_english") <> '');

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_name_nonempty" CHECK (btrim("name") <> ''),
  ADD CONSTRAINT "collections_name_trimmed" CHECK ("name" = btrim("name"));

ALTER TABLE "review_batches"
  ADD CONSTRAINT "review_batches_id_nonempty" CHECK (btrim("id") <> ''),
  ADD CONSTRAINT "review_batches_title_nonempty" CHECK (btrim("title") <> '');

ALTER TABLE "review_candidates"
  ADD CONSTRAINT "review_candidates_id_nonempty" CHECK (btrim("id") <> ''),
  ADD CONSTRAINT "review_candidates_spanish_nonempty" CHECK (btrim("spanish") <> ''),
  ADD CONSTRAINT "review_candidates_english_nonempty" CHECK (btrim("english") <> ''),
  ADD CONSTRAINT "review_candidates_english_single_target" CHECK ("english" NOT LIKE '% / %'),
  ADD CONSTRAINT "review_candidates_example_spanish_nonempty" CHECK (btrim("example_spanish") <> ''),
  ADD CONSTRAINT "review_candidates_example_english_nonempty" CHECK (btrim("example_english") <> ''),
  ADD CONSTRAINT "review_candidates_rationale_nonempty" CHECK (btrim("rationale") <> '');
