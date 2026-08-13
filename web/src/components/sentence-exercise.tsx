"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sentence } from "@/lib/database";

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function SentenceExercise({ sentence }: { sentence: Sentence }) {
  const [answers, setAnswers] = useState<string[]>(
    Array(sentence.answerGroups.length).fill(""),
  );
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>(
    Array(sentence.answerGroups.length).fill(false),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const completed = correctAnswers.every(Boolean);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleAnswerChange(index: number, value: string) {
    const group = sentence.answerGroups[index];
    const isCorrect = group.acceptedAnswers.some(
      (answer) => normalizeAnswer(value) === normalizeAnswer(answer),
    );

    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[index] = value;
      return nextAnswers;
    });

    setCorrectAnswers((currentCorrectAnswers) => {
      const nextCorrectAnswers = [...currentCorrectAnswers];
      nextCorrectAnswers[index] = isCorrect;
      return nextCorrectAnswers;
    });

    if (isCorrect && index < sentence.answerGroups.length - 1) {
      window.setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
  }

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <CardTitle>{sentence.title}</CardTitle>
        <p className="text-sm text-stone-500">
          Type the English translation for each Spanish phrase.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sentence.answerGroups.map((group, index) => {
            const isCorrect = correctAnswers[index];
            const spanishPhrase = group.blocks
              .map((block) => block.spanish)
              .join(" ");
            const contexts = group.blocks
              .map((block) => block.context)
              .filter(Boolean)
              .join(" · ");

            return (
              <label key={group.id} className="flex h-full flex-col">
                <div className="flex h-28 flex-col justify-center rounded-t-lg bg-stone-900 px-4 py-3 text-center text-lg font-semibold text-white">
                  {spanishPhrase}
                  {contexts && (
                    <span className="mt-2 block text-sm font-normal leading-snug text-stone-300">
                      {contexts}
                    </span>
                  )}
                </div>
                <input
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  value={answers[index]}
                  onChange={(event) =>
                    handleAnswerChange(index, event.target.value)
                  }
                  aria-label={`English translation for ${spanishPhrase}`}
                  autoComplete="off"
                  className={`h-16 w-full shrink-0 rounded-b-lg border px-4 py-3 text-center text-lg outline-none transition focus:ring-2 focus:ring-stone-400 ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-stone-200 bg-stone-50 text-stone-900"
                  }`}
                />
                {isCorrect && group.acceptedAnswers.length > 1 && (
                  <div className="mt-3 rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-sm leading-5 text-stone-600">
                    <span className="font-medium text-stone-800">
                      Also accepted:
                    </span>{" "}
                    {group.acceptedAnswers
                      .filter(
                        (answer) =>
                          normalizeAnswer(answer) !==
                          normalizeAnswer(answers[index]),
                      )
                      .join(" · ")}
                  </div>
                )}
                {group.explanation && (
                  <span className="mt-3 block text-sm leading-6 text-stone-600">
                    {group.explanation}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {completed && (
          <div
            role="status"
            className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm font-medium text-emerald-800"
          >
            ¡Muy bien! You completed every block correctly.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
