#!/usr/bin/env node

/**
 * 验证混淆效果的脚本
 * 检查构建产物是否正确混淆
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// 敏感关键词列表 - 这些不应该在混淆后的代码中以明文出现
const SENSITIVE_KEYWORDS = [
    'analyzeVideo',
    'geminiService',
    'extractFrames',
    'detectShots',
    'uploadVideo',
    'ApiKeyModal',
    'VideoPlayer',
    'AnalysisCharts',
];

/**
 * 检查文件是否包含明文关键词
 */
function checkFileForKeywords(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const foundKeywords = [];

    for (const keyword of SENSITIVE_KEYWORDS) {
        // 使用正则检查是否有完整的关键词(不是作为字符串的一部分)
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(content)) {
            foundKeywords.push(keyword);
        }
    }

    return foundKeywords;
}

/**
 * 检测混淆特征
 */
function detectObfuscationFeatures(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const features = {
        hexIdentifiers: false,    // 十六进制标识符
        stringArray: false,       // 字符串数组
        controlFlowFlattening: false,  // 控制流平坦化(检测switch-case模式)
        compacted: false,         // 代码已压缩
    };

    // 检测十六进制标识符 (_0x1a2b)
    if (/_0x[0-9a-f]{4,}/i.test(content)) {
        features.hexIdentifiers = true;
    }

    // 检测字符串数组模式
    if (/var\s+_0x[0-9a-f]+\s*=\s*\[/i.test(content)) {
        features.stringArray = true;
    }

    // 检测控制流平坦化(大量switch-case)
    const switchCount = (content.match(/switch\s*\(/g) || []).length;
    if (switchCount > 5) {
        features.controlFlowFlattening = true;
    }

    // 检测代码是否压缩(没有多余空格和换行)
    const hasMinimalWhitespace = content.length > 1000 &&
        content.split('\n').length < 10;
    features.compacted = hasMinimalWhitespace;

    return features;
}

/**
 * 扫描所有JS文件
 */
function scanJsFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
        console.error(`❌ Directory not found: ${dir}`);
        return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...scanJsFiles(fullPath));
        } else if (item.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * 主验证函数
 */
function verifyObfuscation() {
    console.log('🔍 Verifying obfuscation...\n');

    const jsFiles = scanJsFiles(ASSETS_DIR);

    if (jsFiles.length === 0) {
        console.error('❌ No JS files found in dist/assets');
        process.exit(1);
    }

    console.log(`Found ${jsFiles.length} JS files\n`);

    let hasIssues = false;
    const results = [];

    for (const filePath of jsFiles) {
        const filename = path.basename(filePath);
        console.log(`Checking: ${filename}`);

        // 检查敏感关键词
        const foundKeywords = checkFileForKeywords(filePath);
        if (foundKeywords.length > 0) {
            console.log(`  ⚠️  Found sensitive keywords: ${foundKeywords.join(', ')}`);
            hasIssues = true;
        }

        // 检测混淆特征
        const features = detectObfuscationFeatures(filePath);
        console.log(`  Features:`);
        console.log(`    Hex Identifiers: ${features.hexIdentifiers ? '✓' : '✗'}`);
        console.log(`    String Array: ${features.stringArray ? '✓' : '✗'}`);
        console.log(`    Control Flow Flattening: ${features.controlFlowFlattening ? '✓' : '✗'}`);
        console.log(`    Compacted: ${features.compacted ? '✓' : '✗'}`);

        // 评估混淆质量
        const featuresCount = Object.values(features).filter(Boolean).length;
        let quality = 'Unknown';
        if (featuresCount === 4) quality = 'Excellent';
        else if (featuresCount === 3) quality = 'Good';
        else if (featuresCount === 2) quality = 'Fair';
        else if (featuresCount === 1) quality = 'Poor';
        else quality = 'None';

        console.log(`  Quality: ${quality}\n`);

        results.push({
            filename,
            foundKeywords,
            features,
            quality
        });
    }

    // 检查source map
    console.log('\n🗺️  Checking for source maps...');
    const mapFiles = jsFiles.filter(f => f.endsWith('.map'));
    if (mapFiles.length > 0) {
        console.log(`  ⚠️  Found ${mapFiles.length} source map files (should be 0)`);
        hasIssues = true;
    } else {
        console.log(`  ✓ No source map files found`);
    }

    // 总结
    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log('='.repeat(50));

    const excellentCount = results.filter(r => r.quality === 'Excellent').length;
    const goodCount = results.filter(r => r.quality === 'Good').length;
    const fairCount = results.filter(r => r.quality === 'Fair').length;
    const poorCount = results.filter(r => r.quality === 'Poor').length;

    console.log(`Excellent: ${excellentCount}`);
    console.log(`Good: ${goodCount}`);
    console.log(`Fair: ${fairCount}`);
    console.log(`Poor: ${poorCount}`);

    if (hasIssues) {
        console.log('\n⚠️  Some issues found. Review the output above.');
        process.exit(1);
    } else {
        console.log('\n✅ All checks passed!');
    }
}

// 运行验证
try {
    verifyObfuscation();
} catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
}
