import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
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
import "../styles/lesson-builder/concepts.css";
import "../styles/lesson-builder/keyboard-help.css";
import "../styles/lesson-builder/print.css";
import "../styles/practice-completion.css";
import "../styles/practice-responsive-overrides.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Editorial serif for the practice "stage": the sentence on screen and the
// lesson title. Variable font with optical-size, soft, and wonk axes so one
// family covers both quiet body-adjacent moments and the large display type.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
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
      className={`${geist.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
