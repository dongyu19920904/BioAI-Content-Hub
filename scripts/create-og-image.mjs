import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const output = path.join(process.cwd(), "public", "og-image.png");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f7f4ef"/>
  <rect x="58" y="54" width="1084" height="522" rx="28" fill="#ffffff" stroke="#161a17" stroke-width="3"/>
  <rect x="95" y="92" width="180" height="34" rx="17" fill="#0f7a4d"/>
  <text x="125" y="115" fill="#ffffff" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="18" font-weight="700">AI 延续学内容库</text>
  <text x="95" y="213" fill="#161a17" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="66" font-weight="800">从每日商机</text>
  <text x="95" y="292" fill="#161a17" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="66" font-weight="800">生成文章和资料包</text>
  <text x="98" y="360" fill="#53605a" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="30" font-weight="500">筛选信号 · 写成科普 · 沉淀模板 · 验证变现</text>
  <g transform="translate(96 425)">
    <rect width="210" height="74" rx="16" fill="#e9f3ed"/>
    <text x="28" y="46" fill="#0f7a4d" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="24" font-weight="700">文章库</text>
  </g>
  <g transform="translate(334 425)">
    <rect width="210" height="74" rx="16" fill="#f5ecdc"/>
    <text x="28" y="46" fill="#8a5a12" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="24" font-weight="700">资料包</text>
  </g>
  <g transform="translate(572 425)">
    <rect width="250" height="74" rx="16" fill="#edf0f5"/>
    <text x="28" y="46" fill="#33527a" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="24" font-weight="700">自动化 Loop</text>
  </g>
  <circle cx="991" cy="210" r="79" fill="#e9f3ed"/>
  <circle cx="961" cy="209" r="31" stroke="#0f7a4d" stroke-width="12"/>
  <circle cx="1023" cy="209" r="31" stroke="#0f7a4d" stroke-width="12"/>
  <path d="M992 259V164" stroke="#0f7a4d" stroke-width="12" stroke-linecap="round"/>
  <text x="895" y="503" fill="#53605a" font-family="Microsoft YaHei, Noto Sans CJK SC, Arial, sans-serif" font-size="24" font-weight="700">life.aivora.cn</text>
</svg>`;

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, await sharp(Buffer.from(svg)).png().toBuffer());
console.log(`Created ${output}`);
