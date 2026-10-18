# 冰箱食光 · 食材识别与食谱生成

移动端优先的 Web App：上传冰箱照片 → 识别食材 → 勾选/增删改 → 生成食谱。
默认走**真实后端接口**（`DATA_SOURCE = 'http'`）；没连后端时把数据源切回 Mock 也能跑通全流程。

## 技术栈

- Vite 7 + React 19 + React Router 7
- Tailwind CSS v4（`@tailwindcss/vite` 插件，无 `tailwind.config.js`，主题变量写在 `src/index.css` 的 `@theme` 中）
- 纯手写内联 SVG 图标，零 UI 库依赖
- 移动端优先：`max-width: 520px` 手机栏布局，桌面端自动变成居中的圆角面板

## 快速开始

> 需要 Node.js >= 20.19（Vite 7 要求）。

```bash
npm install
npm run dev      # http://localhost:5173
```

其他命令：

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
npm run dev:host # 局域网访问（手机真机调试）
```

仓库里不包含 `node_modules`，首次运行需要联网安装依赖（若公司网络受限可配置国内镜像）。

## 目录结构

```
.
├── index.html                 # 入口 HTML（含 viewport-fit=cover，适配刘海屏）
├── vite.config.js             # Vite + React + Tailwind 插件、/api 代理预留
└── src
    ├── main.jsx               # 应用入口：Router / Toast / 全局状态 Provider
    ├── App.jsx                # 路由表
    ├── index.css              # Tailwind 引入 + @theme 设计变量 + 动画
    ├── services
    │   ├── api.js             # ⭐ API 请求层 + 前后端数据契约（Mock / 真实后端切换点）
    │   └── adapters.js        # 接口字段 → 页面视图模型的适配
    ├── data
    │   ├── ingredients.js     # 假数据：识别出的食材 + 常见食材字典
    │   ├── recipes.js         # 假数据：食谱库 + 匹配排序算法
    │   └── samplePhoto.js     # 内置示例照片（SVG Data URL，无需图片资源）
    ├── store/AppContext.jsx   # 全局状态：图片 / 识别 / 食材 / 食谱 / 进度
    ├── utils/image.js         # 图片读取与压缩（Canvas 缩放到 1280px）
    ├── components             # AppShell、Header、底部弹层、食谱卡、Toast 等
    └── pages
        ├── HomePage.jsx          # ① 首页：拍照 / 相册 / 开始识别
        ├── IngredientsPage.jsx   # ② 食材清单：勾选 / 增删改 / 生成食谱
        └── RecipesPage.jsx       # ③ 食谱展示：菜名 / 卡路里 / 步骤 / 时长
```

## 页面流程

1. **首页**：拍照（`capture="environment"` 调起系统相机）或从相册选图 → 图片预览 → 开始识别。
   桌面上支持拖拽图片，也可以点「用示例照片试试」跳过拍照。
2. **加载动画**：全屏扫描动画（图片上叠加雷达扫描线 + 进度条 + 多段状态文案），识别完成后自动跳转。
3. **食材清单**：按分类分组展示，支持勾选、编辑名称/数量、删除（带撤销）、添加遗漏食材（底部弹层 + 常用食材快捷添加）。
4. **生成中**：再次出现加载动画（`AI 正在搭配食谱`）。
5. **食谱展示**：**只展示用到了勾选食材的食谱**（按命中比例排序，每次先给 3 道，「换一批」在匹配池里继续轮换）；
   卡片包含菜名、卡路里、预计时长、难度、食材匹配度、分步骤做法，支持展开全部步骤。
   如果一个都没匹配上，会给出「没找到匹配食谱」的友好空状态，并引导回食材清单调整。

## API 请求层与数据契约

所有网络请求统一收口在 [src/services/api.js](src/services/api.js)，页面与 store 只调用两个业务函数，
不直接接触 `fetch` 或假数据：

```js
import { recognizeIngredients, generateRecipes } from './services/api.js'

const res = await recognizeIngredients(imageFile)
// res.data → [{ id: '1', name: '番茄', confidence: 0.98 }]

const res2 = await generateRecipes([{ id: '1', name: '番茄' }], { refreshKey: 0 })
// res2.data → [{ id: 'r1', title: '番茄炒蛋', calories: 300, time: '15分钟', steps: ['步骤1', ...] }]
```

后端返回 `{ code, data, meta?, message? }`，前端会归一化成统一的 `{ success, data, meta, message }` 信封
（`{ success: true, data }` 这种老写法同样兼容）；失败时抛出 `ApiError`（含 `status` / `code` / 友好 `message`）。
完整字段说明写在 `api.js` 顶部的 JSDoc 里，可以直接发给后端同学对照实现。

| 接口 | 方法 | 请求 | 成功响应 |
| --- | --- | --- | --- |
| `/api/ingredients/recognize` | POST | `FormData`，字段 `image` | `{ code: 200, data: Ingredient[], meta?: { count } }` |
| `/api/recipes/generate` | POST | `{ ingredients: string[], refreshKey: number }` | `{ code: 200, data: Recipe[], meta?: { total, refreshKey } }` |

失败响应：`{ code: 500, message: '识别失败，请重新上传' }`（HTTP 非 2xx、`success: false`、或 `code` 不为 200 都会抛 `ApiError`）

`Ingredient`（data 元素）：`{ id, name, confidence, emoji?, quantity?, category?, selected? }`

`Recipe`（data 元素）：`{ id, title, calories, time, steps, emoji?, cover?, difficulty?, servings?, intro?, tip?, ingredients?, matched?, pantry?, matchRate?, minutes? }`
——其中 `steps` 支持 `['步骤1', '步骤2']` 或 `[{ text, minutes }]` 两种写法。

请求基址与数据源都用环境变量控制（复制 `.env.example` 为 `.env.local`）：

```bash
VITE_API_BASE_URL=https://你的后端域名.com   # 前后端同域部署可留空，走相对路径 /api/xxx
VITE_DATA_SOURCE=http                         # http = 真实接口（默认）；mock = 内置假数据，方便离线调试
VITE_DEV_PROXY_TARGET=http://localhost:8000   # 可选：本地开发时把 /api 代理到后端，绕开跨域
```

切换方式：把 `VITE_DATA_SOURCE` 改成 `mock` 即可整体切回 Mock（代码里的 Mock 分支完整保留），
改回 `http` 就走真实接口，业务代码一行都不用动。

请求层已内置统一能力：

- 超时中断（`AbortController`，默认 20s，可用 `request(path, { timeout })` 覆盖）；
- 错误归一化：401（登录失效）/ 403 / 404 / 413 / 5xx / 超时 / 断网，都会变成带**友好中文文案**的 `ApiError`，
  页面里直接 `showToast(error.message)` 即可；
- 全局加载状态（`beginLoading` / `subscribeApiLoading` / `useApiLoading`）；
- 真实请求期间用「乐观进度」驱动全屏动画（fetch 拿不到服务端处理进度）。

后端字段和页面字段不一致时，只改 [src/services/adapters.js](src/services/adapters.js) 即可。

> 安全：前端代码与 `.env` 里都**不含任何 API Key / Token**，Vite 的 `VITE_*` 变量会被打进产物等于公开。
> 大模型、云存储等第三方密钥一律放在后端，前端只请求我们自己的业务接口。

## 设计说明

- 主色为「新鲜绿」`brand-500 (#12b76a)`，热量/调料用暖色 amber 点缀，背景是极浅的冷绿灰。
- 大圆角（`rounded-3xl` / `28px~36px`）+ 柔和投影（`shadow-card` / `shadow-float`），间距以 4 的倍数递进。
- 所有动画（扫描线、卡片入场、按钮按压缩放）都在 `src/index.css` 里用原生 CSS 定义，无第三方动画库。
- 适配安全区：`.safe-top` / `.safe-bottom` 使用 `env(safe-area-inset-*)`。

## 后续可做

- 为真实接口补上请求重试与断点续传（大图上传）
- 食材清单支持左滑删除、拖拽排序
- 食谱详情页（独立路由）与收藏、购物清单
- 用 Zustand / TanStack Query 替换 AppContext + 手写缓存
- 加入 ESLint + Prettier 与 Vitest 单元测试
