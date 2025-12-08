# 部署配置说明文档

## 概述

本项目支持同时部署到 **GitHub Pages** 和 **Render** 两个平台。通过环境变量 `VITE_DEPLOY_TARGET` 来控制不同的部署路径。

## 部署方式

### 1. Render 部署（推荐）

**使用场景**：直接从根路径访问（例如：`https://your-app.onrender.com/`）

**自动化配置（推荐）**：
本项目包含 `render.yaml` 配置文件。当你在 Render 上连接此仓库时，它应该会自动检测配置。
- **Build Command**: `npm install && npm run build:protected`
- **Publish Directory**: `dist`

**手动配置**：
如果 Render 没有自动检测，或者你手动创建了服务，请参考以下设置：

> [!NOTE]
> 请确保你创建的是 **Static Site** (静态站点)，而不是 Web Service。
> 如果你看到 "Start Command" 选项，说明你可能错误地创建了 Web Service。

**Static Site 设置**:
- **Build Command**: `npm install && npm run build:protected`
- **Publish Directory**: `dist`

**Web Service 设置 (不推荐，除非必须)**:
如果你必须使用 Web Service，则需要一个命令来启动服务：
- **Build Command**: `npm install && npm run build:protected`
- **Start Command**: `npx serve -s dist -l 10000` (需要安装 `serve` 包)

> [!IMPORTANT]
> **不要在 Render 上运行 `npm run deploy`**。
> 该命令是专门为 GitHub Pages 设计的，它会尝试将代码 push 到 GitHub，这在 Render 环境中会因为没有权限而失败（显示 "fetch failed"）。Render 会自动部署 `dist` 目录中的内容。

**域名白名单配置**：
代码保护包含域名白名单机制。如果你的 Render 域名发生变化（例如使用了自定义域名），你需要更新 `src/domain-guard.ts` 文件。
- 当前白名单包含：`cineview-ai.onrender.com`
- 如果使用新域名，请在 `src/domain-guard.ts` 的 `ALLOWED_DOMAINS` 数组中添加你的新域名。

**环境变量**：
- 不需要设置 `VITE_DEPLOY_TARGET`，或者设置为 `VITE_DEPLOY_TARGET=render`

---

### 2. GitHub Pages 部署

**使用场景**：从子路径访问（例如：`https://username.github.io/CineView-AI-me-revise/`）

**构建命令**：
```bash
npm run build:github
```

**环境变量**：
- `VITE_DEPLOY_TARGET=github`

**GitHub Pages 部署步骤**：
1. 运行 `npm run deploy`（会自动执行 `build:github` 然后部署到 gh-pages 分支）
2. 或者手动执行：
   ```bash
   npm run build:github
   npm run deploy
   ```

---

## 环境变量说明

### `.env` 文件配置

创建 `.env` 文件并根据需要配置：

```bash
# Render 部署（默认）
# 留空或设置为：
# VITE_DEPLOY_TARGET=render

# GitHub Pages 部署
# VITE_DEPLOY_TARGET=github

# Google Gemini API Key（可选）
# GEMINI_API_KEY=your_api_key_here
```

---

## 技术实现

在 `vite.config.ts` 中，通过检查 `VITE_DEPLOY_TARGET` 环境变量来决定 `base` 路径：

```typescript
base: env.VITE_DEPLOY_TARGET === 'github' ? '/CineView-AI-me-revise/' : '/'
```

- **GitHub Pages**: `base = '/CineView-AI-me-revise/'`
- **Render**: `base = '/'`（默认）

---

## 常见问题

### Q: 为什么需要不同的 base 路径？

**A**: 
- GitHub Pages 将项目部署在 `https://username.github.io/repository-name/` 子路径下
- Render 直接部署在根域名 `https://your-app.onrender.com/` 下

### Q: 如何在本地测试不同的部署配置？

**A**: 
```bash
# 测试 Render 配置
npm run build:render
npm run preview

# 测试 GitHub Pages 配置
npm run build:github
npm run preview
```

### Q: cross-env 是什么？

**A**: `cross-env` 是一个跨平台设置环境变量的工具，确保在 Windows、macOS 和 Linux 上都能正常工作。
