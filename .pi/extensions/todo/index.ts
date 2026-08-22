import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import fs from "node:fs";
import path from "node:path";

interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

interface TodoState {
	version: 1;
	nextId: number;
	showWidget: boolean;
	items: TodoItem[];
}

interface TodoResultDetails extends TodoState {
	action: string;
	message: string;
	error?: string;
}

const TODO_FILE = path.join(process.cwd(), ".pi", "todo.json");
const WIDGET_ID = "project-todo-list";

const TodoParams = Type.Object({
	action: StringEnum(["list", "add", "done", "open", "toggle", "remove", "clear", "show", "hide"] as const),
	id: Type.Optional(Type.Number({ description: "Todo id for done/open/toggle/remove" })),
	text: Type.Optional(Type.String({ description: "Todo text for add" })),
});

function defaultState(): TodoState {
	return { version: 1, nextId: 1, showWidget: true, items: [] };
}

function normalizeState(value: unknown): TodoState {
	const fallback = defaultState();
	if (!value || typeof value !== "object") return fallback;
	const raw = value as Partial<TodoState>;
	const items = Array.isArray(raw.items)
		? raw.items
				.filter((item): item is TodoItem => {
					const candidate = item as Partial<TodoItem>;
					return typeof candidate.id === "number" && typeof candidate.text === "string" && typeof candidate.done === "boolean";
				})
				.map((item) => ({ id: item.id, text: item.text, done: item.done }))
		: [];
	const maxId = items.reduce((max, item) => Math.max(max, item.id), 0);
	return {
		version: 1,
		nextId: Math.max(typeof raw.nextId === "number" ? raw.nextId : 1, maxId + 1),
		showWidget: typeof raw.showWidget === "boolean" ? raw.showWidget : true,
		items,
	};
}

function readState(): TodoState {
	try {
		return normalizeState(JSON.parse(fs.readFileSync(TODO_FILE, "utf8")));
	} catch {
		return defaultState();
	}
}

function writeState(state: TodoState): void {
	fs.mkdirSync(path.dirname(TODO_FILE), { recursive: true });
	const tempFile = `${TODO_FILE}.tmp`;
	fs.writeFileSync(tempFile, `${JSON.stringify(state, null, "\t")}\n`);
	fs.renameSync(tempFile, TODO_FILE);
}

function formatList(state: TodoState): string {
	if (state.items.length === 0) return "No todos.";
	return state.items.map((item) => `[${item.done ? "x" : " "}] #${item.id}: ${item.text}`).join("\n");
}

function renderWidgetLines(ctx: ExtensionContext, state: TodoState): string[] | undefined {
	if (!state.showWidget || state.items.length === 0) return undefined;

	const completed = state.items.filter((item) => item.done).length;
	const openItems = state.items.filter((item) => !item.done);
	const doneItems = state.items.filter((item) => item.done);
	const visibleItems = [...openItems, ...doneItems].slice(0, 7);
	const theme = ctx.ui.theme;

	const lines = [
		`${theme.fg("accent", "TODO")} ${theme.fg("muted", `${completed}/${state.items.length} done`)} ${theme.fg("dim", "(/todo)")}`,
	];

	for (const item of visibleItems) {
		const marker = item.done ? theme.fg("success", "☑") : theme.fg("muted", "☐");
		const text = item.done ? theme.fg("dim", item.text) : item.text;
		lines.push(`${marker} ${theme.fg("accent", `#${item.id}`)} ${text}`);
	}

	if (state.items.length > visibleItems.length) {
		lines.push(theme.fg("dim", `… ${state.items.length - visibleItems.length} more`));
	}

	return lines;
}

function updateWidget(ctx: ExtensionContext): void {
	ctx.ui.setWidget(WIDGET_ID, renderWidgetLines(ctx, readState()));
}

function makeDetails(action: string, message: string, state: TodoState, error?: string): TodoResultDetails {
	return { ...state, action, message, error };
}

function mutate(action: string, id?: number, text?: string): { state: TodoState; message: string; error?: string } {
	const state = readState();

	switch (action) {
		case "list":
			return { state, message: formatList(state) };
		case "add": {
			const trimmed = text?.trim();
			if (!trimmed) return { state, message: "Text is required.", error: "text required" };
			const item = { id: state.nextId++, text: trimmed, done: false };
			state.items.push(item);
			writeState(state);
			return { state, message: `Added #${item.id}: ${item.text}` };
		}
		case "done":
		case "open":
		case "toggle": {
			if (id === undefined) return { state, message: "ID is required.", error: "id required" };
			const item = state.items.find((candidate) => candidate.id === id);
			if (!item) return { state, message: `Todo #${id} not found.`, error: `#${id} not found` };
			item.done = action === "toggle" ? !item.done : action === "done";
			writeState(state);
			return { state, message: `${item.done ? "Completed" : "Reopened"} #${item.id}: ${item.text}` };
		}
		case "remove": {
			if (id === undefined) return { state, message: "ID is required.", error: "id required" };
			const before = state.items.length;
			state.items = state.items.filter((item) => item.id !== id);
			if (state.items.length === before) return { state, message: `Todo #${id} not found.`, error: `#${id} not found` };
			writeState(state);
			return { state, message: `Removed #${id}.` };
		}
		case "clear":
			state.items = [];
			state.nextId = 1;
			writeState(state);
			return { state, message: "Cleared all todos." };
		case "show":
			state.showWidget = true;
			writeState(state);
			return { state, message: "Todo widget shown." };
		case "hide":
			state.showWidget = false;
			writeState(state);
			return { state, message: "Todo widget hidden." };
		default:
			return { state, message: `Unknown action: ${action}`, error: `unknown action: ${action}` };
	}
}

function parseCommand(args: string): { action: string; id?: number; text?: string } {
	const trimmed = args.trim();
	if (!trimmed) return { action: "list" };
	const [action, ...rest] = trimmed.split(/\s+/);
	const remainder = rest.join(" ").trim();
	if (["done", "open", "toggle", "remove"].includes(action)) return { action, id: Number(remainder) };
	if (action === "add") return { action, text: remainder };
	return { action };
}

export default function todoExtension(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => updateWidget(ctx));
	pi.on("session_tree", async (_event, ctx) => updateWidget(ctx));

	pi.registerTool({
		name: "todo",
		label: "Todo",
		description:
			"Manage the project's persistent todo list. Use this to keep visible progress while working. Actions: list, add, done, open, toggle, remove, clear, show, hide.",
		parameters: TodoParams,
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const { state, message, error } = mutate(params.action, params.id, params.text);
			updateWidget(ctx);
			return {
				content: [{ type: "text", text: message }],
				details: makeDetails(params.action, message, state, error),
			};
		},
		renderCall(args, theme) {
			let label = `${theme.fg("toolTitle", theme.bold("todo"))} ${theme.fg("muted", args.action)}`;
			if (args.id !== undefined) label += ` ${theme.fg("accent", `#${args.id}`)}`;
			if (args.text) label += ` ${theme.fg("dim", JSON.stringify(args.text))}`;
			return new Text(label, 0, 0);
		},
		renderResult(result, _options, theme) {
			const details = result.details as TodoResultDetails | undefined;
			if (!details) return new Text("Todo updated.", 0, 0);
			const icon = details.error ? theme.fg("error", "✗") : theme.fg("success", "✓");
			return new Text(`${icon} ${theme.fg(details.error ? "error" : "muted", details.message)}`, 0, 0);
		},
	});

	const handleTodoCommand = async (args: string, ctx: ExtensionContext) => {
		const parsed = parseCommand(args);
		if (["done", "open", "toggle", "remove"].includes(parsed.action) && (!parsed.id || Number.isNaN(parsed.id))) {
			ctx.ui.notify("Usage: /todo done <id> | /todo open <id> | /todo toggle <id> | /todo remove <id>", "error");
			return;
		}
		const { state, message, error } = mutate(parsed.action, parsed.id, parsed.text);
		updateWidget(ctx);
		ctx.ui.notify(parsed.action === "list" ? formatList(state) : message, error ? "error" : "info");
	};

	pi.registerCommand("todo", {
		description: "Manage project todos: /todo, /todo add <text>, /todo done <id>, /todo open <id>, /todo hide|show",
		getArgumentCompletions: (prefix) => {
			const actions = ["add", "done", "open", "toggle", "remove", "clear", "show", "hide"];
			const filtered = actions.filter((action) => action.startsWith(prefix));
			return filtered.length ? filtered.map((action) => ({ value: action, label: action })) : null;
		},
		handler: handleTodoCommand,
	});

	pi.registerCommand("todos", {
		description: "Show project todos",
		handler: async (_args, ctx) => handleTodoCommand("", ctx),
	});
}
