import test from "node:test";
import assert from "node:assert/strict";
import { keyText } from "@earendil-works/pi-coding-agent";
import { KeybindingsManager, TUI_KEYBINDINGS } from "@earendil-works/pi-tui";

const bindings = (key = "ctrl+o") => new KeybindingsManager({
  ...TUI_KEYBINDINGS, "app.tools.expand": { defaultKeys: "ctrl+o" },
}, { "app.tools.expand": key as any });
import slashAnywhereExtension from "../extensions/index.js";
import { InlineSlashEditor } from "../extensions/editor.js";

const payload = '<skill name="two" location="/two/SKILL.md">\nTWO body\n</skill>\n\n  user  \n';
const theme = { borderColor: (text: string) => text, selectList: {} } as any;

function register() {
  const handlers = new Map<string, Function>();
  let transform: Function | undefined;
  slashAnywhereExtension({
    on: (name: string, handler: Function) => handlers.set(name, handler),
    registerCommand: () => {},
    registerMarkdownTransformer: (handler: Function) => { transform = handler; },
  } as any);
  return { handlers, render: (text: string, messageType = "user") => transform!(text, { messageType, isStreaming: false, availableWidth: 80 }) };
}

test("display transformer uses live session getter and only formats user markdown", () => {
  const { handlers, render } = register();
  assert.equal(render(payload), payload);
  let expanded = false;
  let factory: Function | undefined;
  handlers.get("session_start")!({}, {
    hasUI: true,
    ui: {
      getToolsExpanded() { return expanded; },
      addAutocompleteProvider: () => {},
      setEditorComponent: (value: Function) => { factory = value; },
    },
  });
  assert.equal(render(payload), `[skill] two (${keyText("app.tools.expand")} to expand)\n\n  user  \n`);
  assert.equal(render(payload, "assistant"), payload);
  assert.equal(render(payload, "assistant-thinking"), payload);
  expanded = true;
  assert.equal(render(payload), payload);
  const editor = factory!({ requestRender() {}, invalidate() {}, terminal: { rows: 24 } }, theme, bindings());
  editor.setWorkingStatusIndicator({ renderInBorder: () => "WORKING", renderSpinnerInBorder: () => "*" });
  assert.ok(editor.render(80)[0].includes("WORKING"));
});

test("missing getter and headless sessions preserve original display", () => {
  const { handlers, render } = register();
  handlers.get("session_start")!({}, { hasUI: true, ui: { addAutocompleteProvider() {}, setEditorComponent() {} } });
  assert.equal(render(payload), payload);
  handlers.get("session_start")!({}, { hasUI: false, ui: {} });
  assert.equal(render(payload), payload);
});

for (const [binding, input] of [["ctrl+o", "\x0f"], ["ctrl+y", "\x19"]]) {
  test(`editor invalidates synchronously on native ${binding} expansion in both directions`, () => {
    let expanded = false;
    const states: boolean[] = [];
    const editor = new InlineSlashEditor({ requestRender() {}, invalidate() { states.push(expanded); } } as any,
      theme, bindings(binding) as any,
      { getToolsExpanded: () => expanded } as any);
    editor.onAction("app.tools.expand", () => { expanded = !expanded; });
    editor.handleInput(input!);
    assert.equal(expanded, true);
    assert.deepEqual(states, [true]);
    editor.handleInput("a");
    assert.equal(editor.getText(), "a");
    assert.deepEqual(states, [true]);
    editor.handleInput(input!);
    assert.deepEqual(states, [true, false]);
  });
}

test("editor without options retains native app actions and typing", () => {
  let expanded = false;
  const editor = new InlineSlashEditor({ requestRender() {} } as any, theme, bindings() as any);
  editor.onAction("app.tools.expand", () => { expanded = !expanded; });
  editor.handleInput("\x0f");
  editor.handleInput("z");
  assert.equal(expanded, true);
  assert.equal(editor.getText(), "z");
});
