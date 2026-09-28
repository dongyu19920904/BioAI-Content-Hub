export interface NavProject {
  title: string;
  desc: string;
  url: string;
  tag: string;
  icon?: string;
}

export const NAV_LINKS: NavProject[] = [
  {
    title: "AI 延寿研究开源工具导航",
    desc: "按研究输入筛选工具，明确区分本站已试跑的 2 项与仅收录的项目。",
    url: "/projects/open-source-tools/",
    tag: "选工具",
    icon: "T",
  },
  {
    title: "免费公开仓库初筛",
    desc: "提交公开 GitHub 仓库，自动得到中文元数据报告；不运行陌生代码。",
    url: "/services/repo-preflight/",
    tag: "免费服务",
    icon: "Q",
  },
  {
    title: "公开样本复现教程",
    desc: "跟着 pyaging 的真实成功与失败记录，用公开数据自己复跑。",
    url: "/posts/pyaging-public-data-reproduction-guide/",
    tag: "实用文章",
    icon: "A",
  },
  {
    title: "生物年龄时钟开源试跑",
    desc: "复用 pyaging 和公开样本，在 GitHub 托管运行器验证研究软件；不提供个人诊断。",
    url: "/projects/pyaging-public-demo",
    tag: "开源试跑",
    icon: "R",
  },
  {
    title: "单细胞时钟公开样本试跑",
    desc: "复用 scAgeClock 与上游公开 500 细胞示例，只公布聚合运行结果；不是个人检测。",
    url: "/projects/scageclock-public-demo",
    tag: "开源试跑",
    icon: "C",
  },
  {
    title: "全部网站文章",
    desc: "围绕具体开源项目、公开样本和复现问题的中文资料。",
    url: "/posts/",
    tag: "网站内容",
    icon: "W",
  },
];

export const PROJECTS: NavProject[] = NAV_LINKS;
