CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "mapping_source_documents" (
    "path" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "hub" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "byte_length" INTEGER NOT NULL,
    "line_count" INTEGER NOT NULL,
    "tags" TEXT[],
    "captured_at" DATE NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "mapping_source_documents_pkey" PRIMARY KEY ("path"),
    CONSTRAINT "mapping_source_documents_path_nonempty" CHECK (btrim("path") <> ''),
    CONSTRAINT "mapping_source_documents_direction_nonempty" CHECK (btrim("direction") <> ''),
    CONSTRAINT "mapping_source_documents_hub_nonempty" CHECK (btrim("hub") <> ''),
    CONSTRAINT "mapping_source_documents_kind_nonempty" CHECK (btrim("kind") <> ''),
    CONSTRAINT "mapping_source_documents_sha256_format" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "mapping_source_documents_byte_length_valid" CHECK ("byte_length" >= 0),
    CONSTRAINT "mapping_source_documents_line_count_valid" CHECK ("line_count" >= 0)
);

CREATE TABLE "mapping_source_entries" (
    "id" TEXT NOT NULL,
    "document_path" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "line_number" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "cells" JSONB NOT NULL,
    "spanish" TEXT,
    "english" TEXT,
    "tags" TEXT[],

    CONSTRAINT "mapping_source_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mapping_source_entries_id_nonempty" CHECK (btrim("id") <> ''),
    CONSTRAINT "mapping_source_entries_position_valid" CHECK ("position" >= 0),
    CONSTRAINT "mapping_source_entries_line_number_valid" CHECK ("line_number" > 0),
    CONSTRAINT "mapping_source_entries_cells_array" CHECK (jsonb_typeof("cells") = 'array')
);

CREATE UNIQUE INDEX "mapping_source_documents_sort_order_key" ON "mapping_source_documents"("sort_order");
CREATE INDEX "mapping_source_documents_direction_hub_idx" ON "mapping_source_documents"("direction", "hub");
CREATE INDEX "mapping_source_documents_sha256_idx" ON "mapping_source_documents"("sha256");
CREATE INDEX "mapping_source_documents_tags_idx" ON "mapping_source_documents" USING GIN ("tags");
CREATE INDEX "mapping_source_documents_content_search_idx" ON "mapping_source_documents" USING GIN ("content" gin_trgm_ops);
CREATE UNIQUE INDEX "mapping_source_entries_document_path_position_key" ON "mapping_source_entries"("document_path", "position");
CREATE INDEX "mapping_source_entries_document_path_idx" ON "mapping_source_entries"("document_path");
CREATE INDEX "mapping_source_entries_tags_idx" ON "mapping_source_entries" USING GIN ("tags");
CREATE INDEX "mapping_source_entries_spanish_search_idx" ON "mapping_source_entries" USING GIN ("spanish" gin_trgm_ops);
CREATE INDEX "mapping_source_entries_english_search_idx" ON "mapping_source_entries" USING GIN ("english" gin_trgm_ops);

ALTER TABLE "mapping_source_entries"
  ADD CONSTRAINT "mapping_source_entries_document_path_fkey"
  FOREIGN KEY ("document_path") REFERENCES "mapping_source_documents"("path")
  ON DELETE CASCADE ON UPDATE CASCADE;
