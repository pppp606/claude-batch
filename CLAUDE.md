# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `claude-batch`, a Node.js CLI tool that wraps Claude Code's interactive mode to enable non-interactive batch execution of prompts with optional post-processing hooks.

## Architecture

- **Modular design**: Main logic is in `lib.js` with testable functions, `index.js` serves as CLI entry point
- **Command resolution**: Loads prompts from `~/.claude/commands/*.md` using `/commandName` syntax
- **Argument substitution**: Replaces `#$ARGUMENTS` placeholders in command files with user input
- **Output handling**: Saves Claude's response to `~/.claude-batch/tmp/out_<timestamp>.txt`
- **Hook system**: Supports Shell scripts and Node.js files for post-processing
- **Comprehensive testing**: Jest test suite covers argument parsing, command loading, and error handling

## Development Commands

```bash
# Install dependencies
npm install

# Install globally for testing
npm install -g .

# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run the CLI
claude-batch -p --model sonnet /commandName "argument" --hook ./script.sh

# Test without hooks
claude-batch -p /commandName "argument"
```

## Key Flags
- `-p, --print`: Print output to console
- `--model <model>`: Specify Claude model
- `-d, --debug`: Enable debug mode
- `--hook <script>`: Run post-processing script (Shell or Node.js)

## Dependencies and Integration

- Requires Claude Code CLI (`claude` command) to be available in PATH
- Depends on `~/.claude/commands/` directory structure from Claude Code
- Creates temporary files in `~/.claude-batch/tmp/`
- No external npm dependencies (uses only Node.js built-ins)

## Hook Script Interface

Hook scripts receive the output file path as their first argument:
- Shell: `$1` contains the file path
- Node.js: `process.argv[2]` contains the file path