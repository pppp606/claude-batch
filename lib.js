const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const result = {
    debug: false,
    model: null,
    print: false,
    hook: null,
    commandName: null,
    commandArg: null
  };

  const argsCopy = [...args];
  
  while (argsCopy.length > 0) {
    const arg = argsCopy.shift();
    switch (arg) {
      case "-d":
      case "--debug":
        result.debug = true;
        break;
      case "--model":
        result.model = argsCopy.shift();
        break;
      case "-p":
      case "--print":
        result.print = true;
        break;
      case "--hook":
        result.hook = argsCopy.shift();
        break;
      default:
        if (arg.startsWith("/")) {
          result.commandName = arg.slice(1);
          if (argsCopy.length > 0 && !argsCopy[0].startsWith("-")) {
            result.commandArg = argsCopy.shift();
          }
        } else {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  return result;
}

/**
 * Load and process command file
 */
function loadCommand(commandName, commandArg, homeDir = os.homedir()) {
  const commandDir = path.join(homeDir, ".claude", "commands");
  const commandPath = path.join(commandDir, `${commandName}.md`);
  
  if (!fs.existsSync(commandPath)) {
    throw new Error(`Command file not found: ${commandPath}`);
  }

  let prompt = fs.readFileSync(commandPath, "utf8");
  if (commandArg) {
    prompt = prompt.replace(/#\$ARGUMENTS/g, commandArg);
  }
  
  return prompt;
}

/**
 * Prepare temporary directory and file
 */
function prepareTempFile(homeDir = os.homedir()) {
  const tmpDir = path.join(homeDir, ".claude-batch", "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `out_${Date.now()}.txt`);
  return tmpFile;
}

/**
 * Build claude command arguments
 */
function buildClaudeArgs(options, prompt) {
  const claudeArgs = [];
  if (options.print) claudeArgs.push("-p");
  if (options.debug) claudeArgs.push("--debug");
  if (options.model) claudeArgs.push("--model", options.model);
  claudeArgs.push(prompt);
  return claudeArgs;
}

/**
 * Execute claude command
 */
function executeClaude(claudeArgs, tmpFile, hook) {
  return new Promise((resolve, reject) => {
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
        executeHook(hook, tmpFile)
          .then(() => resolve({ code, output, tmpFile }))
          .catch(reject);
      } else {
        console.log("Claude output written to:", tmpFile);
        resolve({ code, output, tmpFile });
      }
    });

    claude.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Execute hook script
 */
function executeHook(hook, tmpFile) {
  return new Promise((resolve, reject) => {
    const isJsHook = hook.endsWith(".js");
    const hookCommand = isJsHook ? "node" : hook;
    const hookArgs = isJsHook ? [hook, tmpFile] : [tmpFile];

    const hookProc = spawn(hookCommand, hookArgs, {
      stdio: "inherit",
      shell: !isJsHook,
    });

    hookProc.on("error", (err) => {
      console.error(`Hook error: ${err.message}`);
      reject(err);
    });

    hookProc.on("close", (code) => {
      resolve(code);
    });
  });
}

/**
 * Main function
 */
async function main(args) {
  try {
    const options = parseArgs(args);
    
    if (!options.commandName) {
      throw new Error("No command specified (e.g. /foo)");
    }

    const prompt = loadCommand(options.commandName, options.commandArg);
    const tmpFile = prepareTempFile();
    const claudeArgs = buildClaudeArgs(options, prompt);
    
    await executeClaude(claudeArgs, tmpFile, options.hook);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

module.exports = {
  parseArgs,
  loadCommand,
  prepareTempFile,
  buildClaudeArgs,
  executeClaude,
  executeHook,
  main
};