import test from "node:test";
import assert from "node:assert/strict";
import { formatSkillDisplay } from "../extensions/skill-display.js";

const first = '<skill name="one" location="/skills/one/SKILL.md">\nONE body\n</skill>';
const second = '<skill name="two" location="/skills/two/SKILL.md">\nTWO body\n</skill>';
const third = '<skill name="three" location="/skills/three/SKILL.md">\nTHREE body\n</skill>';

test("two and three leading skill invocations collapse in order with unchanged tail", () => {
  assert.equal(formatSkillDisplay(`${first}\n\n${second}\n\nUse /skill:one and /skill:two.  \n`, false, "alt+o to expand"),
    '[skill] one (alt+o to expand)\n\n[skill] two (alt+o to expand)\n\nUse /skill:one and /skill:two.  \n');
  assert.equal(formatSkillDisplay(`${first}\n\n${second}\n\n${third}\n\n  user\n\n`, false),
    '[skill] one\n\n[skill] two\n\n[skill] three\n\n  user\n\n');
});

test("expansion returns exact original payload including whitespace", () => {
  const payload = `${first}\n\n${second}\n\n${third}\n\n  user\n\n`;
  assert.equal(formatSkillDisplay(payload, true, "alt+o to expand"), payload);
  assert.equal(formatSkillDisplay(first, false), '[skill] one');
});

test("nested skill examples and unterminated outer blocks stay unchanged", () => {
  for (const payload of [
    '<skill name="outer" location="/outer">\n```xml\n<skill>\nexample\n</skill>\n\n```\nREST\n</skill>',
    '<skill name="outer" location="/outer">\nmissing end\n<skill>\nexample\n</skill>',
    '<skill name="outer" location="/outer">\ninline <skill\tname="inner">\nexample\n</skill>',
    '<skill name="outer" location="/outer">\nUse the XML element <skill/> as an example.\n</skill>',
  ]) assert.equal(formatSkillDisplay(payload, false), payload);
});

test("unknown tokens, malformed blocks, mid-text blocks and fenced literals stay unchanged", () => {
  for (const payload of [
    '/skill:unknown',
    '<skill name="one">\nbody\n</skill>',
    '<skill name="one" location="/one">\nbody',
    '<skill name="one" location="/one">\nbody\n</skill>not a tail',
    '<skill name="one" location="/one">\nmissing end\n<skill name="two" location="/two">\nbody\n</skill>',
    `user\n\n${first}`,
    `\`\`\`xml\n${first}\n\`\`\``,
    `    ${first}`,
  ]) assert.equal(formatSkillDisplay(payload, false), payload);
  assert.equal(formatSkillDisplay(`${first}\n\nuser\n\n${second}`, false),
    `[skill] one\n\nuser\n\n${second}`);
  assert.equal(formatSkillDisplay(`${first}\n\n<skill name="bad">\nbroken`, false),
    '[skill] one\n\n<skill name="bad">\nbroken');
});
