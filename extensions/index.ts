import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createInlineSlashAutocompleteProvider } from "./autocomplete.js";
import { registerInlineSkillInterceptor } from "./interceptor.js";

/**
 * Entry point for pi-slash-anywhere extension.
 * Provides inline autocomplete and expansion for slash commands, skills, and prompt templates.
 */
export default function slashAnywhereExtension(pi: ExtensionAPI): void {
  // Register inline slash autocomplete provider
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.addAutocompleteProvider((current) =>
      createInlineSlashAutocompleteProvider(current, () => pi.getCommands())
    );
  });

  // Register inline skill input interceptor & prepend expansion
  registerInlineSkillInterceptor(pi);
}
