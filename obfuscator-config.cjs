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

  // ========== 控制流混淆 (已启用) ==========
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,

  // ========== 死代码注入 (已启用) ==========
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,

  // ========== 字符串混淆 ==========
  stringArray: true,
  stringArrayEncoding: ['rc4'],      // 启用RC4加密
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.5,

  // ========== 字符串分割 ==========
  splitStrings: true,                // 启用字符串分割
  splitStringsChunkLength: 10,

  // ========== 数字混淆 ==========
  numbersToExpressions: true,        // 启用数字表达式

  // ========== 调试保护 (已启用) ==========
  debugProtection: true,            // 启用反调试
  debugProtectionInterval: 0,
  disableConsoleOutput: true,       // 禁用console输出以进行调试

  // ========== 自我保护 ==========
  selfDefending: true,               // 启用自我保护

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
