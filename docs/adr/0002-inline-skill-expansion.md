# Inline Skill Expansion on Message Submission

Native Pi only expands `/skill:<name>` when it appears at the exact start of a message. We decided to intercept message submission via the `input` event to automatically expand inline `/skill:<name>` references into full `<skill>...</skill>` context blocks, guarded by a configuration option that defaults to enabled, ensuring consistent user mental models between completion and execution.
