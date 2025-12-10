/**
 * JavaScript Obfuscator 配置文件
 * 用于生产环境代码混淆保护
 */

module.exports = {
  // ========== 基础配置 ==========
  compact: true,
  simplify: true,

  // ========== 标识符混淆 ==========
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  renameProperties: false,
  transformObjectKeys: true,         // 启用对象键转换

  // ========== 控制流混淆 (高级模式) ==========
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,

  // ========== 死代码注入 (高级模式) ==========
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,

  // ========== 字符串混淆 (高级模式 - 强力保护中文提示词) ==========
  stringArray: true,
  stringArrayEncoding: ['rc4'],           // RC4 加密保护中文
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,            // 双层包装
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.85,             // 85% 字符串混淆

  // ========== 字符串分割 (禁用 - 可能破坏运行时) ==========
  splitStrings: false,
  splitStringsChunkLength: 10,

  // ========== 数字混淆 (高级模式) ==========
  numbersToExpressions: true,

  // ========== 调试保护 (禁用 - 可能导致页面空白) ==========
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,

  // ========== 自我保护 (禁用 - 可能导致崩溃) ==========
  selfDefending: false,

  // ========== 源码映射 ==========
  sourceMap: false,
  sourceMapMode: 'separate',

  // ========== 其他配置 ==========
  log: false,
  unicodeEscapeSequence: false,

  // ========== 目标环境 ==========
  target: 'browser',

  // ========== 排除项 ==========
  reservedNames: [],
  reservedStrings: [],
};
