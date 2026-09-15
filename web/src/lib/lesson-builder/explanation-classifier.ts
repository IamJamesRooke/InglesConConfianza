// The E1 word classifier: "does the right-hand side of '<x> es <y>' look
// English?" Kept DOM-free and dependency-free so the unit tests can exercise
// it directly. E2 replaces these lists with the curriculum-backed word sets.

// The classifier (E2's full curriculum-backed version is a later task). The
// rule fires only when the right-hand side looks English, so the cost of a
// false negative is "the teacher marks it by hand" and the cost of a false
// positive is a wrong auto-mark — hence the deliberately conservative shape:
//
//   1. at least one word must be *positive* evidence (in the English list);
//   2. at least 60% of the words must be English-ish, where a word counts as
//      English-ish if it is in the English list, or in neither list (an
//      unknown content word like "banana" doesn't veto an otherwise English
//      phrase, but a known Spanish word does).
//
// So "I want" fires, "to do, dos palabras" does not (50%), and "rojo" —
// no English evidence at all — does not.
const ENGLISH_WORDS = new Set([
  "a", "about", "after", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "but", "by", "can", "could", "did", "do",
  "does", "down", "for", "from", "get", "give", "go", "going", "had", "has",
  "have", "he", "her", "here", "him", "his", "how", "i", "if", "in", "is",
  "it", "its", "just", "know", "like", "make", "many", "me", "more", "much",
  "must", "my", "need", "no", "not", "now", "of", "on", "one", "or", "our",
  "out", "over", "please", "say", "see", "she", "should", "so", "some",
  "something", "take", "than", "that", "the", "their", "them", "then",
  "there", "these", "they", "thing", "think", "this", "those", "time", "to",
  "today", "tomorrow", "too", "up", "us", "very", "want", "was", "we",
  "well", "were", "what", "when", "where", "which", "who", "why", "will",
  "with", "would", "yes", "yesterday", "you", "your",
]);

const SPANISH_WORDS = new Set([
  "a", "al", "algo", "algunos", "aquí", "así", "bien", "bueno", "casa",
  "como", "con", "cosa", "cuando", "de", "del", "día", "dos", "el", "ella",
  "ellos", "en", "es", "esa", "ese", "eso", "esta", "este", "esto", "estoy",
  "gracias", "hacer", "hay", "hoy", "la", "las", "lo", "los", "mañana",
  "más", "me", "mi", "mucho", "muy", "nada", "no", "nosotros", "o", "para",
  "pero", "poco", "por", "porque", "puedo", "que", "qué", "quiero", "rojo",
  "se", "señor", "si", "sí", "siempre", "sin", "sobre", "solo", "son", "soy",
  "su", "también", "tener", "tengo", "tiempo", "todo", "tú", "tu", "un",
  "una", "usted", "ustedes", "ver", "y", "yo", "palabras", "palabra",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{M}'’]+/u)
    .filter(Boolean);
}

export function isEnglish(text: string): boolean {
  const tokens = words(text);
  if (tokens.length === 0) return false;
  if (!tokens.some((token) => ENGLISH_WORDS.has(token))) return false;
  const englishish = tokens.filter(
    (token) => ENGLISH_WORDS.has(token) || !SPANISH_WORDS.has(token),
  ).length;
  return englishish / tokens.length >= 0.6;
}

// -----------------------------------------------------------------------
// The E1 pattern, as the owner's real explanations actually write it.
//
// Not just "<x> es <y>": a teacher's line routinely carries an aside between
// the subject and the pivot, and a Spanish comment after the translation —
//
//   sí, con tilde, es yes
//   si, sin tilde—como si tú quieres o sí tu necesitas—es if
//   hacer es to do, dos palabras
//
// so the rule is: the **subject** is the leading run up to the first comma or
// dash; the **pivot** is the *last* standalone "es" on the line (asides are
// full of their own verbs — "sí tu necesitas" — and the translation always
// comes after the last one); the **translation** runs from there to the first
// comma or the sentence terminator. The aside and the trailing comment stay
// unmarked, which is exactly how the owner marks these by hand.
// -----------------------------------------------------------------------

export type EsEnPlan = {
  spanish: { from: number; to: number };
  english: { from: number; to: number };
};

const PIVOT = /(?:^|[\s,—–-])es(?=[\s])/gu;
const BREAK = /[,—–]/u;

export function planEsEnMarks(text: string): EsEnPlan | null {
  PIVOT.lastIndex = 0;
  let pivotEnd = -1;
  let match = PIVOT.exec(text);
  while (match) {
    pivotEnd = match.index + match[0].length;
    match = PIVOT.exec(text);
  }
  if (pivotEnd < 0) return null;

  const left = text.slice(0, pivotEnd - 2); // everything before the "es"
  const subjectStart = left.search(/\S/u);
  if (subjectStart < 0) return null;
  const breakAt = left.slice(subjectStart).search(BREAK);
  const subjectRaw = breakAt < 0 ? left.slice(subjectStart) : left.slice(subjectStart, subjectStart + breakAt);
  const subject = subjectRaw.trimEnd();
  if (!subject) return null;

  const right = text.slice(pivotEnd);
  const englishOffset = right.search(/\S/u);
  if (englishOffset < 0) return null;
  const rest = right.slice(englishOffset);
  const commaAt = rest.search(BREAK);
  const englishRaw = commaAt < 0 ? rest : rest.slice(0, commaAt);
  const english = englishRaw.replace(/[.!?]+\s*$/u, "").trimEnd();
  if (!english || !isEnglish(english)) return null;

  return {
    spanish: { from: subjectStart, to: subjectStart + subject.length },
    english: { from: pivotEnd + englishOffset, to: pivotEnd + englishOffset + english.length },
  };
}
