/**
 * 域名白名单保护
 * 防止应用在未授权的域名上运行
 */

const ALLOWED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    'cineview-ai.onrender.com',
    'hanruishiren.github.io',
    // 添加其他授权域名
];

const ALLOWED_PATHS = [
    '/CineView-AI-me-revise',  // GitHub Pages 路径
];

/**
 * 检查当前域名是否在白名单中
 */
export function validateDomain(): boolean {
    // 开发环境跳过检查
    if (import.meta.env.DEV) {
        return true;
    }

    const currentHostname = window.location.hostname;
    const currentPath = window.location.pathname;

    // 检查域名白名单
    const isDomainAllowed = ALLOWED_DOMAINS.some(domain =>
        currentHostname === domain || currentHostname.endsWith(`.${domain}`)
    );

    if (!isDomainAllowed) {
        return false;
    }

    // 如果是 GitHub Pages,额外检查路径
    if (currentHostname.includes('github.io')) {
        const isPathAllowed = ALLOWED_PATHS.some(path =>
            currentPath.startsWith(path)
        );
        if (!isPathAllowed) {
            return false;
        }
    }

    return true;
}

/**
 * 初始化域名保护
 * 应在应用启动时调用
 */
export function initDomainGuard(): void {
    if (!validateDomain()) {
        // 清空页面内容
        document.body.innerHTML = '';

        // 显示错误信息(可选,也可以完全静默)
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      background: #f44336;
      color: white;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      text-align: center;
      max-width: 400px;
    `;
        errorDiv.innerHTML = `
      <h2>Unauthorized Access</h2>
      <p>This application is not authorized to run on this domain.</p>
    `;
        document.body.appendChild(errorDiv);

        // 阻止进一步执行
        throw new Error('Unauthorized domain');
    }
}

// 周期性检查(可选)
export function startDomainMonitoring(intervalMs: number = 5000): void {
    if (import.meta.env.DEV) return;

    setInterval(() => {
        if (!validateDomain()) {
            window.location.reload();
        }
    }, intervalMs);
}
