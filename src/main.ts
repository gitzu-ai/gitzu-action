import { getInput, logError, logInfo } from "gha-utils";

try {
  const apiKey = getInput("apiKey");
  logInfo(apiKey);
} catch (err) {
  logError(err);
  process.exitCode = 1;
}
