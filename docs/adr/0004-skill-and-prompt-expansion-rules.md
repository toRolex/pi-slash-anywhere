# Inline Skill & Prompt Template Expansion Rules

## Context
In native Pi:
- Skill expansion (`/skill:<name> [args]`) is implemented in `_expandSkillCommand(text)`: when text starts with `/skill:<name>`, it replaces the invocation with the `<skill name="..." location="...">...</skill>` block at the beginning, followed by `args`.
- Prompt templates (`/<template> [args]`) are implemented in `expandPromptTemplate(text, templates)`: when text starts with `/<template>`, it substitutes positional arguments `$1, $2, ...` and replaces the text.
- Built-in interactive commands like `/clear`, `/model`, `/login` are interactive actions handled by `interactive-mode`, not text prompts to LLMs. If placed inline, they must NOT be executed.

## Decision
1. **Skill Expansion (`/skill:<name>`)**:
   - Matches all `/skill:<name>` occurrences in the message.
   - For each resolved skill, extract and render the exact native Pi `<skill name="..." location="...">...</skill>` block.
   - Position: Keep the skill block at the **beginning** (prepended), matching Pi native layout (`<skill>...</skill>\n\n<user message>`), while replacing inline `/skill:<name>` occurrences or leaving them as clean references. Deduplicate skills so each is injected once at the top.
   - Unresolved skills are left intact as plain text.

2. **Prompt Templates (`/template`)**:
   - When autocompleting, include prompt templates in the candidates.
   - If a prompt template is invoked inline, only prompt templates that expand to text can be substituted, or left to user intent.

3. **Interactive Commands (`/clear`, `/model`, etc.)**:
   - Shown in autocomplete for discovery and ease of input.
   - Strictly treated as plain text if typed inline; never executed as interactive actions.
