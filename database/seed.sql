INSERT INTO blocks (spanish, english, context)
VALUES
  ('quiero', 'I want', 'querer with a noun, infinitive, or que-clause'),
  ('queremos', 'we want', 'querer with a que-clause'),
  ('algo', 'something', NULL),
  ('y', 'and', NULL),
  ('ir', 'to go', 'infinitive'),
  ('a', 'to', 'destination'),
  ('a', 'at', 'clock time'),
  ('la', 'the', 'feminine singular article'),
  ('tienda', 'store', NULL),
  ('para', NULL, 'purpose marker before an infinitive'),
  ('comprar', 'to buy', 'infinitive'),
  ('que', NULL, 'subordinator in querer que'),
  ('nosotros', 'us', 'object of want in an English infinitive construction'),
  ('vayamos', 'to go', 'subjunctive form inside querer que'),
  ('allá', 'there', NULL),
  ('las', 'the', 'feminine plural article'),
  ('10:00', '10:00', 'clock time');

INSERT INTO sentences (title, english_translation)
VALUES
  ('Wanting to go to the store', 'I want to go to the store to buy something.');

INSERT INTO sentence_answer_groups
  (sentence_id, position, accepted_answers, explanation)
VALUES
  (1, 1, '["I want"]', NULL),
  (1, 2, '["to go"]', NULL),
  (1, 3, '["to"]', NULL),
  (1, 4, '["the"]', NULL),
  (1, 5, '["store"]', NULL),
  (1, 6, '["to buy", "in order to buy"]', 'This phrase expresses purpose. English usually uses to + verb; in order to + verb is also correct.'),
  (1, 7, '["something"]', NULL);

INSERT INTO sentence_blocks (sentence_id, answer_group_id, block_id, position)
VALUES
  (1, 1, 1, 1),
  (1, 2, 5, 2),
  (1, 3, 6, 3),
  (1, 4, 8, 4),
  (1, 5, 9, 5),
  (1, 6, 10, 6),
  (1, 6, 11, 7),
  (1, 7, 3, 8);

INSERT INTO constructions (name, source_pattern, target_pattern, explanation)
VALUES
  (
    'querer-noun',
    '[forma de querer] + [algo]',
    '[form of want] + [something]',
    'Use this pattern when querer expresses desire for a thing or idea.'
  ),
  (
    'querer-infinitive',
    '[forma de querer] + [hacer algo]',
    '[form of want] + to + [do something]',
    'Use to before the English verb when the desired action is expressed with an infinitive.'
  ),
  (
    'querer-que-clause',
    '[forma de querer] + que + [alguien] + [verbo en subjuntivo]',
    '[form of want] + [somebody] + to + [verb]',
    'The Spanish que-clause becomes an English object plus to-infinitive construction. The embedded verb changes according to its subject in Spanish but uses the base form after to in English.'
  ),
  (
    'a-destination',
    'a + [un lugar]',
    'to + [a place]',
    'Use a for movement toward a place.'
  ),
  (
    'a-clock-time',
    'a + [una hora]',
    'at + [a time]',
    'Use at before a specific clock time.'
  ),
  (
    'para-purpose',
    'para + [hacer algo]',
    'to + [do something]',
    'Use this pattern to express the purpose of an action. The slot can contain a single verb or a larger verb phrase.'
  );

INSERT INTO construction_slots
  (construction_id, name, source_constraint, target_constraint, position)
VALUES
  (1, 'querer_form', 'A finite form of querer', 'A matching form of want', 1),
  (1, 'noun_phrase', 'Any Spanish noun phrase', 'A natural English noun phrase', 2),
  (2, 'querer_form', 'A finite form of querer', 'A matching form of want', 1),
  (2, 'verb_phrase', 'Any Spanish infinitive phrase', 'A natural English verb phrase after to', 2),
  (3, 'wanting_subject', 'The subject of querer, explicit or encoded in the verb', 'The subject of want', 1),
  (3, 'embedded_subject', 'The subject of the que-clause, explicit or encoded in the verb', 'An English object pronoun', 2),
  (3, 'embedded_verb_phrase', 'A Spanish subjunctive verb phrase', 'An English base verb phrase after to', 3),
  (4, 'place', 'Any place phrase', 'The same place phrase after to', 1),
  (5, 'clock_time', 'A specific clock time', 'The same time after at', 1),
  (6, 'verb_phrase', 'Any Spanish infinitive phrase, including a larger phrase', 'A natural English infinitive phrase after to', 1);

INSERT INTO construction_examples
  (construction_id, source_text, target_text, note, position)
VALUES
  (1, 'Quiero algo.', 'I want something.', NULL, 1),
  (2, 'Quiero ir.', 'I want to go.', NULL, 1),
  (3, 'Quiero que lo compres.', 'I want you to buy it.', 'The embedded Spanish verb changes form; English uses the base verb after to.', 1),
  (3, 'Queremos que estés allá.', 'We want you to be there.', NULL, 2),
  (3, 'Quiero que nosotros vayamos allá.', 'I want us to go there.', NULL, 3),
  (4, 'Quiero ir a la tienda.', 'I want to go to the store.', NULL, 1),
  (5, 'Quiero ir a las 10:00.', 'I want to go at 10:00.', NULL, 1),
  (6, 'Para hacer algo.', 'To do something.', NULL, 1),
  (6, 'Para aprender inglés.', 'To learn English.', 'The verb slot changes while the construction stays the same.', 2),
  (6, 'Para ir allá.', 'To go there.', NULL, 3),
  (6, 'Para poder hablar bien.', 'To be able to speak well.', 'The slot contains a larger verb phrase.', 4);

INSERT INTO construction_example_slots
  (example_id, slot_id, source_value, target_value)
VALUES
  (1, 1, 'Quiero', 'I want'),
  (1, 2, 'un café', 'a coffee'),
  (2, 3, 'Quiero', 'I want'),
  (2, 4, 'preparar el café', 'make the coffee'),
  (3, 5, 'yo', 'I'),
  (3, 6, 'tú (encoded in compres)', 'you'),
  (3, 7, 'lo compres', 'buy it'),
  (4, 5, 'nosotros', 'we'),
  (4, 6, 'tú (encoded in estés)', 'you'),
  (4, 7, 'estés allá', 'be there'),
  (5, 5, 'yo', 'I'),
  (5, 6, 'nosotros', 'us'),
  (5, 7, 'vayamos allá', 'go there'),
  (6, 8, 'la tienda', 'the store'),
  (7, 9, 'las 10:00', '10:00'),
  (8, 10, 'hacer algo', 'do something'),
  (9, 10, 'aprender inglés', 'learn English'),
  (10, 10, 'ir allá', 'go there'),
  (11, 10, 'poder hablar bien', 'be able to speak well');
