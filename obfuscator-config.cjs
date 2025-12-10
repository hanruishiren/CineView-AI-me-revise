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

  // ========== 控制流混淆 (严格模式 - 最大化) ==========
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,

  // ========== 死代码注入 (严格模式) ==========
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,

  // ========== 字符串混淆 (严格模式 - 特别加强以保护中文提示词) ==========
  stringArray: true,
  stringArrayEncoding: ['rc4'],           // RC4 加密，比 base64 更强
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,            // 增加包装层数
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',    // 使用函数包装（更难追踪）
  stringArrayThreshold: 0.9,              // 90% 的字符串都会被混淆

  // ========== 字符串分割 (严格模式 - 启用以进一步隐藏字符串) ==========
  splitStrings: true,
  splitStringsChunkLength: 5,             // 分割成更小的块

  // ========== 数字混淆 (严格模式) ==========
  numbersToExpressions: true,

  // ========== 调试保护 (严格模式 - 主动防护) ==========
  debugProtection: true,
  debugProtectionInterval: 2000,          // 每2秒检测一次调试器
  disableConsoleOutput: true,             // 禁用 console 输出

  // ========== 自我保护 (严格模式) ==========
  selfDefending: true,

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
