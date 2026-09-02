-- AlterEnum
ALTER TYPE "CurriculumRole" ADD VALUE 'trash';

-- DropIndex
DROP INDEX "concept_collections_collection_name_idx";

-- DropIndex
DROP INDEX "curriculum_concepts_english_search_idx";

-- DropIndex
DROP INDEX "curriculum_concepts_spanish_search_idx";

-- DropIndex
DROP INDEX "mapping_source_documents_content_search_idx";

-- DropIndex
DROP INDEX "mapping_source_documents_tags_idx";

-- DropIndex
DROP INDEX "mapping_source_entries_english_search_idx";

-- DropIndex
DROP INDEX "mapping_source_entries_spanish_search_idx";

-- DropIndex
DROP INDEX "mapping_source_entries_tags_idx";
