"use client";

// The bottom-bar cheat sheet for whatever the teacher is currently editing.
// Generated from `KEYMAP`/`scopeOf` (keymap.ts) rather than hand-copied, so
// it can never say something the keymap doesn't actually do: every chord
// shown here is looked up live from the same table the dispatcher reads.
// The only hand-owned thing is the short human wording in `HUD_LABELS`.
//
// See docs/design/lesson-builder-editing-model.md §3 for the keymap
// contract this reads.

import { useEffect, useState } from "react";

import { useLessonEditing, type EditingSelection } from "@/lib/lesson-builder/editing";
import { KEYMAP, scopeOf, type Chord, type Scope } from "@/lib/lesson-builder/keymap";

// One label per chord, regardless of which scope it's read from — a chord
// means roughly the same thing everywhere it appears (Escape always "leave",
// Tab always "next field"), so a flat map stays honest without needing a
// label per scope×chord pair. A chord missing here still renders (see
// `labelFor`'s fallback) — this map just controls how good it looks.
export const HUD_LABELS: Partial<Record<Chord, string>> = {
  Enter: "open",
  "Ctrl+Alt+Enter": "next slide",
  "Ctrl+Alt+Shift+Enter": "extend sentence",
  "Ctrl+Alt+G": "given",
  "Ctrl+Alt+ArrowUp": "move up",
  "Ctrl+Alt+ArrowDown": "move down",
  "Ctrl+Alt+Backspace": "delete pair",
  Tab: "next field",
  "Shift+Tab": "previous field",
  Escape: "leave",
  "Ctrl+Alt+S": "Spanish",
  "Ctrl+Alt+E": "English",
  "Ctrl+Alt+N": "normal",
  "Ctrl+B": "bold",
  "Ctrl+I": "italic",
  "Alt+ArrowDown": "hint",
  Space: "open",
  "Ctrl+Alt+D": "finish lesson",
  "Ctrl+Alt+P": "preview",
  "Ctrl+Alt+L": "new lesson",
  "Ctrl+Alt+M": "rename module",
  "Ctrl+Z": "undo",
  "Ctrl+Shift+Z": "redo",
  "Ctrl+S": "save",
  "Ctrl+.": "help",
};

// Hand-curated *ordering* only — which of a scope's live chords are the most
// useful to show before the bar collapses the rest behind "…". A chord not
// listed here still shows (after the ones that are), it just sorts last;
// nothing here can hide a command the keymap actually has.
const SCOPE_PRIORITY: Partial<Record<Scope, Chord[]>> = {
  title: ["Enter", "Ctrl+Alt+Enter", "Ctrl+Alt+ArrowUp", "Ctrl+Alt+ArrowDown", "Ctrl+Alt+D"],
  explanation: ["Ctrl+Alt+S", "Ctrl+Alt+E", "Ctrl+Alt+N", "Escape", "Ctrl+Alt+Enter"],
  instruction: ["Escape", "Ctrl+Alt+Enter"],
  spanish: ["Tab", "Alt+ArrowDown", "Escape", "Ctrl+Alt+Enter", "Ctrl+Alt+Backspace"],
  english: ["Tab", "Shift+Tab", "Alt+ArrowDown", "Escape", "Ctrl+Alt+Backspace"],
  hint: ["Enter", "Escape"],
  block: ["Enter", "Ctrl+Alt+Enter", "Ctrl+Alt+ArrowUp", "Ctrl+Alt+ArrowDown", "Escape"],
  lesson: ["Ctrl+Alt+D", "Ctrl+Alt+P"],
  page: ["Ctrl+Alt+L", "Ctrl+S", "Ctrl+Z", "Ctrl+."],
};

const PRIMARY_COUNT = 5;

function humanize(raw: string): string {
  const spaced = raw
    .replace(/^bound /, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/Command$/, "")
    .trim();
  return (spaced || raw).toLowerCase();
}

export function labelFor(chord: Chord, commandName: string): string {
  return HUD_LABELS[chord] ?? humanize(commandName || chord);
}

type ActiveChord = { chord: Chord; scope: Scope; label: string };

// Mirrors `dispatchKeymap`'s own precedence: walk scopeOf(selection) from
// innermost to outermost, first command found for a chord wins. This is the
// entire "generated from the keymap" contract — add or remove a chord in
// KEYMAP and the HUD picks it up with no other change needed.
function activeChords(scopes: Scope[]): ActiveChord[] {
  const seen = new Set<Chord>();
  const result: ActiveChord[] = [];
  for (const scope of scopes) {
    const commands = KEYMAP[scope];
    if (!commands) continue;
    for (const [chord, command] of Object.entries(commands)) {
      if (seen.has(chord) || !command) continue;
      seen.add(chord);
      result.push({ chord, scope, label: labelFor(chord, command.name) });
    }
  }
  return result;
}

function orderForDisplay(chords: ActiveChord[], innermost: Scope): ActiveChord[] {
  const priority = SCOPE_PRIORITY[innermost] ?? [];
  return [...chords].sort((a, b) => {
    const ai = priority.indexOf(a.chord);
    const bi = priority.indexOf(b.chord);
    const aRank = ai === -1 ? priority.length : ai;
    const bRank = bi === -1 ? priority.length : bi;
    return aRank - bRank;
  });
}

// Key-label formatting: a keyboard legend reads keys as their own glyphs,
// not the DOM code names `chordOf` (keymap.ts) produces them from.
const KEY_GLYPHS: Partial<Record<string, string>> = {
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "⌫",
};

function keyGlyph(key: string): string {
  return KEY_GLYPHS[key] ?? key;
}

export type Pair = { chord: Chord; key: string; label: string };
export type Group = { modifiers: string[]; pairs: Pair[] };

const MAX_PAIRS_PER_GROUP = 5;

// Groups chords that share a modifier prefix (Ctrl+Alt+S/E/N/Enter → one
// "[Ctrl][Alt] + S spanish · E english · …" legend instead of repeating the
// modifier on every chip) — a keyboard legend, not a chip rail. A
// modifier-less chord has nothing to factor out, so it's never merged with
// another modifier-less chord; each stands alone, and all of them sort
// after every modifier group (owner requirement 2026-09-15).
export function buildGroups(chords: ActiveChord[]): Group[] {
  const modGroups = new Map<string, Group>();
  const modOrder: string[] = [];
  const soloGroups: Group[] = [];
  for (const item of chords) {
    const parts = item.chord.split("+");
    const modifiers = parts.slice(0, -1);
    const pair: Pair = { chord: item.chord, key: keyGlyph(parts[parts.length - 1]), label: item.label };
    if (modifiers.length === 0) {
      soloGroups.push({ modifiers: [], pairs: [pair] });
      continue;
    }
    const signature = modifiers.join("+");
    let group = modGroups.get(signature);
    if (!group) {
      group = { modifiers, pairs: [] };
      modGroups.set(signature, group);
      modOrder.push(signature);
    }
    group.pairs.push(pair);
  }
  return [...modOrder.map((signature) => modGroups.get(signature)!), ...soloGroups];
}

// The whole pipeline — active chords for the selection, ordered, capped,
// grouped — as one exported function so a test can assert on the same
// groups the bar renders without reaching into its private pieces.
export function groupsForSelection(selection: EditingSelection): Group[] {
  const scopes = scopeOf(selection);
  const chords = activeChords(scopes);
  const ordered = orderForDisplay(chords, scopes[0]);
  return buildGroups(ordered.slice(0, PRIMARY_COUNT));
}

function HudGroup({ group }: { group: Group }) {
  const pairs = group.pairs.slice(0, MAX_PAIRS_PER_GROUP);
  const truncated = group.pairs.length > MAX_PAIRS_PER_GROUP;
  return (
    <span className="editing-hud-group">
      {group.modifiers.length > 0 && (
        <>
          <span className="editing-hud-group-mods">
            {group.modifiers.map((modifier) => (
              <kbd key={modifier}>{modifier}</kbd>
            ))}
          </span>
          <span className="editing-hud-group-plus" aria-hidden="true">
            +
          </span>
        </>
      )}
      {pairs.map((pair, index) => (
        <span className="editing-hud-pair" key={pair.chord}>
          {index > 0 && <span className="editing-hud-dot">·</span>}
          <kbd>{pair.key}</kbd>
          <span className="editing-hud-label">{pair.label}</span>
        </span>
      ))}
      {truncated && <span className="editing-hud-more">…</span>}
    </span>
  );
}

// True whenever focus currently sits inside an element the keymap dispatcher
// itself ignores (`[data-keymap-ignore]`) — the concept typeahead input, the
// module search box, the mouse insert palette, the concept quick-edit modal,
// and the keyboard help dialog all carry that attribute already. Tracked via
// focus events rather than polling, per the editing model's no-polling rule.
function useKeymapIgnoreFocused(): boolean {
  const [ignored, setIgnored] = useState(false);
  useEffect(() => {
    function computeFrom(target: EventTarget | null) {
      const el = target instanceof Element ? target : null;
      setIgnored(Boolean(el?.closest("[data-keymap-ignore]")));
    }
    computeFrom(document.activeElement);
    function onFocusIn(event: FocusEvent) {
      computeFrom(event.target);
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  return ignored;
}

export function EditingHud() {
  const editing = useLessonEditing();
  const ignoreFocused = useKeymapIgnoreFocused();

  if (editing.selection.kind === "none") return null;
  if (ignoreFocused) return null;

  const groups = groupsForSelection(editing.selection);
  if (groups.length === 0) return null;

  return (
    <div className="editing-hud" aria-hidden="true">
      {groups.map((group) => (
        <HudGroup key={group.modifiers.join("+") || group.pairs[0].chord} group={group} />
      ))}
    </div>
  );
}
