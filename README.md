# 冰箱小厨师 · 食材识别与食谱生成

移动端优先的 Web App：上传冰箱照片 → 识别食材 → 勾选/增删改 → 生成食谱。
当前后端 API 尚未就绪，**全流程使用 Mock 数据 + 模拟延迟**，交互与页面结构已经完整可用。

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
    ├── api/client.js          # ⭐ 数据访问层（Mock / 真实后端切换点）
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

## Mock 数据与后端对接

数据访问统一收口在 [src/api/client.js](src/api/client.js)，页面组件不直接接触假数据：

```js
export const DATA_SOURCE = 'mock' // 改成 'http' 即可切到真实后端
```

期望的接口契约（已在文件中写好调用代码，只需替换 `DATA_SOURCE`）：

| 接口 | 方法 | 入参 | 返回 |
| --- | --- | --- | --- |
| `/api/ingredients/recognize` | POST | `FormData: image` | `{ ingredients: Ingredient[] }` |
| `/api/recipes/generate` | POST | `{ ingredients: string[] }` | `{ recipes: Recipe[] }` |

`Ingredient`：`{ id, name, emoji, quantity, category, confidence, selected }`
`Recipe`：`{ id, name, emoji, calories, minutes, difficulty, servings, intro, tip, cover, uses, matched, pantry, steps: [{ text, minutes }] }`

接口基址用环境变量覆盖：复制 `.env.example` 为 `.env.local`，按需改成
`VITE_API_BASE_URL=http://localhost:8000/api`（同时可打开 `vite.config.js` 里的 `/api` 代理）。

## 设计说明

- 主色为「新鲜绿」`brand-500 (#12b76a)`，热量/调料用暖色 amber 点缀，背景是极浅的冷绿灰。
- 大圆角（`rounded-3xl` / `28px~36px`）+ 柔和投影（`shadow-card` / `shadow-float`），间距以 4 的倍数递进。
- 所有动画（扫描线、卡片入场、按钮按压缩放）都在 `src/index.css` 里用原生 CSS 定义，无第三方动画库。
- 适配安全区：`.safe-top` / `.safe-bottom` 使用 `env(safe-area-inset-*)`。

## 后续可做

- 接入真实识别/生成接口，替换 mock 延迟
- 食材清单支持左滑删除、拖拽排序
- 食谱详情页（独立路由）与收藏、购物清单
- 用 Zustand / TanStack Query 替换 AppContext + 手写缓存
- 加入 ESLint + Prettier 与 Vitest 单元测试
