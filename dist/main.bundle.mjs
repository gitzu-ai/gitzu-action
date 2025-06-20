import 'node:fs';
import 'node:fs/promises';
import os from 'node:os';
import 'node:path';
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { existsSync } from 'fs';

/**
 * Retrieves the value of a GitHub Actions input.
 *
 * @param name - The name of the GitHub Actions input.
 * @returns The value of the GitHub Actions input, or an empty string if not found.
 */
function getInput(name) {
    const value = process.env[`INPUT_${name.toUpperCase()}`] ?? "";
    return value.trim();
}

/**
 * Logs an information message in GitHub Actions.
 *
 * @param message - The information message to log.
 */
function logInfo(message) {
    process.stdout.write(`${message}${os.EOL}`);
}
/**
 * Logs an error message in GitHub Actions.
 *
 * @param err - The error, which can be of any type.
 */
function logError(err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`::error::${message}${os.EOL}`);
}

// (c) Anthropic PBC. All rights reserved. Use is subject to Anthropic's Commercial Terms of Service (https://www.anthropic.com/legal/commercial-terms).

var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = join(__filename2, "..");
async function* query({
  prompt,
  options: {
    abortController = new AbortController,
    allowedTools = [],
    appendSystemPrompt,
    customSystemPrompt,
    cwd,
    disallowedTools = [],
    executable = isRunningWithBun() ? "bun" : "node",
    executableArgs = [],
    maxTurns,
    mcpServers,
    pathToClaudeCodeExecutable = join(__dirname2, "cli.js"),
    permissionMode = "default",
    permissionPromptToolName,
    continue: continueConversation,
    resume,
    model
  } = {}
}) {
  process.env.CLAUDE_CODE_ENTRYPOINT = "sdk-ts";
  const args = ["--output-format", "stream-json", "--verbose"];
  if (customSystemPrompt)
    args.push("--system-prompt", customSystemPrompt);
  if (appendSystemPrompt)
    args.push("--append-system-prompt", appendSystemPrompt);
  if (maxTurns)
    args.push("--max-turns", maxTurns.toString());
  if (model)
    args.push("--model", model);
  if (permissionPromptToolName)
    args.push("--permission-prompt-tool", permissionPromptToolName);
  if (continueConversation)
    args.push("--continue");
  if (resume)
    args.push("--resume", resume);
  if (allowedTools.length > 0) {
    args.push("--allowedTools", allowedTools.join(","));
  }
  if (disallowedTools.length > 0) {
    args.push("--disallowedTools", disallowedTools.join(","));
  }
  if (mcpServers && Object.keys(mcpServers).length > 0) {
    args.push("--mcp-config", JSON.stringify({ mcpServers }));
  }
  if (permissionMode !== "default") {
    args.push("--permission-mode", permissionMode);
  }
  if (!prompt.trim()) {
    throw new RangeError("Prompt is required");
  }
  args.push("--print", prompt.trim());
  if (!existsSync(pathToClaudeCodeExecutable)) {
    throw new ReferenceError(`Claude Code executable not found at ${pathToClaudeCodeExecutable}. Is options.pathToClaudeCodeExecutable set?`);
  }
  logDebug(`Spawning Claude Code process: ${executable} ${[...executableArgs, pathToClaudeCodeExecutable, ...args].join(" ")}`);
  const child = spawn(executable, [...executableArgs, pathToClaudeCodeExecutable, ...args], {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    signal: abortController.signal,
    env: {
      ...process.env
    }
  });
  child.stdin.end();
  if (process.env.DEBUG) {
    child.stderr.on("data", (data) => {
      console.error("Claude Code stderr:", data.toString());
    });
  }
  const cleanup = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  };
  abortController.signal.addEventListener("abort", cleanup);
  process.on("exit", cleanup);
  try {
    let processError = null;
    child.on("error", (error) => {
      processError = new Error(`Failed to spawn Claude Code process: ${error.message}`);
    });
    const processExitPromise = new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (abortController.signal.aborted) {
          reject(new AbortError("Claude Code process aborted by user"));
        }
        if (code !== 0) {
          reject(new Error(`Claude Code process exited with code ${code}`));
        } else {
          resolve();
        }
      });
    });
    const rl = createInterface({ input: child.stdout });
    try {
      for await (const line of rl) {
        if (processError) {
          throw processError;
        }
        if (line.trim()) {
          yield JSON.parse(line);
        }
      }
    } finally {
      rl.close();
    }
    await processExitPromise;
  } finally {
    cleanup();
    abortController.signal.removeEventListener("abort", cleanup);
    if (process.env.CLAUDE_SDK_MCP_SERVERS) {
      delete process.env.CLAUDE_SDK_MCP_SERVERS;
    }
  }
}
function logDebug(message) {
  if (process.env.DEBUG) {
    console.debug(message);
  }
}
function isRunningWithBun() {
  return process.versions.bun !== undefined || process.env.BUN_INSTALL !== undefined;
}

class AbortError extends Error {
}

try {
    const apiKey = getInput("apiKey");
    const messages = [];
    for await (const message of query({
        prompt: "Write a haiku about foo.py",
        abortController: new AbortController(),
        options: {
            maxTurns: 3,
        },
    })) {
        messages.push(message);
    }
    console.log(messages);
    logInfo(`hello! ${apiKey}`);
}
catch (err) {
    logError(err);
    process.exitCode = 1;
}
