import { readFileSync, statSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const MAX_FILE_BYTES = 1024 * 1024;       // 1 MB per file
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;  // 4 MB across all files (matches server cap)
const MAX_FILES = 64;
const SKIP_DIRS = new Set([".git", "node_modules", ".DS_Store", "dist", "build"]);
const SKIP_FILES = new Set([".DS_Store"]);

export interface CollectedFile {
  path: string;
  content_base64: string;
  size: number;
}

export interface CollectedFolder {
  files: CollectedFile[];
  totalBytes: number;
  skillMdContent: string;
  frontmatter: Record<string, string>;
}

async function walk(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await walk(join(root, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name)));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      out.push(prefix ? `${prefix}/${entry.name}` : entry.name);
    }
  }
  return out;
}

export function parseFrontmatter(skillMd: string): Record<string, string> {
  const m = skillMd.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---\s*[\r\n]/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(?:"([^"]*)"|'([^']*)'|(.+?))\s*$/);
    if (!kv) continue;
    out[kv[1]] = (kv[2] ?? kv[3] ?? kv[4] ?? "").trim();
  }
  return out;
}

export async function collectFolder(folderPath: string): Promise<CollectedFolder> {
  const folderStat = await stat(folderPath);
  if (!folderStat.isDirectory()) {
    throw new Error(`${folderPath} is not a directory`);
  }
  const skillMdPath = join(folderPath, "SKILL.md");
  try {
    statSync(skillMdPath);
  } catch {
    throw new Error(`${folderPath} does not contain a SKILL.md at its root`);
  }
  const skillMdContent = readFileSync(skillMdPath, "utf8");
  const frontmatter = parseFrontmatter(skillMdContent);
  if (!frontmatter.name) {
    throw new Error(`SKILL.md frontmatter must define a 'name:' field`);
  }
  if (!frontmatter.description) {
    throw new Error(`SKILL.md frontmatter must define a 'description:' field`);
  }

  const all = await walk(folderPath);
  let total = 0;
  const files: CollectedFile[] = [];
  for (const rel of all) {
    if (rel === "SKILL.md") continue; // handled separately
    const abs = join(folderPath, rel.split("/").join(sep));
    const sz = (await stat(abs)).size;
    if (sz > MAX_FILE_BYTES) {
      throw new Error(`${rel} is ${sz} bytes — exceeds ${MAX_FILE_BYTES} per-file limit`);
    }
    if (total + sz > MAX_TOTAL_BYTES) {
      throw new Error(`total size exceeds ${MAX_TOTAL_BYTES} bytes when adding ${rel}`);
    }
    if (files.length + 1 >= MAX_FILES) {
      throw new Error(`folder has more than ${MAX_FILES} files`);
    }
    const buf = readFileSync(abs);
    files.push({ path: rel, content_base64: buf.toString("base64"), size: sz });
    total += sz;
  }
  return {
    files,
    totalBytes: total + Buffer.byteLength(skillMdContent, "utf8"),
    skillMdContent,
    frontmatter
  };
}

export function describeRelative(folderPath: string): string {
  const rel = relative(process.cwd(), folderPath);
  return rel || folderPath;
}
