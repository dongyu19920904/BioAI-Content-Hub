export interface NavProject {
  title: string;
  desc: string;
  url: string;
  tag: string;
  icon?: string;
}

export const NAV_LINKS: NavProject[] = [
  {
    title: "文章库",
    desc: "把 AI 延续学商机日报改写成普通人看得懂、有行动价值的文章。",
    url: "/posts",
    tag: "内容",
    icon: "A",
  },
  {
    title: "资料包",
    desc: "清单、模板、对比表、话术和项目复盘，用来验证 9.9 / 19.9 元交付。",
    url: "/resources",
    tag: "交付",
    icon: "P",
  },
  {
    title: "自动化规则",
    desc: "从日报选题到文章、资料包、发布和复盘的自动化设想。",
    url: "/posts/ai-longevity-content-engine-blueprint",
    tag: "系统",
    icon: "S",
  },
  {
    title: "生物年龄时钟开源试跑",
    desc: "复用 pyaging 和公开样本，在 GitHub 免费运行器验证研究软件；不提供个人诊断。",
    url: "/projects/pyaging-public-demo",
    tag: "开源试跑",
    icon: "R",
  },
  {
    title: "AI 延寿研究开源工具导航",
    desc: "按研究输入筛选 6 个有仓库和许可证的工具，区分已试跑与仅收录。",
    url: "/projects/open-source-tools",
    tag: "工具导航",
    icon: "T",
  },
  {
    title: "AI 延续学日报",
    desc: "每天的原始信号和商机来源，适合作为内容生产输入。",
    url: "https://news.aibioo.cn",
    tag: "信号源",
    icon: "D",
  },
  {
    title: "yuyu 个人主页",
    desc: "项目总入口，后续会从这里跳转到本内容库。",
    url: "https://yuyu.aivora.cn",
    tag: "主页",
    icon: "Y",
  },
  {
    title: "Aivora 小店",
    desc: "资料包、AI 账号和低价数字产品的变现承接入口。",
    url: "https://aivora.cn",
    tag: "变现",
    icon: "M",
  },
];

export const PROJECTS: NavProject[] = NAV_LINKS;
