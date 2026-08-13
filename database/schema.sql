PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS construction_example_slots;
DROP TABLE IF EXISTS construction_examples;
DROP TABLE IF EXISTS construction_slots;
DROP TABLE IF EXISTS constructions;
DROP TABLE IF EXISTS blocks;

CREATE TABLE blocks (
  id INTEGER PRIMARY KEY,
  spanish TEXT NOT NULL,
  english TEXT,
  context TEXT
);

CREATE TABLE constructions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  source_pattern TEXT NOT NULL,
  target_pattern TEXT NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE construction_slots (
  id INTEGER PRIMARY KEY,
  construction_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  source_constraint TEXT NOT NULL,
  target_constraint TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (construction_id) REFERENCES constructions(id) ON DELETE CASCADE
);

CREATE TABLE construction_examples (
  id INTEGER PRIMARY KEY,
  construction_id INTEGER NOT NULL,
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  note TEXT,
  position INTEGER NOT NULL,
  FOREIGN KEY (construction_id) REFERENCES constructions(id) ON DELETE CASCADE
);

CREATE TABLE construction_example_slots (
  id INTEGER PRIMARY KEY,
  example_id INTEGER NOT NULL,
  slot_id INTEGER NOT NULL,
  source_value TEXT NOT NULL,
  target_value TEXT NOT NULL,
  UNIQUE (example_id, slot_id),
  FOREIGN KEY (example_id) REFERENCES construction_examples(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES construction_slots(id) ON DELETE CASCADE
);
