#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const homeDir = os.homedir();
const commandDir = path.join(homeDir, ".claude", "commands");

let debug = false;
let model = null;
let print = false;
let hook = null;
let commandName = null;
let commandArg = null;

while (args.length > 0) {
  const arg = args.shift();
  switch (arg) {
    case "-d":
    case "--debug":
      debug = true;
      break;
    case "--model":
      model = args.shift();
      break;
    case "-p":
    case "--print":
      print = true;
      break;
    case "--hook":
      hook = args.shift();
      break;
    default:
      if (arg.startsWith("/")) {
        commandName = arg.slice(1);
        if (args.length > 0 && !args[0].startsWith("-")) {
          commandArg = args.shift();
        }
      } else {
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
      }
  }
}

if (!commandName) {
  console.error("No command specified (e.g. /foo)");
  process.exit(1);
}

const commandPath = path.join(commandDir, `${commandName}.md`);
if (!fs.existsSync(commandPath)) {
  console.error(`Command file not found: ${commandPath}`);
  process.exit(1);
}

let prompt = fs.readFileSync(commandPath, "utf8");
if (commandArg) {
  prompt = prompt.replace(/#\$ARGUMENTS/g, commandArg);
}

const tmpDir = path.join(homeDir, ".claude-batch", "tmp");
fs.mkdirSync(tmpDir, { recursive: true });
const tmpFile = path.join(tmpDir, `out_${Date.now()}.txt`);

const claudeArgs = [];
if (print) claudeArgs.push("-p");
if (debug) claudeArgs.push("--debug");
if (model) claudeArgs.push("--model", model);
claudeArgs.push(prompt);

const claude = spawn("claude", claudeArgs, { shell: true });

let output = "";
claude.stdout.on("data", (data) => {
  output += data.toString();
});
claude.stderr.on("data", (data) => {
  console.error(data.toString());
});

claude.on("close", (code) => {
  fs.writeFileSync(tmpFile, output, "utf8");

  if (hook) {
    const isJsHook = hook.endsWith(".js");
    const hookCommand = isJsHook ? "node" : hook;
    const hookArgs = isJsHook ? [hook, tmpFile] : [tmpFile];

    const hookProc = spawn(hookCommand, hookArgs, {
      stdio: "inherit",
      shell: !isJsHook,
    });

    hookProc.on("error", (err) => {
      console.error(`Hook error: ${err.message}`);
    });
  } else {
    console.log("Claude output written to:", tmpFile);
  }
});