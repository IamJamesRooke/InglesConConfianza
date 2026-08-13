import Database from "better-sqlite3";
import path from "node:path";

// Get the path of the database
const databasePath = path.join(
  process.cwd(),
  "..",
  "database",
  "curriculum.sqlite",
);

// Open the database at the db location
const database = new Database(databasePath);
database.pragma("foreign_keys = ON");

// Define the shape of a reusable block.
export type Block = {
  id: number;
  spanish: string;
  english: string | null;
  context: string | null;
};

export type SentenceBlock = Block & {
  answer_group_id: number;
  position: number;
};

export type SentenceAnswerGroup = {
  id: number;
  position: number;
  acceptedAnswers: string[];
  explanation: string | null;
  blocks: SentenceBlock[];
};

export type Sentence = {
  id: number;
  title: string;
  english_translation: string;
  answerGroups: SentenceAnswerGroup[];
};

export type ConstructionSlot = {
  id: number;
  name: string;
  source_constraint: string;
  target_constraint: string;
  position: number;
};

export type ConstructionExample = {
  id: number;
  source_text: string;
  target_text: string;
  note: string | null;
  position: number;
  slots: ConstructionExampleSlot[];
};

export type ConstructionExampleSlot = {
  id: number;
  slot_id: number;
  slot_name: string;
  source_value: string;
  target_value: string;
};

export type Construction = {
  id: number;
  name: string;
  source_pattern: string;
  target_pattern: string;
  explanation: string;
  slots: ConstructionSlot[];
  examples: ConstructionExample[];
};

export function getBlocks(): Block[] {
  const statement = database.prepare(
    "SELECT id, spanish, english, context FROM blocks ORDER BY id",
  );

  return statement.all() as Block[];
}

export function getSentences(): Sentence[] {
  const sentences = database
    .prepare(
      "SELECT id, title, english_translation FROM sentences ORDER BY id",
    )
    .all() as Omit<Sentence, "answerGroups">[];

  const answerGroups = database
    .prepare(
      "SELECT id, sentence_id, position, accepted_answers, explanation FROM sentence_answer_groups ORDER BY sentence_id, position",
    )
    .all() as {
    id: number;
    sentence_id: number;
    position: number;
    accepted_answers: string;
    explanation: string | null;
  }[];

  const sentenceBlocks = database
    .prepare(
      `SELECT
        sb.sentence_id,
        sb.answer_group_id,
        sb.position,
        b.id,
        b.spanish,
        b.english,
        b.context
      FROM sentence_blocks AS sb
      JOIN blocks AS b ON b.id = sb.block_id
      ORDER BY sb.sentence_id, sb.position`,
    )
    .all() as (SentenceBlock & { sentence_id: number })[];

  return sentences.map((sentence) => ({
    ...sentence,
    answerGroups: answerGroups
      .filter((group) => group.sentence_id === sentence.id)
      .map((group) => ({
        id: group.id,
        position: group.position,
        acceptedAnswers: JSON.parse(group.accepted_answers) as string[],
        explanation: group.explanation,
        blocks: sentenceBlocks.filter(
          (block) => block.answer_group_id === group.id,
        ),
      })),
  }));
}

export function getConstructions(): Construction[] {
  const constructions = database
    .prepare("SELECT id, name, source_pattern, target_pattern, explanation FROM constructions ORDER BY id")
    .all() as Omit<Construction, "slots" | "examples">[];

  const slots = database
    .prepare(
      "SELECT id, construction_id, name, source_constraint, target_constraint, position FROM construction_slots ORDER BY position",
    )
    .all() as (ConstructionSlot & { construction_id: number })[];

  const examples = database
    .prepare(
      "SELECT id, construction_id, source_text, target_text, note, position FROM construction_examples ORDER BY position",
    )
    .all() as (ConstructionExample & { construction_id: number })[];

  const exampleSlots = database
    .prepare(
      `SELECT
        ces.id,
        ces.example_id,
        ces.slot_id,
        cs.name AS slot_name,
        ces.source_value,
        ces.target_value
      FROM construction_example_slots AS ces
      JOIN construction_slots AS cs ON cs.id = ces.slot_id
      ORDER BY ces.example_id, cs.position`,
    )
    .all() as (ConstructionExampleSlot & { example_id: number })[];

  return constructions.map((construction) => ({
    ...construction,
    slots: slots.filter((slot) => slot.construction_id === construction.id),
    examples: examples
      .filter((example) => example.construction_id === construction.id)
      .map((example) => ({
        ...example,
        slots: exampleSlots.filter(
          (slot) => slot.example_id === example.id,
        ),
      })),
  }));
}
