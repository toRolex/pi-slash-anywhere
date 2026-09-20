# pi-slash-anywhere

A Pi extension that provides inline autocomplete for slash commands, skills, and prompt templates anywhere in the prompt message, along with automatic inline skill expansion.

## Language

**Inline Slash Completion**:
Triggering slash completion anywhere in the editor text (after whitespace or line start) rather than exclusively at the very start of the first line.
_Avoid_: Global autocomplete, anywhere slash

**Skill Invocation**:
A reference to a registered skill in the format `/skill:<name>`, which can be completed inline and expanded into full skill markdown context.
_Avoid_: Skill command, skill macro

**Inline Expansion**:
The process of intercepting user input before dispatch to resolve inline `/skill:<name>` references, prepending deduplicated `<skill>...</skill>` blocks to the prompt head while preserving user message structure.
_Avoid_: Template rendering, macro replacement

**Prompt Template**:
A reusable prompt prefix or snippet triggered via `/<name>`.
_Avoid_: Macro, prompt snippet
