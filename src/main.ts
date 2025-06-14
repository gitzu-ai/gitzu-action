import { getInput, logError, logInfo } from "gha-utils";
import { query, type SDKMessage } from "@anthropic-ai/claude-code";

try {
  const apiKey = getInput("apiKey");
  const messages: SDKMessage[] = [];
  
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
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
