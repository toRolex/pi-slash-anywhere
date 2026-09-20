# Inline Slash Trigger Boundary and Path Conflict Resolution

When typing `/` outside of line start, native Pi defaults to file path autocomplete. We decided to trigger inline slash completion only when `/` is preceded by whitespace or at the start of a line, and yield back to file autocomplete if subsequent slashes occur (e.g. `/path/to/file`), to prevent disrupting normal file navigation.
