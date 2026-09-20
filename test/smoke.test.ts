import test from "node:test";
import assert from "node:assert/strict";
import slashAnywhereExtension from "../extensions/index.js";
import { InlineSlashEditor } from "../extensions/editor.js";
import type { KeybindingsManager } from "@earendil-works/pi-coding-agent";

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

test("InlineSlashEditor: triggers autocomplete when inline slash is typed", () => {
  let autocompleteTriggeredCount = 0;
  let lastExplicitTab: boolean | undefined;

  const mockTui = {
    requestRender: () => {},
  } as any;
  const mockTheme = {
    borderColor: (t: string) => t,
    selectList: {},
  } as any;
  const mockKeybindings: KeybindingsManager = {
    matches: () => false,
    getKeybinding: () => undefined,
  } as any;

  const editor = new InlineSlashEditor(mockTui, mockTheme, mockKeybindings);

  // Stub tryTriggerAutocomplete on instance
  (editor as any).tryTriggerAutocomplete = (explicitTab?: boolean) => {
    autocompleteTriggeredCount++;
    lastExplicitTab = explicitTab;
  };

  // Case 1: Typing text without slash -> no trigger
  editor.handleInput("h");
  editor.handleInput("e");
  editor.handleInput("l");
  editor.handleInput("l");
  editor.handleInput("o");
  assert.equal(autocompleteTriggeredCount, 0);

  // Case 2: Typing space then slash: "hello /" -> triggers autocomplete!
  editor.handleInput(" ");
  editor.handleInput("/");
  assert.equal(autocompleteTriggeredCount, 1);

  // Case 3: Typing characters after inline slash: "hello /h" -> triggers autocomplete!
  editor.handleInput("h");
  assert.equal(autocompleteTriggeredCount, 2);

  // Case 4: Pressing Tab when inline slash trigger is active -> triggers with explicitTab=true
  editor.handleInput("\t");
  assert.equal(autocompleteTriggeredCount, 3);
  assert.equal(lastExplicitTab, true);
});
