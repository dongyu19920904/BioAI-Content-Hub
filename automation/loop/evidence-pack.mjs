const clean = (value, limit = 180) => String(value ?? "")
  .replace(/[\u0000-\u001f\u007f<>]/g, " ")
  .replace(/\s+/g, " ").trim().slice(0, limit);

function sourceLinks(record) {
  const raw = [
    ...(record.source_urls || []),
    ...(record.primary_source_candidates || []).map((candidate) => candidate.doi ? `https://doi.org/${candidate.doi}` : ""),
  ];
  return [...new Set(raw.filter((value) => {
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }))];
}

function releaseGate(record) {
  const reasons = [];
  if (record.source_verified !== true) reasons.push("一手来源与具体研究结论尚未核验");
  if (!Array.isArray(record.verified_claims) || !record.verified_claims.length) reasons.push("缺少逐条可追溯的已核验事实");
  else if (record.verified_claims.some((claim) => !clean(claim.text) || !sourceLinks(record).includes(claim.source_url))) reasons.push("已核验事实缺少对应的来源链接");
  if (record.risk_flags?.includes("health_claim_review") && record.health_claim_review_passed !== true) reasons.push("健康或医疗表述门禁未通过");
  if (!sourceLinks(record).length) reasons.push("缺少可打开的 HTTPS 来源");
  return { status: reasons.length ? "blocked_from_publication" : "ready_for_channel_authorization", reasons };
}

/** Produce cautious channel drafts from the same opportunity record; never invent a claim. */
export function buildEvidencePack(record, sourcePage) {
  if (!/^opp_[a-f0-9]{16}$/.test(record?.opportunity_id || "")) throw new Error("Invalid opportunity_id");
  if (!/^https:\/\//.test(sourcePage || "")) throw new Error("A public HTTPS source page is required");
  const title = clean(record.title, 90);
  if (!title) throw new Error("Opportunity title is required");
  const id = record.opportunity_id;
  const links = sourceLinks(record);
  const gate = releaseGate(record);
  const claims = gate.status === "ready_for_channel_authorization"
    ? record.verified_claims.map((claim) => clean(claim.text, 250)).filter(Boolean)
    : [];
  const lead = gate.status === "blocked_from_publication"
    ? "⚠️ 核验中的选题草稿，禁止公开发布；以下只介绍待核查的问题，不陈述疗效。"
    : "以下事实已按来源逐条核对；不构成个人医疗建议。";
  const references = links.map((url, index) => `${index + 1}. ${url}`).join("\n");
  const facts = claims.length ? claims.map((claim) => `- ${claim}`).join("\n") : "- 目前只有候选来源；需要核对研究对象、方法、结论与局限。";
  const common = `${lead}\n\n机会编号：${id}\n选题：${title}\n原始记录：${sourcePage}\n\n可陈述事实：\n${facts}\n\n来源：\n${references || "暂无可核查来源"}\n`;
  const website = `# ${title}\n\n${common}\n## 接下来核查什么\n\n核对一手材料与公开数据；若是健康相关研究，区分相关性、机制、动物研究与人体临床证据。\n`;
  const wechat = `# ${title}：先看证据，再谈应用\n\n${common}\n读者可从上面的原始记录和来源自行追溯。初步发现不能写成确定的延寿效果。\n`;
  const bilibili = `标题：${title}，证据到了哪一步？\n\n00:00 为什么关注这个问题\n00:20 目前能确定什么：${claims.length ? claims.join("；") : "只有待核查线索，不能声称有效"}\n00:50 哪些地方还不知道\n01:10 如何查看原始来源与项目进展\n\n${common}`;
  const storyboard = {
    format: "16:9", duration_target_seconds: 90, opportunity_id: id,
    render_status: "not_rendered", voice_status: "not_generated",
    scenes: [
      { seconds: 20, text: `为什么关注：${title}` },
      { seconds: 30, text: claims.length ? `已核查：${claims[0]}` : "证据核验中，暂不传播研究结论" },
      { seconds: 25, text: "相关性、机制与临床效果不是一回事" },
      { seconds: 15, text: `查看原始记录：${sourcePage}` },
    ],
  };
  return { opportunity_id: id, gate, files: { website, wechat, bilibili, storyboard } };
}
