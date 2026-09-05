import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// One-off generator for docs/curation/curation-2026-09-04-nouns-adjectives-theme.tsv
// — not part of the standing script set. Batch 4 of the approved "Nouns &
// Adjectives topics" plan: give every pos:noun/pos:adjective row lacking a
// genuine subject-matter topic (topic:cognate doesn't count — that's the
// Cognates macrotag, not a theme) a `topic:` tag. Classification is by
// English-gloss keyword, in priority order (first match wins), with a
// per-id OVERRIDES map for rows the keyword pass gets wrong or that need a
// theme not derivable from a single keyword.

// Rows the keyword pass would misclassify, or that need a specific call.
const OVERRIDES: Record<string, string> = {
  // ambiguous/idiomatic — hand classified
  "1o17mlmefy": "abstract-quality", // a big deal
  "8trwwgf2y4": "transportation", // automobile
  rgkaoqx4c0: "transportation", // car
  "6dxba6d2ag": "technology", // phone
  "248q0ci8ua": "technology", // telephone
  "92pcswj82t": "technology", // phone number
  "23x7l873p3": "media-communication", // television
  "3scyaehxzw": "media-communication", // telegram
  "0uad77r2ls": "government-politics", // colonel (military rank)
  w2t6njopdt: "government-politics", // tank (military)
  apxuvpw3o5: "crime-law", // convict
  ko06kydn82: "crime-law", // robbery
  bam70vmtu8: "crime-law", // theft
  tjrnsl8268: "crime-law", // thief
  hgfc2qkcz3: "abstract-quality", // racism
  h6ec5g8ke1: "business-work", // contract
  "2ycghrnlv8": "crime-law", // verdict
  gi8q8b684l: "places", // district
  i6a8ckszic: "nature-animals", // elephant
  zeylh1i5dd: "nature-animals", // insect
  "6xuxo8decu": "sports-recreation", // athlete
  cgr3jxvkh4: "sports-recreation", // cyclist
  "111m6z7o3m": "sports-recreation", // tourist
  "6xcuec3dxy": "sports-recreation", // tourism
  txqiolqr7i: "sports-recreation", // trophy
  ive1a0ziw4: "art-culture", // art
  "od2dt49kkn": "art-culture", // artist
  "4bskv8tvfe": "art-culture", // dance
  rdjeqeilbf: "art-culture", // poem
  "i4altfzocy": "art-culture", // biography
  urlrunyef3: "art-culture", // violinist
  ff3b4zlwi3: "education", // singular (grammar term)
  qrwxhzalwx: "education", // language
  ygifenxb7g: "education", // dictionary
  rbn15onoif: "education", // alphabet
  ihr1107fvl: "abstract-quality", // being
  s1v75khflh: "abstract-quality", // the contrary
  "0powders6t": "government-politics", // nationalism
  "010007hsii": "government-politics", // communism
  m1g01li4d2: "government-politics", // socialism
  vuzvlbjndb: "government-politics", // capitalism
  "7qttuz5h12": "government-politics", // communist
  m73r9f84te: "government-politics", // capitalist
  pxa8yqnuhd: "government-politics", // democracy
  "574u2brqmc": "government-politics", // nation
  "8i4pvwrh3c": "abstract-quality", // humanity
  "59nalyueux": "health", // addict
  tcr2y280na: "art-culture", // architecture
  q2kaxpwj2k: "business-work", // agriculture
  b5yulihftv: "personality", // optimist
  "8nz776g9wr": "personality", // pessimist
  "4gcpbm6p3d": "personality", // realist
  hudjcygfj0: "calendar", // reuse the existing topic:calendar value
  "4enrhv4xgq": "people", // immigrant
  e4r4z7w8s5: "education", // theology
  xin0bnb4c3: "transportation", // traffic
  // (weather/time already exist as topics; skip)
};

// English-gloss keyword -> topic, checked in this order (first hit wins).
// Applied to the gloss with a leading "the"/"a"/"an"/bracket text stripped.
const KEYWORD_RULES: Array<[RegExp, string]> = [
  // --- concrete subject-matter domains (checked before generic qualities) ---
  [/\b(job|work|director|position|profession|career|accountant|employee|employer|task|duty|duties|assignment|errand|project|program|colleague|department|worker|manager|instructor|professor)\b/i, "business-work"],
  [/\b(call|request|question|inquiry|application|petition|message)\b/i, "communication-request"],
  [/\b(actor|drinker|giver|winner|loser|speaker|specialist|dentist|artist|architect|author|conductor|thief|convict)\b/i, "people"],
  [/\b(arrival|opening|sunset|lecture|event|meeting)\b/i, "event"],
  [/\b(food|meal|beverage|drink|restaurant|pharmacy)\b/i, "food"],
  [/\b(school|university|student|professor|instructor|teacher|education|class(room)?|dictionary|alphabet|language|literature|philosophy|psychology|biology|physics|geometry|anatomy|science|theorem|thesis|theory|academic)\b/i, "education"],
  [/\b(hospital|doctor|patient|therapy|psychosis|paralysis|health)\b/i, "health"],
  [/\b(law|legal|illegal|crime|criminal)\b/i, "crime-law"],
  [/\b(democracy|nation|national|communis|socialis|capitalis|republic|politic|government)\b/i, "government-politics"],
  [/\b(television|telegram|communication|message|photo|photography)\b/i, "media-communication"],
  [/\b(technology|automobile|motor|mechanism|instrument|hologram|laboratory|electronic)\b/i, "technology"],
  [/\b(dollar|salary|cost|price|finance|profit|loan|bank|check|salary|expense|economy|economic)\b/i, "money-business"],
  [/\b(hotel|garage|theater)\b/i, "places"],
  [/\b(athlete|cyclist|trophy|tourism|tourist|sport)\b/i, "sports-recreation"],
  [/\b(art|artist|dance|poem|biography|violinist|music)\b/i, "art-culture"],
  [/\bfamily|sister|brother|sibling\b/i, "family"],
  [/\b(man|woman|men|women|child|children|adult|acquaintance|stranger|people|person)\b/i, "people"],
  // --- adjective quality clusters ---
  [/\b(African|American|Christian|Colombian|Italian|national|international|local|urban)\b/, "nationality"],
  [/\b(ambitious|arrogant|generous|curious|dominant|talkative|bossy|tolerant|hardworking|sensitive|cruel|wise|reckless|strict|shy|timid|mysterious|morbid|docile)\b/i, "personality"],
  [/\b(bored|boring|nervous|in love|lonely|weird|helpless|powerless|afraid|confident|careful|cold|hot|hungry|thirsty|sleepy|lucky|excited|scared|worried)\b/i, "emotion-state"],
  [/\b(cheap|expensive|free|inexpensive|valuable|invaluable)\b/i, "value-price"],
  [/\b(finished|ready|available|busy|occupied|open|done|full|crowded|lost|dead|due|forearmed|intact|married|used to)\b/i, "condition-state"],
  [/\b(fast|slow|quick|rapid)\b/i, "speed"],
  [/\b(big|small|large|little|tall|short|long|heavy|compact)\b/i, "size"],
  [/\b(black|blue|green|red|white|yellow)\b/i, "color"],
  [/\b(delicious|edible|drinkable)\b/i, "food"],
  [/\b(easy|difficult|hard|simple|complex|straightforward)\b/i, "difficulty"],
  [/\b(mature|immature|old|new|young|elderly|youthful)\b/i, "age"],
  [/\b(military|republican|politic)\b/i, "government-politics"],
  [/\b(scientific|philosophical|historic|academic)\b/i, "education"],
  [/\b(active|stable|alone|exhausted|quiet|asleep|lonely)\b/i, "emotion-state"],
];

function stripGloss(text: string): string {
  return text.replace(/^\[to be\]\s*/, "").replace(/\[[^\]]*\]/g, "").trim();
}

async function main() {
  const lines: string[] = [];
  const unclassified: string[] = [];

  for (const pos of ["pos:noun", "pos:adjective"]) {
    const rows = await prisma.curriculumConcept.findMany({
      where: { curriculumRole: { not: "trash" }, collections: { some: { collectionName: pos } } },
      select: { id: true, spanish: true, english: true, curriculumRole: true, collections: { select: { collectionName: true } } },
    });
    const needsTheme = rows.filter(
      (r) => !r.collections.some((c) => c.collectionName.startsWith("topic:") && c.collectionName !== "topic:cognate"),
    );
    for (const row of needsTheme) {
      let topic = OVERRIDES[row.id];
      if (!topic) {
        const gloss = stripGloss(row.english);
        for (const [re, value] of KEYWORD_RULES) {
          if (re.test(gloss)) {
            topic = value;
            break;
          }
        }
      }
      if (!topic) topic = "abstract-quality"; // deliberate catch-all
      lines.push(
        [row.id, row.spanish, row.english, row.curriculumRole, `topic:${topic}`, "theme categorization batch"].join("\t"),
      );
    }
  }

  console.log(lines.join("\n"));
  console.error(`\n${lines.length} rows classified.`);
  await prisma.$disconnect();
}

main();
