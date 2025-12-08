#!/usr/bin/env node

/**
 * 生成完整性哈希脚本
 * 在构建完成后运行,为所有JS文件生成SHA-256哈希
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'integrity-manifest.json');

/**
 * 计算文件的SHA-256哈希
 */
function calculateFileHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `sha256-${hash}`;
}

/**
 * 扫描目录中的所有JS文件
 */
function scanJsFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
        console.warn(`Directory not found: ${dir}`);
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
 * 生成完整性清单
 */
function generateIntegrityManifest() {
    console.log('🔐 Generating integrity manifest...');

    const jsFiles = scanJsFiles(ASSETS_DIR);
    const manifest = {};

    for (const filePath of jsFiles) {
        const filename = path.basename(filePath);
        const hash = calculateFileHash(filePath);
        manifest[filename] = hash;
        console.log(`  ✓ ${filename}: ${hash}`);
    }

    // 写入清单文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`\n✅ Integrity manifest generated: ${OUTPUT_FILE}`);
    console.log(`   Total files: ${Object.keys(manifest).length}`);

    return manifest;
}

/**
 * 更新 integrity-check.ts 文件
 */
function updateIntegrityCheckFile(manifest) {
    const integrityCheckPath = path.join(__dirname, '..', 'src', 'integrity-check.ts');

    if (!fs.existsSync(integrityCheckPath)) {
        console.warn('integrity-check.ts not found, skipping update');
        return;
    }

    let content = fs.readFileSync(integrityCheckPath, 'utf-8');

    // 替换 INTEGRITY_MANIFEST 的值
    const manifestStr = JSON.stringify(manifest, null, 2).replace(/^/gm, '  ');
    const regex = /const INTEGRITY_MANIFEST: IntegrityManifest = \{[^}]*\};/s;
    const replacement = `const INTEGRITY_MANIFEST: IntegrityManifest = ${manifestStr};`;

    content = content.replace(regex, replacement);

    fs.writeFileSync(integrityCheckPath, content, 'utf-8');
    console.log('✅ Updated integrity-check.ts with manifest');
}

// 主函数
function main() {
    try {
        const manifest = generateIntegrityManifest();
        // updateIntegrityCheckFile(manifest);  // 可选:直接更新源文件
    } catch (error) {
        console.error('❌ Error generating integrity manifest:', error);
        process.exit(1);
    }
}

main();
