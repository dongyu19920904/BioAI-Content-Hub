// Display an existing research prediction table; never train or infer a model.
export const SCORE_SHA256 =
  "8b70fa4a3f0047bf63346ee32a64faf812b74b6daf4b458add728af36b53e86d";
export const RESEARCH_THRESHOLD = 0.44;
export const PAGE_SIZE = 25;

export function parseScores(text) {
  if (typeof text !== "string" || text.length > 300_000)
    throw new Error("公开表大小异常，请下载原文件核对。");
  // Quoted commas, escaped quotes, CRLF and embedded newlines are supported.
  const records = [];
  let record = [],
    field = "",
    quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      record.push(field);
      if (record.some(value => value !== "")) records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("公开表引号未闭合。");
  if (field || record.length) records.push([...record, field]);
  const header = records.shift();
  if (JSON.stringify(header) !== '["Name","probability","z_score"]')
    throw new Error("公开表列名不符。");
  return records.map((values, index) => {
    const [name, probability, zScore] = values;
    const score = Number(probability),
      z = Number(zScore);
    if (
      values.length !== 3 ||
      !name ||
      name.length > 400 ||
      probability.trim() === "" ||
      zScore.trim() === "" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 1 ||
      !Number.isFinite(z)
    )
      throw new Error(`公开表第 ${index + 1} 行格式异常。`);
    return { row: index + 1, name, score, z };
  });
}

export function selectScores(rows, options = {}) {
  const query = String(options.query ?? "")
    .trim()
    .slice(0, 120)
    .toLowerCase();
  const selected = rows.filter(
    row =>
      row.name.toLowerCase().includes(query) &&
      (!options.selectedOnly || row.score > RESEARCH_THRESHOLD)
  );
  selected.sort(
    (a, b) =>
      (options.ascending ? a.score - b.score : b.score - a.score) ||
      a.row - b.row
  );
  const pages = Math.max(1, Math.ceil(selected.length / PAGE_SIZE));
  const requested = Number.isInteger(options.page) ? options.page : 0;
  const page = Math.min(pages - 1, Math.max(0, requested));
  return {
    total: selected.length,
    pages,
    page,
    items: selected.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
  };
}
