import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';
const obfuscatorConfig = require('./obfuscator-config.cjs');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const isProtectedBuild = env.VITE_PROTECTED_BUILD === 'true';

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

    plugins: [
      react(),
      // 仅在保护构建时启用混淆
      ...(isProtectedBuild ? [
        obfuscatorPlugin({
          include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
          exclude: [
            /node_modules/,
            /vite\.config/,
            /obfuscator-config/,
          ],
          apply: 'build',  // 仅在构建时应用
          debugger: isProduction,
          options: obfuscatorConfig,
        })
      ] : [])
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },

    build: {
      // 生产环境优化
      minify: isProduction ? 'terser' : false,

      terserOptions: isProduction ? {
        compress: {
          drop_console: false,     // 暂时保留console以调试
          drop_debugger: true,
          // pure_funcs: ['console.log', 'console.info', 'console.debug'], // 暂时注释
          passes: 1,               // 降低压缩强度
        },
        mangle: {
          toplevel: false,         // 禁用顶级变量混淆以提高稳定性
          safari10: true,
        },
        format: {
          comments: false,
        },
      } : undefined,

      // Source Map 配置
      sourcemap: isProduction ? false : true,  // 生产环境禁用source map

      // 代码分割策略
      rollupOptions: {
        output: {
          // 手动分块
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'charts': ['recharts'],
            'crypto': ['crypto-js'],
          },

          // 文件命名 - 生产环境使用哈希
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        },
      },

      // 构建输出配置
      chunkSizeWarningLimit: 1000,  // 提高警告阈值(KB)
      reportCompressedSize: true,
    },

    // Optimizations
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts', 'crypto-js'],
    },
  };
});
