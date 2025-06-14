import { expect, it } from "vitest";

it("should run a directory recursively", async () => {
  await import("./main.js");
  expect(process.exitCode).toBeUndefined();
});