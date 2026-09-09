import { PracticeMarkdown } from "@/components/practice/practice-markdown";

export function ExplanationStep({
  markdown,
}: {
  markdown: string;
}) {
  return (
    <div className="lesson-explanation learner-enter">
      <PracticeMarkdown markdown={markdown} />
    </div>
  );
}
