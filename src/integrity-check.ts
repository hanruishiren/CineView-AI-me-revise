/**
 * 代码完整性验证
 * 检测运行时代码是否被篡改
 */

import CryptoJS from 'crypto-js';

// 这个文件将在构建时由脚本自动生成
// 包含所有关键文件的哈希值
interface IntegrityManifest {
    [filename: string]: string;
}

// 占位符,构建时替换
const INTEGRITY_MANIFEST: IntegrityManifest = {
    // 'main.js': 'sha256-...',
    // 'vendor.js': 'sha256-...',
};

/**
 * 计算脚本内容的哈希值
 */
async function calculateScriptHash(scriptUrl: string): Promise<string> {
    try {
        const response = await fetch(scriptUrl);
        const content = await response.text();
        const hash = CryptoJS.SHA256(content).toString();
        return `sha256-${hash}`;
    } catch (error) {
        console.error('Failed to fetch script:', scriptUrl, error);
        return '';
    }
}

/**
 * 验证单个脚本的完整性
 */
async function verifyScript(scriptElement: HTMLScriptElement): Promise<boolean> {
    const src = scriptElement.src;
    if (!src) return true; // 跳过内联脚本

    // 提取文件名
    const filename = src.split('/').pop() || '';
    const expectedHash = INTEGRITY_MANIFEST[filename];

    if (!expectedHash) {
        // 没有记录的哈希值,跳过验证
        return true;
    }

    const actualHash = await calculateScriptHash(src);
    return actualHash === expectedHash;
}

/**
 * 验证所有脚本的完整性
 */
async function verifyAllScripts(): Promise<boolean> {
    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];

    for (const script of scripts) {
        const isValid = await verifyScript(script);
        if (!isValid) {
            console.error('Script integrity check failed:', script.src);
            return false;
        }
    }

    return true;
}

/**
 * 处理完整性检查失败
 */
function handleIntegrityFailure(): void {
    // 清空页面
    document.body.innerHTML = '';

    // 显示错误信息
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    background: #ff5722;
    color: white;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    text-align: center;
    max-width: 400px;
  `;
    errorDiv.innerHTML = `
    <h2>⚠️ Security Alert</h2>
    <p>Code integrity check failed. The application may have been tampered with.</p>
    <p>Please reload the page or contact support.</p>
  `;
    document.body.appendChild(errorDiv);

    // 阻止应用继续运行
    throw new Error('Integrity check failed');
}

/**
 * 初始化完整性检查
 */
export async function initIntegrityCheck(): Promise<void> {
    // 跳过开发环境
    if (import.meta.env.DEV) {
        return;
    }

    // 如果没有清单,跳过检查
    if (Object.keys(INTEGRITY_MANIFEST).length === 0) {
        console.warn('Integrity manifest is empty, skipping check');
        return;
    }

    try {
        const isValid = await verifyAllScripts();

        if (!isValid) {
            handleIntegrityFailure();
        }
    } catch (error) {
        console.error('Integrity check error:', error);
        // 根据策略决定是否在检查失败时阻止应用
        // handleIntegrityFailure();
    }
}

/**
 * 导出清单供构建脚本使用
 */
export function getIntegrityManifest(): IntegrityManifest {
    return INTEGRITY_MANIFEST;
}
