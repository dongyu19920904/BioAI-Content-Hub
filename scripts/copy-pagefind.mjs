import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "dist", "pagefind");
const target = path.join(root, "public", "pagefind");

await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.cp(source, target, { recursive: true });
console.log(`Copied ${source} -> ${target}`);
