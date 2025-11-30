import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 根据部署目标设置 base 路径
    // VITE_DEPLOY_TARGET=github 用于 GitHub Pages 部署
    // VITE_DEPLOY_TARGET=render 或默认用于 Render 部署
    base: env.VITE_DEPLOY_TARGET === 'github' ? '/CineView-AI-me-revise/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      // 新增:允许来自 'cineview-ai.onrender.com' 的请求
      allowedHosts: ['cineview-ai.onrender.com'],
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
