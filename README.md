<div align="center">

# ⚡ pi-slash-anywhere

**Use slash commands, prompt templates, and skills anywhere inline in your prompts.**

[![GitHub Release](https://img.shields.io/github/v/release/toRolex/pi-slash-anywhere?style=flat-square&color=blue)](https://github.com/toRolex/pi-slash-anywhere/releases)
[![CI Status](https://img.shields.io/github/actions/workflow/status/toRolex/pi-slash-anywhere/release.yml?branch=main&style=flat-square&label=CI)](https://github.com/toRolex/pi-slash-anywhere/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Pi Packages](https://img.shields.io/badge/Pi%20Package-Gallery-purple?style=flat-square)](https://pi.dev/packages)

[Features](#-key-features) • [Installation](#-installation) • [How It Works](#-how-it-works) • [Configuration](#-configuration) • [Contributing](#-contributing)

[中文](README.zh-CN.md)

---

</div>

By default in Pi, slash commands (`/help`, `/clear`) and skill references are only triggered at the very start of a line. 

**`pi-slash-anywhere`** brings full **inline autocompletion** and **auto-expansion** to any position in your prompt message — whether you are referencing multiple skills mid-sentence or typing slash shortcuts on the fly.

```text
Please analyze this auth module using /skill:security-audit and then review with /skill:code-review
                                       ▲                                          ▲
                                   Autocompleted                             Autocompleted
```

---

## ✨ Key Features

- 🎯 **Inline Trigger Anywhere**: Type `/` anywhere preceded by whitespace or at the start of a line to bring up suggestions.
- 🔍 **Unified Autocomplete Aggregation**:
  - 🛠 **Skills**: `/skill:<name>`
  - ⚡ **Interactive Commands**: `/clear`, `/model`, `/help`, etc.
  - 📝 **Prompt Templates**: Dynamic project prompt templates.
- 🛡 **Smart Path Boundary Detection**:
  - Automatically avoids false positives on file paths (e.g. `foo/bar`, `https://`).
  - Seamlessly retreats to native file completion when typing a directory path like `/src/components/`.
- 🚀 **Zero-Friction Skill Prepending**:
  - Inline tokens like `/skill:diagnosing-bugs` are automatically stripped of YAML frontmatter and prepended to your prompt context with clear boundary tags upon submission.
  - Fully deduplicated and resilient: unresolved skills stay as plain text without throwing errors or blocking execution.

---

## 📦 Installation

### Option 1: Direct from Git (Recommended)

Install the latest version directly into your global Pi environment:

```bash
pi install git:github.com/toRolex/pi-slash-anywhere
```

To update to the latest version at any time:
```bash
pi update git:github.com/toRolex/pi-slash-anywhere
```

### Option 2: From npm / Pi Package Gallery

```bash
pi install npm:pi-slash-anywhere
```

### Option 3: Local Development / Temporary Session

Run once without persistent installation:

```bash
pi -e ./extensions/index.ts
```

Or link locally:
```bash
pi install .
```

---

## 💡 How It Works

### 1. Autocompletion Trigger

Whenever your cursor follows a space and a `/`, the completion popup is summoned:

| Input | Triggered? | Candidates |
| :--- | :---: | :--- |
| `/` (start of line) | ✅ | Commands, Skills, Templates |
| `check this /` | ✅ | Commands, Skills, Templates |
| `check this /skill:` | ✅ | Filtered strictly to skills |
| `http://...` or `a/b` | ❌ | Ignored (non-whitespace boundary) |
| `/usr/local/` | ❌ | Converted to native file completion |

### 2. Prompt Interception & Injection

When you submit a message containing inline skill tokens:

**Input:**
```text
Please review this PR with /skill:code-review and /skill:diagnosing-bugs
```

**What Pi & Agent receives:**
```text
[Included Skill: code-review]
<skill instructions and body...>

[Included Skill: diagnosing-bugs]
<skill instructions and body...>

Please review this PR with /skill:code-review and /skill:diagnosing-bugs
```

---

## ⚙️ Configuration

You can customize behavior in your `~/.pi/agent/settings.json` or project settings:

```jsonc
{
  "pi-slash-anywhere": {
    "enabled": true,       // Enable or disable inline skill transformation
    "fuzzy": true          // Match suggestions with fuzzy search
  }
}
```

---

## 🛠 Development & Testing

```bash
# Clone the repository
git clone https://github.com/toRolex/pi-slash-anywhere.git
cd pi-slash-anywhere

# Install dependencies
npm install

# Run unit and integration tests
npm test

# Typecheck
npm run typecheck
```

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/toRolex/pi-slash-anywhere/issues).

Distributed under the [MIT License](LICENSE).
