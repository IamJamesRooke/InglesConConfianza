import {
  EditablePracticeMarkdown,
  PracticeMarkdown,
} from "@/components/practice/practice-markdown";

export function ExplanationStep({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange?: (markdown: string) => void;
}) {
  return (
    <div className="lesson-explanation learner-enter">
      {onChange ? (
        <EditablePracticeMarkdown
          markdown={markdown}
          onChange={onChange}
          placeholder="Type the explanation…"
          ariaLabel="Explanation"
        />
      ) : (
        <PracticeMarkdown markdown={markdown} />
      )}
    </div>
  );
}
