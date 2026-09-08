import { X } from "lucide-react";

export function HotkeyReminder({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotkey-reminder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mt-16 w-full max-w-md rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="hotkey-reminder-title"
              className="text-xl font-semibold tracking-tight"
            >
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your hands on the keyboard while authoring.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            title="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "K"]}
            description="Open command palette"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "N"]}
            description="Create a new lesson"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "A"]}
            description="Open the Add slide menu"
          />
          <HotkeyReminderRow
            keys={["PageUp / PageDown"]}
            description="Move between lesson setup and slides"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Enter"]}
            description="Open Add next slide"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "S"]}
            description="Save the active lesson"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "D"]}
            description="Duplicate the focused block"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "↑ / ↓"]}
            description="Move the focused block"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "1 / 2"]}
            description="Mark selected text Spanish or English"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "B"]}
            description="Bold selected text"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "0"]}
            description="Clear selected formatting"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Z"]}
            description="Undo a structural edit"
          />
          <HotkeyReminderRow
            keys={["Ctrl/Cmd", "Shift", "Z"]}
            description="Redo a structural edit"
          />
          <HotkeyReminderRow
            keys={["Esc"]}
            description="Finish editing or close the current menu"
          />
        </div>
      </div>
    </div>
  );
}

function HotkeyReminderRow({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-4 py-3">
      <span className="text-sm font-medium text-foreground">{description}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded-md border border-stone-200 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}
