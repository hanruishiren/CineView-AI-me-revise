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

  // ========== 控制流混淆 (平衡模式 - 经测试可用) ==========
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.35,

  // ========== 死代码注入 (平衡模式) ==========
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.15,

  // ========== 字符串混淆 (平衡模式) ==========
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.5,

  // ========== 字符串分割 (禁用 - 过于消耗资源) ==========
  splitStrings: false,
  splitStringsChunkLength: 10,

  // ========== 数字混淆 (禁用 - 可能导致问题) ==========
  numbersToExpressions: false,

  // ========== 调试保护 (平衡模式) ==========
  debugProtection: true,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,

  // ========== 自我保护 (禁用 - 可能导致问题) ==========
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
