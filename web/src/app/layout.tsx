import type { Metadata } from "next";
import { Baloo_2, Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
// Imported here rather than @import'd from globals.css so the dev server tracks
// its changes for hot reload.
import "../styles/learner-foundations-home.css";
import "../styles/practice-base.css";
import "../styles/authoring-base.css";
import "../styles/lesson-builder/library.css";
import "../styles/lesson-builder/document.css";
import "../styles/lesson-builder/explanation.css";
import "../styles/lesson-builder/sentence.css";
import "../styles/lesson-builder/insert.css";
import "../styles/lesson-builder/script.css";
import "../styles/lesson-builder/concepts.css";
import "../styles/lesson-builder/keyboard-help.css";
import "../styles/lesson-builder/hud.css";
import "../styles/lesson-builder/print.css";
import "../styles/practice-completion.css";
import "../styles/practice-responsive-overrides.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Warm, rounded display face for learner-facing headings and prompts.
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
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
    <html
      lang="es"
      className={`${geist.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
