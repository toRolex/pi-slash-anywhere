import test from "node:test";
import assert from "node:assert/strict";
import type { AutocompleteProvider, AutocompleteItem, AutocompleteSuggestions } from "@earendil-works/pi-tui";
import type { SlashCommandInfo } from "@earendil-works/pi-coding-agent";
import { createInlineSlashAutocompleteProvider } from "../extensions/autocomplete.js";

function createMockCurrentProvider(overrides: Partial<AutocompleteProvider> = {}): AutocompleteProvider {
  return {
    triggerCharacters: ["@"],
    async getSuggestions(_lines, _line, _col, _opts): Promise<AutocompleteSuggestions | null> {
      return {
        prefix: "mock",
        items: [{ value: "mock-file.txt", label: "mock-file.txt" }],
      };
    },
    applyCompletion(lines, line, col, item, prefix) {
      const currentLine = lines[line] ?? "";
      const before = currentLine.slice(0, col);
      const after = currentLine.slice(col);
      const newLine = before.slice(0, before.length - prefix.length) + item.value + after;
      const newLines = [...lines];
      newLines[line] = newLine;
      return {
        lines: newLines,
        cursorLine: line,
        cursorCol: col - prefix.length + item.value.length,
      };
    },
    shouldTriggerFileCompletion(_lines, _line, _col) {
      return true;
    },
    ...overrides,
  };
}

const mockCandidates: SlashCommandInfo[] = [
  {
    name: "help",
    description: "Show help message",
    source: "extension",
    sourceInfo: { kind: "extension", extensionId: "core" } as any,
  },
  {
    name: "review",
    description: "Review code changes",
    source: "prompt",
    sourceInfo: { kind: "prompt" } as any,
  },
  {
    name: "codebase-design",
    description: "Design deep modules",
    source: "skill",
    sourceInfo: { kind: "skill" } as any,
  },
  {
    name: "skill:git-flow",
    description: "Git flow conventions",
    source: "extension",
    sourceInfo: { kind: "extension", extensionId: "git" } as any,
  },
];

test("Start of line trigger (/)", async () => {
  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  const lines = ["/"];
  const suggestions = await provider.getSuggestions(lines, 0, 1, { signal: new AbortController().signal });

  assert.ok(suggestions);
  assert.equal(suggestions.prefix, "/");
  assert.equal(suggestions.items.length, 4);
  assert.deepEqual(
    suggestions.items.map((it) => it.value),
    ["/help", "/review", "/skill:codebase-design", "/skill:git-flow"]
  );
});

test("Mid-sentence trigger (check this /)", async () => {
  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  const lines = ["check this /"];
  const suggestions = await provider.getSuggestions(lines, 0, lines[0].length, { signal: new AbortController().signal });

  assert.ok(suggestions);
  assert.equal(suggestions.prefix, "/");
  assert.equal(suggestions.items.length, 4);
  assert.ok(suggestions.items.some((it) => it.value === "/help"));
  assert.ok(suggestions.items.some((it) => it.value === "/skill:codebase-design"));

  // Tab trigger check
  const tabLines = ["\t/"];
  const tabSuggestions = await provider.getSuggestions(tabLines, 0, 2, { signal: new AbortController().signal });
  assert.ok(tabSuggestions);
  assert.equal(tabSuggestions.prefix, "/");
});

test("Negative boundary: non-whitespace / (foo/bar, https://) does not trigger inline slash completion", async () => {
  let fallbackCalled = false;
  const current = createMockCurrentProvider({
    async getSuggestions() {
      fallbackCalled = true;
      return null;
    },
  });
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  // foo/bar
  fallbackCalled = false;
  const res1 = await provider.getSuggestions(["foo/bar"], 0, "foo/bar".length, { signal: new AbortController().signal });
  assert.equal(fallbackCalled, true);
  assert.equal(res1, null);

  // https://
  fallbackCalled = false;
  const res2 = await provider.getSuggestions(["https://example.com/"], 0, "https://example.com/".length, { signal: new AbortController().signal });
  assert.equal(fallbackCalled, true);
  assert.equal(res2, null);
});

test("Path conflict resolution: /dir/file retreats to file completion and shouldTriggerFileCompletion", async () => {
  let currentGetSuggestionsCalled = false;
  const current = createMockCurrentProvider({
    async getSuggestions() {
      currentGetSuggestionsCalled = true;
      return { prefix: "/dir/file", items: [{ value: "/dir/file.txt", label: "file.txt" }] };
    },
    shouldTriggerFileCompletion() {
      return true;
    },
  });
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  const lines = ["/dir/file"];
  const suggestions = await provider.getSuggestions(lines, 0, lines[0].length, { signal: new AbortController().signal });
  assert.equal(currentGetSuggestionsCalled, true);
  assert.deepEqual(suggestions?.items, [{ value: "/dir/file.txt", label: "file.txt" }]);

  // shouldTriggerFileCompletion checks
  // Slash token without slash separator -> false
  assert.equal(provider.shouldTriggerFileCompletion!(["/help"], 0, 5), false);
  assert.equal(provider.shouldTriggerFileCompletion!(["run /skill:git"], 0, 14), false);
  assert.equal(provider.shouldTriggerFileCompletion!(["/"], 0, 1), false);

  // Path separators -> true
  assert.equal(provider.shouldTriggerFileCompletion!(["/dir/"], 0, 5), true);
  assert.equal(provider.shouldTriggerFileCompletion!(["/dir/file"], 0, 9), true);
  assert.equal(provider.shouldTriggerFileCompletion!(["some /path/to/nested"], 0, 20), true);

  // Non-slash text -> delegate to current
  let delegated = false;
  const customCurrent = createMockCurrentProvider({
    shouldTriggerFileCompletion() {
      delegated = true;
      return false;
    },
  });
  const customProvider = createInlineSlashAutocompleteProvider(customCurrent, () => mockCandidates);
  const triggerResult = customProvider.shouldTriggerFileCompletion!(["plain text"], 0, 10);
  assert.equal(delegated, true);
  assert.equal(triggerResult, false);
});

test("Aggregation: candidates include commands, templates, and skills", async () => {
  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  const suggestions = await provider.getSuggestions(["/"], 0, 1, { signal: new AbortController().signal });
  assert.ok(suggestions);

  const command = suggestions.items.find((it) => it.value === "/help");
  assert.ok(command);
  assert.equal(command.label, "/help");
  assert.equal(command.description, "Show help message");

  const template = suggestions.items.find((it) => it.value === "/review");
  assert.ok(template);
  assert.equal(template.label, "/review");

  const skill1 = suggestions.items.find((it) => it.value === "/skill:codebase-design");
  assert.ok(skill1);
  assert.equal(skill1.label, "/skill:codebase-design");
  assert.equal(skill1.description, "Design deep modules");

  const skill2 = suggestions.items.find((it) => it.value === "/skill:git-flow");
  assert.ok(skill2);
  assert.equal(skill2.label, "/skill:git-flow");
});

test("Prefix narrowing: /skill: filters strictly to skills", async () => {
  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  // When typing `/skill:`
  const suggestions = await provider.getSuggestions(["/skill:"], 0, 7, { signal: new AbortController().signal });
  assert.ok(suggestions);
  assert.equal(suggestions.prefix, "/skill:");
  assert.equal(suggestions.items.length, 2);
  assert.deepEqual(
    suggestions.items.map((it) => it.value),
    ["/skill:codebase-design", "/skill:git-flow"]
  );

  // When typing `/skill:git`
  const gitSuggestions = await provider.getSuggestions(["/skill:git"], 0, 10, { signal: new AbortController().signal });
  assert.ok(gitSuggestions);
  assert.equal(gitSuggestions.prefix, "/skill:git");
  assert.equal(gitSuggestions.items.length, 1);
  assert.equal(gitSuggestions.items[0].value, "/skill:git-flow");

  // When typing `/hel`
  const cmdSuggestions = await provider.getSuggestions(["/hel"], 0, 4, { signal: new AbortController().signal });
  assert.ok(cmdSuggestions);
  assert.equal(cmdSuggestions.prefix, "/hel");
  assert.equal(cmdSuggestions.items.length, 1);
  assert.equal(cmdSuggestions.items[0].value, "/help");
});

test("Fuzzy matching: /h matches both commands like /help and skills like /skill:handoff", async () => {
  const customCandidates: SlashCommandInfo[] = [
    {
      name: "help",
      description: "Show help message",
      source: "extension",
      sourceInfo: { kind: "extension", extensionId: "core" } as any,
    },
    {
      name: "handoff",
      description: "Handoff task",
      source: "skill",
      sourceInfo: { kind: "skill" } as any,
    },
    {
      name: "clear",
      description: "Clear screen",
      source: "extension",
      sourceInfo: { kind: "extension", extensionId: "core" } as any,
    },
  ];

  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => customCandidates);

  // Typing /h should match both help and handoff, but not clear
  const suggestions = await provider.getSuggestions(["/h"], 0, 2, { signal: new AbortController().signal });
  assert.ok(suggestions);
  assert.equal(suggestions.prefix, "/h");
  const values = suggestions.items.map((it) => it.value);
  assert.ok(values.includes("/help"));
  assert.ok(values.includes("/skill:handoff"));
  assert.ok(!values.includes("/clear"));

  // Typing mid-sentence "please use /h"
  const midSentence = await provider.getSuggestions(["please use /h"], 0, "please use /h".length, { signal: new AbortController().signal });
  assert.ok(midSentence);
  assert.equal(midSentence.prefix, "/h");
  const midValues = midSentence.items.map((it) => it.value);
  assert.ok(midValues.includes("/help"));
  assert.ok(midValues.includes("/skill:handoff"));
});

test("applyCompletion: replaces token, adds trailing space, cursor is placed after space", () => {
  const current = createMockCurrentProvider();
  const provider = createInlineSlashAutocompleteProvider(current, () => mockCandidates);

  const item: AutocompleteItem = {
    value: "/skill:codebase-design",
    label: "/skill:codebase-design",
  };

  // Case 1: Start of line
  const res1 = provider.applyCompletion(["/sk"], 0, 3, item, "/sk");
  assert.deepEqual(res1.lines, ["/skill:codebase-design "]);
  assert.equal(res1.cursorLine, 0);
  assert.equal(res1.cursorCol, "/skill:codebase-design ".length);

  // Case 2: Mid-sentence
  const input2 = ["Please use /skill:cod to help me"];
  // prefix "/skill:cod" starts at index 11 and ends at 21
  const cursorCol2 = 21;
  const res2 = provider.applyCompletion(input2, 0, cursorCol2, item, "/skill:cod");
  assert.deepEqual(res2.lines, ["Please use /skill:codebase-design  to help me"]);
  assert.equal(res2.cursorLine, 0);
  assert.equal(res2.cursorCol, 11 + "/skill:codebase-design ".length);

  // Case 3: Fallback to current provider if prefix does not match end of beforeCursor
  let currentApplyCalled = false;
  const customCurrent = createMockCurrentProvider({
    applyCompletion(lines, line, col, it, pfx) {
      currentApplyCalled = true;
      return { lines, cursorLine: line, cursorCol: col };
    },
  });
  const customProvider = createInlineSlashAutocompleteProvider(customCurrent, () => mockCandidates);
  customProvider.applyCompletion(["something"], 0, 9, item, "/unknown");
  assert.equal(currentApplyCalled, true);
});
