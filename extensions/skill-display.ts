interface LeadingSkillBlocks {
  blocks: { name: string }[];
  userTail: string;
}

function parseLeadingSkillBlocks(markdown: string): LeadingSkillBlocks {
  const blocks: LeadingSkillBlocks["blocks"] = [];
  let offset = 0;
  let tailOffset = 0;
  while (true) {
    const match = markdown.slice(offset).match(
      /^<skill name="([^"\n]+)" location="([^"\n]+)">\n([\s\S]*?)\n<\/skill>(?=\n\n|$)/
    );
    if (!match) break;
    const [, name = "", , content = ""] = match;
    if (/<skill[\s/>]/.test(content)) break;
    blocks.push({ name });
    tailOffset = offset + match[0].length;
    if (!markdown.startsWith("\n\n", tailOffset)) break;
    offset = tailOffset + 2;
  }
  return { blocks, userTail: markdown.slice(tailOffset) };
}

export function formatSkillDisplay(markdown: string, expanded: boolean, hint?: string): string {
  if (expanded) return markdown;
  const { blocks, userTail } = parseLeadingSkillBlocks(markdown);
  if (!blocks.length) return markdown;
  return blocks.map(({ name }) => `[skill] ${name}${hint ? ` (${hint})` : ""}`).join("\n\n") + userTail;
}
