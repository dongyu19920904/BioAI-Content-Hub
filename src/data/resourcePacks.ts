export interface ResourcePack {
  title: string;
  desc: string;
  audience: string;
  deliverables: string[];
  priceHint: string;
  status: "可测试" | "构思中" | "待自动化";
  relatedPost?: string;
}

export const RESOURCE_PACKS: ResourcePack[] = [
  {
    title: "AI 延续学商机筛选清单",
    desc: "把每天日报里的论文、工具、项目和新闻筛成可写文章、可做资料包、可做小工具的机会。",
    audience: "想做 AI + 健康/长寿内容，但不知道每天该写什么的人。",
    deliverables: [
      "商机评分表",
      "目标鱼塘判断表",
      "合规风险清单",
      "今日最小动作模板",
    ],
    priceHint: "9.9 元清单 / 19.9 元扩展模板",
    status: "可测试",
    relatedPost: "/posts/ai-longevity-content-engine-blueprint",
  },
  {
    title: "可穿戴数据复盘模板",
    desc: "把睡眠、压力、心率、步数等可穿戴数据整理成 7 天观察表，而不是做医疗判断。",
    audience:
      "有 Apple Watch / 华为手环 / Garmin / Oura 等设备，但不知道怎么看数据的人。",
    deliverables: [
      "7 天记录表",
      "异常提醒话术",
      "家人沟通版说明",
      "AI 复盘提示词",
    ],
    priceHint: "19.9 元资料包",
    status: "构思中",
    relatedPost: "/posts/wearable-data-review-pack",
  },
  {
    title: "给父母看的脑健康沟通包",
    desc: "围绕记忆力、睡眠、压力、饮食多样性，做一份温和、不吓人的家庭沟通资料。",
    audience: "担心父母记忆变化，但不想一开口就制造焦虑的子女。",
    deliverables: ["沟通话术", "7 天观察清单", "饮食多样性表", "就医边界提醒"],
    priceHint: "19.9 元资料包",
    status: "可测试",
    relatedPost: "/posts/brain-health-family-communication-pack",
  },
  {
    title: "AI 生命科学工具导航资料包",
    desc: "整理论文检索、项目跟踪、文献解读、可视化和报告生成工具，做成定期更新的导航。",
    audience: "健康内容创作者、科研小白、AI 工具玩家、轻咨询服务者。",
    deliverables: ["工具清单", "使用场景", "避坑说明", "试用任务"],
    priceHint: "免费导航 + 会员更新",
    status: "待自动化",
  },
];
