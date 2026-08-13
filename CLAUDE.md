# CLAUDE.md — TAO Garden 站点工作规则

给 Claude Code 的常驻说明。每次在这个仓库里开工都会自动读到。

## 这是什么

`taogardenlab.com` — 一个长期研究站点（artist-researcher 的作品与研究档案），
Astro 7 静态站，源码托管在 GitHub，由 Cloudflare Pages 自动构建部署。

- 生产分支：`main`（推上去 = 上线）
- 线上地址：https://taogardenlab.com
- 构建命令：`npm run build`，产物目录：`dist`

## 三条不可违反的规则

1. **本站不显示任何计数。** 没有阅读量、点赞、阅读时长、"热门"、相关推荐、
   无限滚动、第三方统计脚本。理由是逻辑自洽，不是审美偏好：本研究的假设是
   "可见的指标会诱发表演心态"，一个挂着访问计数器的站点等于自我反驳。
   任何时候想加统计、加"最多阅读"，那就是在破坏这条规则。详见 README。
2. **加内容 = 加一个 markdown 文件，永远不是改代码。** 见下。
3. **不提交 `dist/`、`node_modules/`、`.env`。** 已在 .gitignore 里，别绕过。

## 加一条研究内容

在对应目录放一个 `.md`：

```
src/content/
  experiments/   作品，七段式模板，video 字段必填
  atlas/         Field Atlas，五步模板
  observations/  30–150 词，不下判断也不打太极
  readings/      200–800 词，必须包含一个立场
  lab-notes/     "我试了 X。失败在 Y。我改成了 Z。"
```

frontmatter 里 `evidence` 字段**必填**，取值只能是：
`observed / built / measured / literature / interpreted / speculative / unknown`。
这个字段的作用不是展示，是逼作者在发布前先想清楚自己在说哪一类话。
schema 定义在 `src/content.config.ts`，写错会在 build 时报错。

`lang` 字段：内容用它被想出来的那门语言写，不翻译。中英各自成立。

## 发布流程（Claude Code 每次收尾都按这个走）

```bash
npm run build          # 1. 本地必须先构建通过，构建失败绝不推送
./publish.sh "改了什么"  # 2. 一条命令：add + commit + push
```

`publish.sh` 推送后 Cloudflare 会在约 1–2 分钟内自动上线。不需要手动上传任何文件。

写 commit message 用一句人话说清"改了什么"，中英皆可，不要写 "update"。

## 常见修改的位置

| 想改什么 | 改哪里 |
|---|---|
| 站点标题 / 作者 / 当前问题 / 首页三件作品 | `src/lib/site.ts` |
| 域名、构建行为 | `astro.config.mjs` |
| 全站样式 | `src/styles/global.css` |
| 导航 / 页脚 | `src/components/Nav.astro`、`Footer.astro` |
| 页面结构 | `src/pages/` |
| 视频、demo、图片等静态资源 | `public/`（原样复制到线上，路径即 URL） |

`public/vendor/` 是自托管的第三方库（为了"零第三方脚本"这条规则），别换成 CDN。

## 语气

对外文字是研究者 + founder 的双重声音，不用宣言体，不用 "healing / spiritual /
energy / 疗愈" 这类词。陈述事实，让读者自己得出结论。
