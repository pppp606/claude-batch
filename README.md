# claude-batch

A CLI wrapper for executing Claude prompts non-interactively and triggering a user-defined hook script upon completion.

## 🔧 Features

- Loads prompts using `/commandName [argument]` syntax (from Claude Code's `.claude/commands/*.md`)
- Supports argument substitution with `#$ARGUMENTS`
- Supports key flags: `--model`, `--debug`, `--print`
- Optional `--hook` to run a post-processing script (Shell or Node.js)


## 🚀 Installation

```bash
npm install -g .
```

## 🧪 Usage

```bash
claude-batch -p --model sonnet /notify "42" --hook ./notify-done.sh
```

This will:
1.	Replace #$ARGUMENTS in .claude/commands/notify.md 42
2.	Execute the resulting prompt using Claude
3.	Save the output to a temporary file
4.	Invoke the specified hook script, passing the output file path as its first argument


## 📜 Hook Script Examples

### 🔹 Shell Script
```bash
#!/bin/bash
FILE="$1"
echo "✅ Claude output:"
cat "$FILE"
```

### 🔹 Node.js Script
```bash
// notify-done.js
const fs = require("fs");
const path = process.argv[2];
console.log("✅ Claude result:");
console.log(fs.readFileSync(path, "utf8"));
```

### Run with:
```bash
claude-batch -p /notify 42 --hook ./notify-done.js
```

## 📂 Output

Claude’s output is saved to a file in:
`~/.claude-batch/tmp/out_<timestamp>.txt`

This file path is passed to the hook script as $1 (or process.argv[2] in Node.js).

## 🧩 Possible Future Enhancements
- Separate --on-success and --on-fail hooks
- JSON output formatting
- Config file support via ~/.claude-batch/config.json


## 📄 License
MIT
