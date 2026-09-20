import type { AutocompleteProvider, AutocompleteSuggestions, AutocompleteItem } from "@earendil-works/pi-tui";
import type { SlashCommandInfo } from "@earendil-works/pi-coding-agent";

/**
 * Regex matching the trigger condition for inline slash commands:
 * Must start either at line start or after whitespace (space or tab),
 * followed by a slash and optional non-whitespace characters until the cursor.
 */
const INLINE_SLASH_TRIGGER = /(?:^|[ \t])\/([^\s]*)$/;

/**
 * Regex checking if text before cursor is currently a slash command prefix without path separators.
 */
const SLASH_TOKEN_BEFORE_CURSOR = /(?:^|[ \t])\/[^\s/]*$/;

/**
 * Regex checking if text before cursor contains path separators after a slash token.
 */
const PATH_SEPARATOR_BEFORE_CURSOR = /(?:^|[ \t])\/[^\s/]*\//;

/**
 * Creates an AutocompleteProvider that layers inline slash command, prompt template,
 * and skill completion on top of the existing provider.
 */
export function createInlineSlashAutocompleteProvider(
  current: AutocompleteProvider,
  getCandidates: () => Promise<SlashCommandInfo[]> | SlashCommandInfo[]
): AutocompleteProvider {
  return {
    triggerCharacters: Array.from(new Set([...(current.triggerCharacters ?? []), "/"])),

    async getSuggestions(lines: string[], cursorLine: number, cursorCol: number, options: { signal: AbortSignal; force?: boolean }): Promise<AutocompleteSuggestions | null> {
      const line = lines[cursorLine] ?? "";
      const beforeCursor = line.slice(0, cursorCol);

      const match = beforeCursor.match(INLINE_SLASH_TRIGGER);
      if (!match) {
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }

      const token = match[1] ?? "";

      // When query/token contains additional `/` (e.g. `/path/to/file`): yield to current provider
      if (token.includes("/")) {
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }

      const rawCandidates = await getCandidates();

      // Aggregate commands, prompt templates, and skills into candidate suggestions
      // Commands/templates: value and label `/${item.name}`
      // Skills: value and label `/skill:${skillName}` (handle item.name being `skill:name` or source === 'skill')
      const items: AutocompleteItem[] = [];

      for (const item of rawCandidates) {
        const isSkill = item.source === "skill" || item.name.startsWith("skill:");
        let value: string;
        let label: string;

        if (isSkill) {
          const skillName = item.name.startsWith("skill:")
            ? item.name.slice("skill:".length)
            : item.name;
          value = `/skill:${skillName}`;
          label = `/skill:${skillName}`;
        } else {
          value = `/${item.name}`;
          label = `/${item.name}`;
        }

        items.push({
          value,
          label,
          description: item.description,
        });
      }

      // Dynamic narrowing: if token starts with `skill:`, strictly filter only skills!
      const isNarrowedToSkill = token.startsWith("skill:");
      const prefix = `/${token}`;

      let filtered = items;
      if (isNarrowedToSkill) {
        filtered = filtered.filter((it) => it.value.startsWith("/skill:"));
      }

      // Filter by prefix (case-insensitive for convenience or exact prefix match)
      const tokenLower = token.toLowerCase();
      filtered = filtered.filter((it) => {
        const valWithoutSlash = it.value.slice(1).toLowerCase();
        return valWithoutSlash.startsWith(tokenLower);
      });

      return {
        items: filtered,
        prefix,
      };
    },

    applyCompletion(lines: string[], cursorLine: number, cursorCol: number, item: AutocompleteItem, prefix: string) {
      const line = lines[cursorLine] ?? "";
      const beforeCursor = line.slice(0, cursorCol);
      const afterCursor = line.slice(cursorCol);

      // Replace the matched prefix (the `/` and token) with item.value + " "
      // and advance cursor column to right after the space.
      if (beforeCursor.endsWith(prefix)) {
        const newLine = beforeCursor.slice(0, beforeCursor.length - prefix.length) + item.value + " " + afterCursor;
        const newCol = cursorCol - prefix.length + item.value.length + 1;
        const newLines = [...lines];
        newLines[cursorLine] = newLine;
        return {
          lines: newLines,
          cursorLine,
          cursorCol: newCol,
        };
      }

      return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
    },

    shouldTriggerFileCompletion(lines: string[], line: number, col: number): boolean {
      const currentLine = lines[line] ?? "";
      const beforeCursor = currentLine.slice(0, col);

      // If text before cursor matches `/(?:^|[ \t])\/[^\s/]*$/`, return false.
      if (SLASH_TOKEN_BEFORE_CURSOR.test(beforeCursor)) {
        return false;
      }

      // If contains path separators (`/(?:^|[ \t])\/[^\s/]*\//`), return true (yield to file completion).
      if (PATH_SEPARATOR_BEFORE_CURSOR.test(beforeCursor)) {
        return true;
      }

      // Otherwise delegate to `current.shouldTriggerFileCompletion?.(lines, line, col) ?? true`.
      return current.shouldTriggerFileCompletion?.(lines, line, col) ?? true;
    },
  };
}
