import { keyText, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createInlineSlashAutocompleteProvider } from "./autocomplete.js";
import { registerInlineSkillInterceptor } from "./interceptor.js";
import { InlineSlashEditor } from "./editor.js";
import { formatSkillDisplay } from "./skill-display.js";

/**
 * Entry point for pi-slash-anywhere extension.
 * Provides inline autocomplete and expansion for slash commands, skills, and prompt templates.
 */
export default function slashAnywhereExtension(pi: ExtensionAPI): void {
  let getToolsExpanded: (() => boolean) | undefined;
  pi.registerMarkdownTransformer((markdown, { messageType }) => {
    if (messageType !== "user" || !getToolsExpanded) return markdown;
    return formatSkillDisplay(markdown, getToolsExpanded(), `${keyText("app.tools.expand")} to expand`);
  });

  // Register inline slash autocomplete provider and custom editor in TUI sessions
  pi.on("session_start", (_event, ctx) => {
    getToolsExpanded = ctx.hasUI && typeof ctx.ui.getToolsExpanded === "function"
      ? () => ctx.ui.getToolsExpanded()
      : undefined;
    if (ctx.hasUI) {
      ctx.ui.addAutocompleteProvider((current) =>
        createInlineSlashAutocompleteProvider(current, () => pi.getCommands())
      );

      // Register CustomEditor wrapper so inline "/" triggers autocomplete
      if (typeof ctx.ui.setEditorComponent === "function") {
        ctx.ui.setEditorComponent((tui, theme, keybindings) =>
          new InlineSlashEditor(tui, theme, keybindings, { embedWorkingStatus: true, getToolsExpanded })
        );
      }
    }
  });

  // Register inline skill input interceptor & prepend expansion
  registerInlineSkillInterceptor(pi);
}
