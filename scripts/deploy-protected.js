#!/usr/bin/env node

/**
 * 保护构建部署脚本
 * 自动化执行完整的保护构建流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

/**
 * 执行命令并输出结果
 */
function executeCommand(command, description) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${description}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Command: ${command}\n`);

    try {
        execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log(`✅ ${description} completed\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return false;
    }
}

/**
 * 清理旧的构建产物
 */
function cleanBuild() {
    console.log('\n🧹 Cleaning old build...');
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
        console.log('✅ Old build cleaned');
    } else {
        console.log('ℹ️  No old build found');
    }
}

/**
 * 检查必要的文件
 */
function checkPrerequisites() {
    console.log('\n🔍 Checking prerequisites...');

    const requiredFiles = [
        'obfuscator-config.js',
        'src/domain-guard.ts',
        'src/anti-debug.ts',
        'src/integrity-check.ts',
    ];

    let allExist = true;

    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`  ✓ ${file}`);
        } else {
            console.log(`  ✗ ${file} (missing)`);
            allExist = false;
        }
    }

    if (!allExist) {
        console.error('\n❌ Some required files are missing. Please ensure all protection modules are in place.');
        process.exit(1);
    }

    console.log('✅ All prerequisites met');
}

/**
 * 生成部署报告
 */
function generateReport() {
    console.log('\n📊 Generating deployment report...');

    const report = {
        timestamp: new Date().toISOString(),
        protectionLayers: [
            'JavaScript Obfuscation',
            'Code Minification',
            'Source Map Disabled',
            'Integrity Verification',
            'Domain Restriction',
            'Anti-Debugging',
        ],
        buildInfo: {
            distSize: getDirectorySize(DIST_DIR),
            fileCount: countFiles(DIST_DIR),
        }
    };

    const reportPath = path.join(DIST_DIR, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✅ Report generated:', reportPath);
    console.log('\nBuild Statistics:');
    console.log(`  Total Size: ${(report.buildInfo.distSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  File Count: ${report.buildInfo.fileCount}`);
}

/**
 * 获取目录大小
 */
function getDirectorySize(dir) {
    let size = 0;

    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            size += getDirectorySize(filePath);
        } else {
            size += stat.size;
        }
    }

    return size;
}

/**
 * 计算文件数量
 */
function countFiles(dir) {
    let count = 0;

    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            count += countFiles(filePath);
        } else {
            count++;
        }
    }

    return count;
}

/**
 * 主流程
 */
function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔒 Protected Build & Deployment Script 🔒            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

    // 步骤1: 检查前置条件
    checkPrerequisites();

    // 步骤2: 清理旧构建
    cleanBuild();

    // 步骤3: 执行保护构建
    const buildTarget = process.env.DEPLOY_TARGET || 'render';
    const buildCommand = buildTarget === 'github'
        ? 'npm run build:github:protected'
        : 'npm run build:render:protected';

    if (!executeCommand(buildCommand, 'Protected Build')) {
        process.exit(1);
    }

    // 步骤4: 生成完整性哈希
    if (!executeCommand('node scripts/generate-integrity.js', 'Integrity Hash Generation')) {
        console.warn('⚠️  Integrity generation failed, but continuing...');
    }

    // 步骤5: 验证混淆效果
    if (!executeCommand('node scripts/verify-obfuscation.js', 'Obfuscation Verification')) {
        console.warn('⚠️  Obfuscation verification failed, but continuing...');
    }

    // 步骤6: 生成部署报告
    generateReport();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ✅ Protected Build Completed Successfully! ✅         ║
║                                                           ║
║  Next Steps:                                              ║
║  1. Review the deployment report in dist/                 ║
║  2. Deploy the dist/ folder to your hosting platform      ║
║  3. Test the deployed application                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// 运行主流程
main();
