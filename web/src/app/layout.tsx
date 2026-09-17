import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
// Imported here rather than @import'd from globals.css so the dev server tracks
// its changes for hot reload.
import "../styles/learner-foundations-home.css";
import "../styles/practice-base.css";
import "../styles/authoring-base.css";
import "../styles/lesson-builder/lesson-library.css";
import "../styles/lesson-builder/lesson-row.css";
import "../styles/lesson-builder/module-navigator.css";
import "../styles/lesson-builder/lesson-document.css";
import "../styles/lesson-builder/explanation-editor.css";
import "../styles/lesson-builder/sentence-editor.css";
import "../styles/lesson-builder/sentence-presentation.css";
import "../styles/lesson-builder/slide-insert-control.css";
import "../styles/lesson-builder/lesson-script-view.css";
import "../styles/lesson-builder/lesson-concepts-field.css";
import "../styles/lesson-builder/syllabus-panel.css";
import "../styles/lesson-builder/syllabus-fill.css";
import "../styles/lesson-builder/keyboard-help.css";
import "../styles/lesson-builder/editing-hud.css";
import "../styles/lesson-builder/print.css";
import "../styles/practice-completion.css";
import "../styles/practice-responsive-overrides.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: {
    default: "Inglés Con Confianza",
    template: "%s | Inglés Con Confianza",
  },
  description:
    "Lecciones de inglés claras y prácticas para hispanohablantes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
