<div align="center">

# ⚡ pi-slash-anywhere

**在提示词的任意位置内联使用斜杠命令、提示词模板和技能。**

[English](README.md)

[![GitHub Release](https://img.shields.io/github/v/release/toRolex/pi-slash-anywhere?style=flat-square&color=blue)](https://github.com/toRolex/pi-slash-anywhere/releases)
[![CI Status](https://img.shields.io/github/actions/workflow/status/toRolex/pi-slash-anywhere/release.yml?branch=main&style=flat-square&label=CI)](https://github.com/toRolex/pi-slash-anywhere/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Pi Packages](https://img.shields.io/badge/Pi%20Package-Gallery-purple?style=flat-square)](https://pi.dev/packages)

[功能特性](#-核心特性) • [安装](#-安装) • [工作原理](#-工作原理) • [配置](#-配置) • [参与贡献](#-参与贡献与许可)

---

</div>

在 Pi 中，斜杠命令（`/help`、`/clear`）和技能引用默认只能在行首触发。

**`pi-slash-anywhere`** 为提示词中的任意位置带来完整的**内联自动补全**和**自动展开**——无论是在句子中间引用多个技能，还是随手输入斜杠快捷方式。

```text
Please analyze this auth module using /skill:security-audit and then review with /skill:code-review
                                       ▲                                          ▲
                                   自动补全                                     自动补全
```

---

## ✨ 核心特性

- 🎯 **任意位置内联触发**：在任意位置输入 `/`，只要前面是空白字符或位于行首，即可弹出建议。
- 🔍 **统一的自动补全聚合**：
  - 🛠 **技能（Skills）**：`/skill:<name>`
  - ⚡ **交互式命令**：`/clear`、`/model`、`/help` 等
  - 📝 **提示词模板**：动态加载项目的提示词模板。
- 🛡 **智能路径边界检测**：
  - 自动避免对文件路径的误判（如 `foo/bar`、`https://`）。
  - 输入类似 `/src/components/` 的目录路径时，无缝回退到原生文件补全。
- 🚀 **零摩擦的技能前置**：
  - 提交时，`/skill:diagnosing-bugs` 这样的内联标记会被自动剥离 YAML frontmatter，并加上清晰的边界标签，前置到你的提示词上下文中。
  - 完全去重且健壮：无法解析的技能保持为纯文本，不会抛出错误，也不会阻塞执行。

---

## 📦 安装

### 方式一：直接从 Git 安装（推荐）

直接安装最新版本到你的全局 Pi 环境：

```bash
pi install git:github.com/toRolex/pi-slash-anywhere
```

随时更新到最新版本：
```bash
pi update git:github.com/toRolex/pi-slash-anywhere
```

### 方式二：从 npm / Pi Package Gallery 安装

```bash
pi install npm:pi-slash-anywhere
```

### 方式三：本地开发 / 临时会话

不持久安装，运行一次：

```bash
pi -e ./extensions/index.ts
```

或本地链接：
```bash
pi install .
```

---

## 💡 工作原理

### 1. 自动补全触发

只要光标前是空格加 `/`，补全弹出框就会出现：

| 输入 | 是否触发？ | 候选项 |
| :--- | :---: | :--- |
| `/`（行首） | ✅ | 命令、技能、模板 |
| `check this /` | ✅ | 命令、技能、模板 |
| `check this /skill:` | ✅ | 严格过滤，仅显示技能 |
| `http://...` 或 `a/b` | ❌ | 忽略（非空白字符边界） |
| `/usr/local/` | ❌ | 转为原生文件补全 |

### 2. 提示词拦截与注入

当你提交的消息中包含内联技能标记时：

**输入：**
```text
Please review this PR with /skill:code-review and /skill:diagnosing-bugs
```

**Pi 与 Agent 实际收到：**
```text
[Included Skill: code-review]
<skill instructions and body...>

[Included Skill: diagnosing-bugs]
<skill instructions and body...>

Please review this PR with /skill:code-review and /skill:diagnosing-bugs
```

---

## ⚙️ 配置

你可以在 `~/.pi/agent/settings.json` 或项目设置中自定义行为：

```jsonc
{
  "pi-slash-anywhere": {
    "enabled": true,       // 启用或禁用内联技能转换
    "fuzzy": true          // 使用模糊搜索匹配建议
  }
}
```

---

## 🛠 开发与测试

```bash
# 克隆仓库
git clone https://github.com/toRolex/pi-slash-anywhere.git
cd pi-slash-anywhere

# 安装依赖
npm install

# 运行单元测试和集成测试
npm test

# 类型检查
npm run typecheck
```

---

## 🤝 参与贡献与许可

欢迎提交贡献、issue 和功能请求！欢迎访问 [issues 页面](https://github.com/toRolex/pi-slash-anywhere/issues)。

基于 [MIT License](LICENSE) 分发。
