import fs from "node:fs";
import path from "node:path";

const FILES = ["methodology.md", "offers.md", "case_studies.md", "voice.md", "corridor_facts.md", "compliance.md", "banned_phrases.md"] as const;

/** Loads the knowledge base from /kb as one cacheable block for system prompts. */
export function loadKb(): string {
  const dir = path.join(process.cwd(), "kb");
  return FILES.map((f) => {
    const p = path.join(dir, f);
    const body = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : `(missing ${f})`;
    return `<${f.replace(".md", "")}>\n${body}\n</${f.replace(".md", "")}>`;
  }).join("\n\n");
}

export function bannedPhrases(): string[] {
  const p = path.join(process.cwd(), "kb", "banned_phrases.md");
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split("\n").filter((l) => l && !l.startsWith("#"))
    .flatMap((l) => l.split(",")).map((s) => s.replace(/\(.*?\)/g, "").trim().toLowerCase()).filter(Boolean);
}
