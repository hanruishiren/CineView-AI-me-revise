# 部署配置说明文档

## 概述

本项目支持同时部署到 **GitHub Pages** 和 **Render** 两个平台。通过环境变量 `VITE_DEPLOY_TARGET` 来控制不同的部署路径。

## 部署方式

### 1. Render 部署（默认）

**使用场景**：直接从根路径访问（例如：`https://your-app.onrender.com/`）

**构建命令**：
```bash
npm run build:render
# 或者直接使用
npm run build
```

**环境变量**：
- 不需要设置 `VITE_DEPLOY_TARGET`，或者设置为 `VITE_DEPLOY_TARGET=render`

**Render 配置**：
- Build Command: `npm install && npm run build:render`
- Publish Directory: `dist`

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
