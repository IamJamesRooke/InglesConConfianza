export function normalizeLessonMarkdown(markdown: string) {
  return markdown.replace(/\\=\\=/gu, "==");
}
