import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createInlineSlashAutocompleteProvider } from "./autocomplete.js";
import { registerInlineSkillInterceptor } from "./interceptor.js";
import { InlineSlashEditor } from "./editor.js";

/**
 * Entry point for pi-slash-anywhere extension.
 * Provides inline autocomplete and expansion for slash commands, skills, and prompt templates.
 */
export default function slashAnywhereExtension(pi: ExtensionAPI): void {
  // Register inline slash autocomplete provider and custom editor in TUI sessions
  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) {
      ctx.ui.addAutocompleteProvider((current) =>
        createInlineSlashAutocompleteProvider(current, () => pi.getCommands())
      );

      // Register CustomEditor wrapper so inline "/" triggers autocomplete
      if (typeof ctx.ui.setEditorComponent === "function") {
        ctx.ui.setEditorComponent((tui, theme, keybindings) =>
          new InlineSlashEditor(tui, theme, keybindings, { embedWorkingStatus: true })
        );
      }
    }
  });

  // Register inline skill input interceptor & prepend expansion
  registerInlineSkillInterceptor(pi);
}
