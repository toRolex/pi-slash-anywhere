# Aggregated Autocomplete Source and Prefix Narrowing

We decided to aggregate registered commands, prompt templates, and skills into the autocomplete candidate list upon typing an inline `/`, while dynamically filtering to strictly skills once the user types `/skill:`. This provides a unified discovery entry point while preserving fast narrowing for skill lookups.
