/**
 * 反调试保护
 * 检测并阻止开发者工具和调试器
 */

let isDevToolsOpen = false;
let debuggerCheckInterval: number | null = null;

/**
 * 检测开发者工具是否打开
 * 基于控制台对象行为差异
 */
function detectDevTools(): boolean {
    // 方法1: 检测console.log的行为
    const element = new Image();
    let devtoolsOpen = false;

    Object.defineProperty(element, 'id', {
        get: function () {
            devtoolsOpen = true;
            return 'devtools-detector';
        }
    });

    console.log('%c', element);
    console.clear();

    return devtoolsOpen;
}

/**
 * 检测页面尺寸变化(DevTools打开时会改变)
 */
function detectWindowResize(): boolean {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    return widthThreshold || heightThreshold;
}

/**
 * 检测debugger语句执行时间
 */
function detectDebuggerTiming(): boolean {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();

    // 如果在调试器中,这行代码执行会很慢
    return (end - start) > 100;
}

/**
 * 反格式化检测
 * 检测代码是否被格式化
 */
function detectFormatting(): void {
    const check = function () { };
    const functionStr = check.toString();

    // 如果函数被格式化,toString会有不同的输出
    if (functionStr.length !== functionStr.replace(/\s/g, '').length + 15) {
        // 检测到格式化
        handleDebugDetected();
    }
}

/**
 * 处理调试检测
 */
/**
 * 处理调试检测
 */
function handleDebugDetected(callback?: () => void): void {
    if (callback) {
        callback();
        return;
    }

    // 默认策略: 清空页面
    document.body.innerHTML = '<div style="padding: 20px; color: white; background: #000; height: 100vh; display: flex; justify-content: center; align-items: center;"><h1>⚠️ Security Alert: DevTools Detected</h1></div>';

    // 策略3: 显示干扰信息
    for (let i = 0; i < 1000; i++) {
        console.log('Stop debugging!');
    }
}

// ... (disableDebugShortcuts and interferConsole remain unchanged) ...

/**
 * 初始化反调试保护
 */
export function initAntiDebug(options: {
    disableShortcuts?: boolean;
    interferConsole?: boolean;
    detectInterval?: number;
    onDetected?: () => void;
} = {}): void {
    // 跳过开发环境
    if (import.meta.env.DEV) {
        return;
    }

    const {
        disableShortcuts = true,
        interferConsole: shouldInterferConsole = true,
        detectInterval = 1000,
        onDetected
    } = options;

    // 禁用调试快捷键
    if (disableShortcuts) {
        disableDebugShortcuts();
    }

    // 控制台干扰
    if (shouldInterferConsole) {
        interferConsole();
    }

    // 周期性检测
    if (detectInterval > 0) {
        debuggerCheckInterval = window.setInterval(() => {
            // 检测DevTools
            if (detectDevTools() || detectWindowResize()) {
                if (!isDevToolsOpen) {
                    isDevToolsOpen = true;
                    handleDebugDetected(onDetected);
                }
            }

            // 检测格式化
            detectFormatting();
        }, detectInterval);
    }

    // 立即执行一次检测
    if (detectDevTools() || detectWindowResize()) {
        handleDebugDetected(onDetected);
    }
}

/**
 * 停止反调试保护
 */
export function stopAntiDebug(): void {
    if (debuggerCheckInterval !== null) {
        clearInterval(debuggerCheckInterval);
        debuggerCheckInterval = null;
    }
}
