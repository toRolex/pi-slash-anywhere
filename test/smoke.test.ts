import test from "node:test";
import assert from "node:assert/strict";
import slashAnywhereExtension from "../extensions/index.js";

test("smoke test: extension entry point exports a function", () => {
  assert.equal(typeof slashAnywhereExtension, "function");
});

test("smoke test: extension entry can be invoked with mock pi context", () => {
  let registered = false;
  const mockPi = {
    on: () => {},
    registerCommand: () => {
      registered = true;
    },
  };

  assert.doesNotThrow(() => {
    slashAnywhereExtension(mockPi as any);
  });
});
