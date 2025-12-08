import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 导入保护模块
// import { initDomainGuard, startDomainMonitoring } from './src/domain-guard';
import { initAntiDebug } from './src/anti-debug';
import { initIntegrityCheck } from './src/integrity-check';

// console.log('🚀 Application script loaded!');

// 初始化保护层(仅生产环境)
async function initializeProtection() {
  // console.log('🛡️ initializeProtection called, PROD:', import.meta.env.PROD);

  if (import.meta.env.PROD) {
    try {
      // ===== 生产环境/预览保护配置 =====

      /*
      // 1. 域名验证 (保持禁用以允许本地访问)
      // initDomainGuard();
      // startDomainMonitoring();
      */

      // 2. 反调试 (已启用)
      initAntiDebug({
        disableShortcuts: true,
        interferConsole: true,
        detectInterval: 1000,
        onDetected: () => {
          // 仅提示,不清空页面,方便验证
          console.warn('⚠️ DevTools detected! (Protection is working)');
          // alert('⚠️ Security Alert: Developer Tools detected!');
        }
      });

      // 3. 完整性检查 (已启用)
      await initIntegrityCheck();

      /*
      // console.log('🔒 Protection Status:');
      // console.log('  ✅ Code Obfuscation: enabled (build-time)');
      // console.log('  ✅ Code Minification: enabled (Terser)');
      // console.log('  ✅ Source Maps: disabled');
      // console.log('  ❌ Domain Guard: disabled');
      // console.log('  ✅ Anti-Debug: enabled');
      // console.log('  ✅ Integrity Check: enabled');
      */

    } catch (error) {
      console.error('Protection initialization failed:', error);
    }
  }
}

// 初始化并渲染应用
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

initializeProtection().then(() => {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Failed to initialize app:', error);
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      background: #1a1a1a;
      color: white;
    ">
      <div style="text-align: center;">
        <h1>⚠️ Initialization Error</h1>
        <p>Failed to start the application. Please refresh the page.</p>
      </div>
    </div>
  `;
});