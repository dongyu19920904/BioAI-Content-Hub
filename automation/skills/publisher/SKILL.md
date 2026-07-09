# AI 延续学内容发布器

## 适用场景

当文章和资料包草稿已经生成，需要写入 Astro 内容库并提交部署时使用。

## 写入位置

- 文章：`src/data/blog/*.md`
- 资料包：`src/data/resourcePacks.ts`
- 运行记录：`automation/runs/*.md`

## 发布前检查

- frontmatter 是否完整
- 是否有医疗承诺
- 链接是否可访问
- 是否重复最近 7 天主题
- `pnpm build` 是否通过

## 发布方式

第一阶段建议人工审核后提交。跑顺后再自动 commit + push。
