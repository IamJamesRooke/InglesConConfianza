export type PatternParts = {
  prefix: string;
  bold: string;
  suffix?: string;
};

export type RichTextPart =
  | { type: "text"; value: string }
  | { type: "pattern"; parts: PatternParts };

export type DemoLessonAnswerBlock = {
  blockId: number;
  spanish: string;
  acceptedAnswers: string[];
};

export type DemoLessonStep =
  | {
      id: string;
      type: "explainer";
      title: string;
      titleParts?: RichTextPart[];
      text: string;
      textParts?: RichTextPart[];
      bullets?: string[];
      patternExamples?: Array<{
        source: PatternParts;
        target: PatternParts;
      }>;
    }
  | {
      id: string;
      type: "diagram";
      title: string;
      titleParts?: RichTextPart[];
      text: string;
      textParts?: RichTextPart[];
      source?: PatternParts;
      target?: PatternParts;
      imageSrc?: string;
      imageAlt?: string;
      imageWidth?: number;
      imageHeight?: number;
    }
  | {
      id: string;
      type: "question";
      prompt: string;
      highlight: string;
      acceptedAnswers: string[];
      feedback: string;
      blockId?: number;
      answerBlocks?: DemoLessonAnswerBlock[];
    }
  | {
      id: string;
      type: "milestone";
      title: string;
      titleParts?: RichTextPart[];
      text: string;
      textParts?: RichTextPart[];
    };

export const demoLessonSteps: DemoLessonStep[] = [
  {
    id: "cognates-introduction",
    type: "explainer",
    title: "El español y el inglés son primos",
    text: "En esta lección, escribe en inglés. Cuando aciertes, avanzaremos automáticamente. El inglés y el español son primos, con raíces compartidas en latín. Por eso, tienen miles de palabras en común. Por ejemplo:",
    patternExamples: [
      {
        source: { prefix: "visit", bold: "ando" },
        target: { prefix: "visit", bold: "ing" },
      },
      {
        source: { prefix: "confirm", bold: "ando" },
        target: { prefix: "confirm", bold: "ing" },
      },
      {
        source: { prefix: "transform", bold: "ando" },
        target: { prefix: "transform", bold: "ing" },
      },
    ],
  },
  {
    id: "ando-pattern",
    type: "diagram",
    title: "El patrón -ando",
    titleParts: [
      { type: "text", value: "El patrón " },
      { type: "pattern", parts: { prefix: "", bold: "-ando" } },
    ],
    text: "Cuando veas -ando al final de una palabra en español, reemplázalo por -ing en inglés.",
    textParts: [
      { type: "text", value: "Cuando veas " },
      { type: "pattern", parts: { prefix: "", bold: "-ando" } },
      {
        type: "text",
        value: " al final de una palabra en español, reemplázalo por ",
      },
      { type: "pattern", parts: { prefix: "", bold: "-ing" } },
      { type: "text", value: " en inglés." },
    ],
    source: { prefix: "", bold: "-ando" },
    target: { prefix: "", bold: "-ing" },
  },
  {
    id: "visitando",
    type: "question",
    prompt: "¿Cómo se dice visitando de nuevo?",
    highlight: "visitando",
    acceptedAnswers: ["visiting"],
    feedback: "Muy bien. Visitando es visiting.",
    blockId: 18,
  },
  {
    id: "limitando",
    type: "question",
    prompt: "Entonces, ¿qué sería limitando?",
    highlight: "limitando",
    acceptedAnswers: ["limiting"],
    feedback: "Muy bien. El mismo patrón -ando funciona aquí.",
    blockId: 19,
  },
  {
    id: "confirmando",
    type: "question",
    prompt: "¿Y confirmando?",
    highlight: "confirmando",
    acceptedAnswers: ["confirming"],
    feedback: "Exactamente: confirmando es confirming.",
    blockId: 20,
  },
  {
    id: "cancelando",
    type: "question",
    prompt: "¿Qué sería cancelando?",
    highlight: "cancelando",
    acceptedAnswers: ["cancelling", "canceling"],
    feedback: "Correcto. En inglés se usan tanto cancelling como canceling.",
    blockId: 21,
  },
  {
    id: "continuando",
    type: "question",
    prompt: "¿Y continuando?",
    highlight: "continuando",
    acceptedAnswers: ["continuing"],
    feedback: "Muy bien. Puedes usar este patrón con cientos de palabras.",
    blockId: 22,
  },
  {
    id: "ando-milestone",
    type: "milestone",
    title: "¡Descubriste un patrón!",
    text: "Solo cambia -ando por -ing y puedes reconocer cientos de palabras en inglés. ¡Así de fácil!",
    textParts: [
      { type: "text", value: "Solo cambia " },
      { type: "pattern", parts: { prefix: "", bold: "-ando" } },
      { type: "text", value: " por " },
      { type: "pattern", parts: { prefix: "", bold: "-ing" } },
      {
        type: "text",
        value: " y puedes reconocer cientos de palabras en inglés. ¡Así de fácil!",
      },
    ],
  },
  {
    id: "iendo-introduction",
    type: "explainer",
    title: "El patrón -iendo",
    titleParts: [
      { type: "text", value: "El patrón " },
      { type: "pattern", parts: { prefix: "", bold: "-iendo" } },
    ],
    text: "Otro truco: si tienes una palabra como decidiendo, con -iendo al final, una vez más lo reemplazas por -ing. Por ejemplo:",
    textParts: [
      { type: "text", value: "Otro truco: si tienes una palabra como " },
      { type: "pattern", parts: { prefix: "", bold: "decidiendo" } },
      { type: "text", value: ", con " },
      { type: "pattern", parts: { prefix: "", bold: "-iendo" } },
      { type: "text", value: " al final, una vez más lo reemplazas por " },
      { type: "pattern", parts: { prefix: "", bold: "-ing" } },
      { type: "text", value: ". Por ejemplo:" },
    ],
    patternExamples: [
      {
        source: { prefix: "decid", bold: "iendo" },
        target: { prefix: "decid", bold: "ing" },
      },
      {
        source: { prefix: "divid", bold: "iendo" },
        target: { prefix: "divid", bold: "ing" },
      },
    ],
  },
  {
    id: "iendo-pattern",
    type: "diagram",
    title: "El patrón -iendo",
    titleParts: [
      { type: "text", value: "El patrón " },
      { type: "pattern", parts: { prefix: "", bold: "-iendo" } },
    ],
    text: "Cuando veas -iendo al final de una palabra en español, reemplázalo por -ing en inglés.",
    textParts: [
      { type: "text", value: "Cuando veas " },
      { type: "pattern", parts: { prefix: "", bold: "-iendo" } },
      {
        type: "text",
        value: " al final de una palabra en español, reemplázalo por ",
      },
      { type: "pattern", parts: { prefix: "", bold: "-ing" } },
      { type: "text", value: " en inglés." },
    ],
    source: { prefix: "", bold: "-iendo" },
    target: { prefix: "", bold: "-ing" },
  },
  {
    id: "decidiendo",
    type: "question",
    prompt: "¿Cómo se dice decidiendo?",
    highlight: "decidiendo",
    acceptedAnswers: ["deciding"],
    feedback: "Muy bien. Decidiendo es deciding.",
    blockId: 23,
  },
  {
    id: "dividiendo",
    type: "question",
    prompt: "¿Y dividiendo?",
    highlight: "dividiendo",
    acceptedAnswers: ["dividing"],
    feedback: "Correcto. Dividiendo es dividing.",
    blockId: 24,
  },
  {
    id: "definiendo",
    type: "question",
    prompt: "¿Qué sería definiendo?",
    highlight: "definiendo",
    acceptedAnswers: ["defining"],
    feedback: "Exactamente: definiendo es defining.",
    blockId: 25,
  },
  {
    id: "admitiendo",
    type: "question",
    prompt: "¿Y admitiendo?",
    highlight: "admitiendo",
    acceptedAnswers: ["admitting"],
    feedback: "Muy bien. Admitting usa el mismo patrón.",
    blockId: 26,
  },
  {
    id: "permitiendo",
    type: "question",
    prompt: "¿Qué sería permitiendo?",
    highlight: "permitiendo",
    acceptedAnswers: ["permitting"],
    feedback: "Correcto. Permitiendo es permitting.",
    blockId: 27,
  },
  {
    id: "existiendo",
    type: "question",
    prompt: "¿Y existiendo?",
    highlight: "existiendo",
    acceptedAnswers: ["existing"],
    feedback: "Muy bien. Existiendo es existing.",
    blockId: 28,
  },
  {
    id: "resistiendo",
    type: "question",
    prompt: "¿Qué sería resistiendo?",
    highlight: "resistiendo",
    acceptedAnswers: ["resisting"],
    feedback: "Exactamente: resistiendo es resisting.",
    blockId: 29,
  },
  {
    id: "insistiendo",
    type: "question",
    prompt: "¿Y insistiendo?",
    highlight: "insistiendo",
    acceptedAnswers: ["insisting"],
    feedback: "Muy bien. Ahora puedes reconocer otro grupo completo de palabras.",
    blockId: 30,
  },
  {
    id: "iendo-milestone",
    type: "milestone",
    title: "¡Descubriste otro patrón!",
    text: "Solo cambia -iendo por -ing y puedes reconocer muchas más palabras en inglés. ¡Qué fácil!",
    textParts: [
      { type: "text", value: "Solo cambia " },
      { type: "pattern", parts: { prefix: "", bold: "-iendo" } },
      { type: "text", value: " por " },
      { type: "pattern", parts: { prefix: "", bold: "-ing" } },
      {
        type: "text",
        value: " y puedes reconocer muchas más palabras en inglés. ¡Qué fácil!",
      },
    ],
  },
  {
    id: "estoy-introduction",
    type: "explainer",
    title: "Estoy significa I am",
    titleParts: [
      { type: "pattern", parts: { prefix: "", bold: "Estoy" } },
      { type: "text", value: " significa " },
      { type: "pattern", parts: { prefix: "", bold: "I am" } },
    ],
    text: "Estoy o yo estoy es I am o, más corto, I'm. Yo es I y estoy es am.",
    textParts: [
      { type: "pattern", parts: { prefix: "", bold: "Estoy" } },
      { type: "text", value: " o " },
      { type: "pattern", parts: { prefix: "", bold: "yo estoy" } },
      { type: "text", value: " es " },
      { type: "pattern", parts: { prefix: "", bold: "I am" } },
      { type: "text", value: " o, más corto, " },
      { type: "pattern", parts: { prefix: "", bold: "I'm" } },
      { type: "text", value: ". " },
      { type: "pattern", parts: { prefix: "", bold: "Yo" } },
      { type: "text", value: " es " },
      { type: "pattern", parts: { prefix: "", bold: "I" } },
      { type: "text", value: " y " },
      { type: "pattern", parts: { prefix: "", bold: "estoy" } },
      { type: "text", value: " es " },
      { type: "pattern", parts: { prefix: "", bold: "am" } },
      { type: "text", value: "." },
    ],
  },
  {
    id: "estoy-pattern",
    type: "diagram",
    title: "La forma larga y la forma corta",
    titleParts: [
      { type: "text", value: "La forma larga y la forma corta" },
    ],
    text: "En inglés hay una forma larga y una forma corta, muy común en la conversación.",
    imageSrc: "/demo-lesson/estoy-i-am-im.png",
    imageAlt: "Estoy y yo estoy se convierten en I am y I'm",
    imageWidth: 630,
    imageHeight: 140,
  },
  {
    id: "estoy-visitando",
    type: "question",
    prompt: "¿Cómo se dice Estoy visitando?",
    highlight: "Estoy visitando",
    acceptedAnswers: ["I'm visiting", "I am visiting"],
    feedback: "Muy bien. Estoy visitando es I'm visiting.",
    answerBlocks: [
      { blockId: 31, spanish: "Estoy", acceptedAnswers: ["I am", "I'm"] },
      { blockId: 18, spanish: "visitando", acceptedAnswers: ["visiting"] },
    ],
  },
  {
    id: "estoy-preparando",
    type: "question",
    prompt: "¿Cómo se dice Estoy preparando?",
    highlight: "Estoy preparando",
    acceptedAnswers: ["I'm preparing", "I am preparing"],
    feedback: "Correcto. Estoy preparando es I'm preparing.",
    answerBlocks: [
      { blockId: 31, spanish: "Estoy", acceptedAnswers: ["I am", "I'm"] },
      { blockId: 32, spanish: "preparando", acceptedAnswers: ["preparing"] },
    ],
  },
  {
    id: "estoy-decidiendo",
    type: "question",
    prompt: "¿Qué sería Estoy decidiendo?",
    highlight: "Estoy decidiendo",
    acceptedAnswers: ["I'm deciding", "I am deciding"],
    feedback: "Muy bien. Ahora estás combinando dos patrones.",
    answerBlocks: [
      { blockId: 31, spanish: "Estoy", acceptedAnswers: ["I am", "I'm"] },
      { blockId: 23, spanish: "decidiendo", acceptedAnswers: ["deciding"] },
    ],
  },
  {
    id: "my-friend-introduction",
    type: "explainer",
    title: "Mi amigo",
    text: "A mi amigo es my friend. Ignoramos la a en la traducción.",
    textParts: [
      { type: "pattern", parts: { prefix: "", bold: "A mi amigo" } },
      { type: "text", value: " es " },
      { type: "pattern", parts: { prefix: "", bold: "my friend" } },
      { type: "text", value: ". Ignoramos la " },
      { type: "pattern", parts: { prefix: "", bold: "a" } },
      { type: "text", value: " en la traducción." },
    ],
  },
  {
    id: "my-friend-pattern",
    type: "diagram",
    title: "A mi amigo ⟶ my friend",
    titleParts: [
      { type: "pattern", parts: { prefix: "", bold: "A mi amigo" } },
      { type: "text", value: " ⟶ " },
      { type: "pattern", parts: { prefix: "", bold: "my friend" } },
    ],
    text: "En esta frase, la a en español no necesita una palabra separada en inglés.",
    textParts: [
      { type: "text", value: "En esta frase, la " },
      { type: "pattern", parts: { prefix: "", bold: "a" } },
      { type: "text", value: " en español no necesita una palabra separada en inglés." },
    ],
    imageSrc: "/demo-lesson/mi-my-friend.png",
    imageAlt: "A mi amigo se convierte en my friend",
    imageWidth: 424,
    imageHeight: 205,
  },
  {
    id: "visiting-my-friend",
    type: "question",
    prompt: "¿Cómo se dice Estoy visitando a mi amigo?",
    highlight: "Estoy visitando a mi amigo",
    acceptedAnswers: ["I'm visiting my friend", "I am visiting my friend"],
    feedback: "¡Muy bien! Acabas de construir una oración completa.",
    answerBlocks: [
      { blockId: 31, spanish: "Estoy", acceptedAnswers: ["I am", "I'm"] },
      { blockId: 18, spanish: "visitando", acceptedAnswers: ["visiting"] },
      { blockId: 33, spanish: "a mi amigo", acceptedAnswers: ["my friend"] },
    ],
  },
  {
    id: "now-introduction",
    type: "explainer",
    title: "Ahora",
    text: "Ahora es now, N-O-W.",
    textParts: [
      { type: "pattern", parts: { prefix: "", bold: "Ahora" } },
      { type: "text", value: " es " },
      { type: "pattern", parts: { prefix: "", bold: "now" } },
      { type: "text", value: ", N-O-W." },
    ],
  },
  {
    id: "now-pattern",
    type: "diagram",
    title: "Ahora ⟶ now",
    titleParts: [
      { type: "pattern", parts: { prefix: "", bold: "Ahora" } },
      { type: "text", value: " ⟶ " },
      { type: "pattern", parts: { prefix: "", bold: "now" } },
    ],
    text: "Ahora puedes agregar una palabra más a la oración.",
    textParts: [
      { type: "pattern", parts: { prefix: "", bold: "Ahora" } },
      { type: "text", value: " puedes agregar una palabra más a la oración." },
    ],
    imageSrc: "/demo-lesson/ahora-now.png",
    imageAlt: "Ahora se convierte en now",
    imageWidth: 199,
    imageHeight: 46,
  },
  {
    id: "visiting-my-friend-now",
    type: "question",
    prompt: "¿Cómo se dice Estoy visitando a mi amigo ahora?",
    highlight: "Estoy visitando a mi amigo ahora",
    acceptedAnswers: [
      "I'm visiting my friend now",
      "I am visiting my friend now",
    ],
    feedback: "¡Muy bien! Construiste la oración completa.",
    answerBlocks: [
      { blockId: 31, spanish: "Estoy", acceptedAnswers: ["I am", "I'm"] },
      { blockId: 18, spanish: "visitando", acceptedAnswers: ["visiting"] },
      { blockId: 33, spanish: "a mi amigo", acceptedAnswers: ["my friend"] },
      { blockId: 34, spanish: "ahora", acceptedAnswers: ["now"] },
    ],
  },
  {
    id: "lesson-complete",
    type: "milestone",
    title: "¡Terminaste la lección!",
    text: "Usaste dos patrones, aprendiste I am y I'm, y construiste una oración completa: I'm visiting my friend now. ¡Mira todo lo que puedes decir!",
    textParts: [
      { type: "text", value: "Usaste dos patrones, aprendiste " },
      { type: "pattern", parts: { prefix: "", bold: "I am" } },
      { type: "text", value: " y " },
      { type: "pattern", parts: { prefix: "", bold: "I'm" } },
      { type: "text", value: ", y construiste una oración completa: " },
      {
        type: "pattern",
        parts: { prefix: "", bold: "I'm visiting my friend now" },
      },
      { type: "text", value: ". ¡Mira todo lo que puedes decir!" },
    ],
  },
];

export type DemoLessonSection = {
  id: string;
  title: string;
  startStepId: string;
  endStepId: string;
};

export const demoLessonSections: DemoLessonSection[] = [
  {
    id: "ando",
    title: "Patrón -ando",
    startStepId: "cognates-introduction",
    endStepId: "ando-milestone",
  },
  {
    id: "iendo",
    title: "Patrón -iendo",
    startStepId: "iendo-introduction",
    endStepId: "iendo-milestone",
  },
  {
    id: "estoy",
    title: "Estoy → I am",
    startStepId: "estoy-introduction",
    endStepId: "estoy-decidiendo",
  },
  {
    id: "friend",
    title: "Mi amigo",
    startStepId: "my-friend-introduction",
    endStepId: "visiting-my-friend",
  },
  {
    id: "now",
    title: "Ahora → now",
    startStepId: "now-introduction",
    endStepId: "visiting-my-friend-now",
  },
  {
    id: "complete",
    title: "Cierre",
    startStepId: "lesson-complete",
    endStepId: "lesson-complete",
  },
];
