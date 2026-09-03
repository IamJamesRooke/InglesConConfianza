import { useState, type DragEvent } from "react";

// Shared HTML5-drag reorder state for the three lists in the lesson builder
// (lessons, content blocks, language blocks). Tracks what is being dragged and
// where it would drop; the caller performs the actual move (a reducer dispatch)
// by reading `dragged` / `dropTarget` in its drop handler.
//
// `scope` groups items into one reorderable list — "" for the lesson list,
// the lesson id for a lesson's content blocks, `${lessonId}::${blockId}` for a
// sentence's language blocks. A drop target only sets within the dragged item's
// own scope.
//
// mode: "root" matches the lesson list's looser behaviour (no stopPropagation,
// dragOver still tracks when nothing is being dragged); "nested" matches the
// block lists (stopPropagation, dragOver is inert unless a drag is active).

type Position = "before" | "after";
type DragState = { scope: string; id: string } | null;
type DropState = { scope: string; id: string; position: Position } | null;

export type DragReorder = {
  dragged: DragState;
  dropTarget: DropState;
  dragStart: (event: DragEvent<HTMLElement>, scope: string, id: string) => void;
  dragOver: (event: DragEvent<HTMLElement>, scope: string, id: string) => void;
  reset: () => void;
};

export function useDragReorder({
  axis,
  mode,
}: {
  axis: "x" | "y";
  mode: "root" | "nested";
}): DragReorder {
  const [dragged, setDragged] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<DropState>(null);

  function dragStart(
    event: DragEvent<HTMLElement>,
    scope: string,
    id: string,
  ) {
    if (mode === "nested") {
      event.stopPropagation();
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDragged({ scope, id });
    setDropTarget(null);
  }

  function dragOver(
    event: DragEvent<HTMLElement>,
    scope: string,
    id: string,
  ) {
    if (mode === "nested" && !dragged) {
      return;
    }

    event.preventDefault();
    if (mode === "nested") {
      event.stopPropagation();
    }

    if (dragged && (dragged.scope !== scope || dragged.id === id)) {
      setDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const position: Position =
      axis === "y"
        ? event.clientY < bounds.top + bounds.height / 2
          ? "before"
          : "after"
        : event.clientX < bounds.left + bounds.width / 2
          ? "before"
          : "after";

    setDropTarget({ scope, id, position });
  }

  function reset() {
    setDragged(null);
    setDropTarget(null);
  }

  return { dragged, dropTarget, dragStart, dragOver, reset };
}
