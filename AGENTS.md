# AGENTS.md

## 项目概览

- 这是一个单仓库的 Cloudflare Workers 全栈项目，不是 monorepo。
- 运行时入口在 `workers/app.ts`，前端应用在 `app/`。
- 技术栈以当前代码为准：Hono + React Router 7 + Vite + Tailwind CSS v4 + HeroUI + TypeScript。
- 当前 `react-router.config.ts` 配置了 `ssr: true`，因此以代码为准，不要把它当成纯 SPA。
- `README.md` 基本仍是 Cloudflare 模板说明；若与代码冲突，优先相信源码和配置文件。

## 目录结构

- `workers/app.ts`: Cloudflare Worker 入口。当前只注册了 `app.get("*")`，再交给 React Router 的 request handler。
- `app/root.tsx`: 根布局、全局 `Links/Meta/Scripts`、错误边界。
- `app/heroui-provider.tsx`: HeroUI 路由适配层，把 HeroUI 的 `RouterProvider` 接到 React Router。
- `app/routes.ts`: React Router 路由清单。当前只有一个 `index("routes/home.tsx")`。
- `app/routes/home.tsx`: 首页路由，`loader` 从 Cloudflare `env` 读取 `VALUE_FROM_CLOUDFLARE`。
- `app/app.css`: Tailwind v4 入口和全局样式。
- `public/`: 静态资源目录。
- `.react-router/types/`: React Router 生成的类型文件，视为生成产物。
- `worker-configuration.d.ts`: `wrangler types` 生成文件，视为生成产物。

## 开发命令

- 使用 `pnpm` 作为包管理器。仓库中已有 `pnpm-lock.yaml`，并且 `package-lock.json` 已被移除。
- 目标 Node 版本看 `.nvmrc`，当前为 `22`。本地若版本不一致，先切到 Node 22 再排查问题。
- 常用命令：
  - `pnpm dev`: 本地开发。
  - `pnpm build`: 生产构建。
  - `pnpm preview`: 预览构建结果。
  - `pnpm cf-typegen`: 重新生成 Cloudflare 运行时类型。
  - `pnpm typecheck`: 先执行类型生成，再执行 React Router typegen 和 `tsc -b`。
  - `pnpm deploy`: 构建后通过 Wrangler 部署。

## 代码约定

- 保持 ESM + TypeScript 风格，不要引入 CommonJS 写法。
- 保持现有文件风格：大多数源码使用 tab 缩进、双引号、尾随逗号。
- 优先沿用 React Router 的 route module 模式：在路由文件中导出 `loader`、`meta`、默认组件等。
- `tsconfig.cloudflare.json` 中定义了路径别名 `~/* -> ./app/*`；新增应用层模块时可优先使用该别名。
- 样式通过 Tailwind CSS v4 管理；全局入口在 `app/app.css`，其中已引入 `@heroui/styles/css`。
- `workers/app.ts` 属于边缘运行时代码，新增逻辑时要避免 Node-only API。

## 生成文件与边界

- 不要手改 `.react-router/` 下的生成文件。
- 不要手改 `worker-configuration.d.ts`；变更 `wrangler.jsonc` 后运行 `pnpm cf-typegen`。
- `wrangler.jsonc` 是 Cloudflare 部署配置的事实来源，环境变量、入口、compatibility date 都以这里为准。
- 若需要新增 API，优先在 `workers/app.ts` 中显式注册 Hono 路由；注意当前 `app.get("*")` 是兜底路由，顺序会影响匹配结果。

## 当前已知状态

- 当前工作区不是干净状态，已有未提交改动；修改前先执行 `git status`，不要覆盖用户本地改动。
- 当前 `pnpm typecheck` 已通过；若后续再改 Worker 上下文或 Cloudflare 绑定，优先检查 `app/load-context.d.ts` 和 `workers/app.ts` 的类型是否仍然一致。
- `wrangler types` 已提示推荐从 `@cloudflare/workers-types` 迁移到生成的 runtime types；在没有明确任务前，不要顺手做这类升级。

## 修改建议

- 做变更时优先小步、局部修改，不要把模板代码整体重写。
- 若修改路由加载器、Worker 上下文或 Cloudflare 绑定，完成后至少重新运行一次 `pnpm cf-typegen` 和相关类型检查。
- 若源码和文档描述不一致，优先修正源码相关文档，而不是反向迎合模板文案。
