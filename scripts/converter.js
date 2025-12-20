const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { spawn, execSync } = require('child_process');

const platform = process.platform;
const arch = process.arch;
const binDir = path.join(__dirname, '../converter');
const exePath = path.join(binDir, 'subconverter.exe');
const binPath = path.join(binDir, 'subconverter');

/**
 * 解压文件（优先使用系统 7z，否则使用 7zip-min）
 * @param {string} archivePath - 压缩包路径
 * @param {string} outputDir - 输出目录
 */
async function extract(archivePath, outputDir) {
    // 检查系统是否有 7z 命令
    let has7z = false;
    try {
        execSync('7z --help', { stdio: 'ignore' });
        has7z = true;
    } catch {
        // 7z 不可用
    }

    /**
     * 执行单次解压
     * @param {string} filePath - 要解压的文件路径
     */
    const doExtract = async (filePath) => {
        if (has7z) {
            execSync(`7z x "${filePath}" -o"${outputDir}" -y`, { stdio: 'ignore' });
        } else {
            const _7z = require('7zip-min');
            await new Promise((resolve, reject) => {
                _7z.unpack(filePath, outputDir, err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    };

    // 第一次解压
    await doExtract(archivePath);

    // 处理 .tar.gz 双层压缩：检查是否产生了 .tar 文件
    if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
        const tarName = path.basename(archivePath).replace(/\.(tar\.gz|tgz)$/, '.tar');
        const tarPath = path.join(outputDir, tarName);
        if (fs.existsSync(tarPath)) {
            await doExtract(tarPath);
            fs.unlinkSync(tarPath);
        }
    }
}

/**
 * 停止 subconverter 进程
 */
function stop() {
    try {
        if (platform === 'win32') {
            execSync('taskkill /F /IM subconverter.exe', { stdio: 'ignore' });
        } else {
            execSync('pkill -f subconverter', { stdio: 'ignore' });
        }
        console.log('[Converter] 已停止');
    } catch {
        // 进程未运行，忽略错误
    }
}

/**
 * 启动 subconverter 程序
 */
function startProcess() {
    const executablePath = platform === 'win32' ? exePath : binPath;

    console.log('[Converter] 执行文件路径:', executablePath);
    console.log('[Converter] 文件存在:', fs.existsSync(executablePath));

    if (fs.existsSync(executablePath)) {
        const stats = fs.statSync(executablePath);
        console.log('[Converter] 文件大小:', stats.size, 'bytes');
        console.log('[Converter] 文件权限:', '0' + (stats.mode & 0o777).toString(8));
    }

    // 非 Windows 平台添加执行权限
    if (platform !== 'win32' && fs.existsSync(executablePath)) {
        try {
            fs.chmodSync(executablePath, 0o755);
            console.log('[Converter] 已设置执行权限');
        } catch (err) {
            console.log('[Converter] 设置执行权限失败:', err.message);
        }
    }

    console.log('[Converter] 正在启动...');
    try {
        const child = spawn(executablePath, [], {
            cwd: binDir,
            detached: true,
            stdio: 'ignore'
        });

        child.on('error', (err) => {
            console.error('[Converter] 进程错误:', err.message);
        });

        child.unref();
        console.log('[Converter] 已启动，PID:', child.pid);
    } catch (err) {
        console.error('[Converter] 启动失败:', err.message);
    }
}

/**
 * 验证二进制文件架构是否与当前系统匹配
 * @param {string} filePath - 可执行文件路径
 * @returns {boolean} 架构是否匹配
 */
function validateArchitecture(filePath) {
    if (platform === 'win32') {
        // Windows 不做额外验证
        return true;
    }

    try {
        const output = execSync(`file "${filePath}"`, { encoding: 'utf-8' });
        console.log('[Converter] 文件类型:', output.trim());

        // 检查架构匹配
        if (arch === 'arm64') {
            // ARM64 应该包含 aarch64 或 ARM aarch64
            return output.includes('aarch64') || output.includes('ARM');
        } else if (arch === 'x64') {
            // x64 应该包含 x86-64 或 x86_64
            return output.includes('x86-64') || output.includes('x86_64');
        }
        return true;
    } catch (err) {
        console.log('[Converter] 架构验证失败:', err.message);
        return true; // 验证失败时默认通过，避免误删
    }
}

/**
 * 启动 converter（先停止旧进程，检查/下载文件，再启动）
 */
async function start() {
    const repo = 'asdlokj1qpi233/subconverter';
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;

    // 先停止可能存在的旧进程
    stop();

    try {
        const executablePath = platform === 'win32' ? exePath : binPath;

        // 已存在 subconverter 可执行文件则验证架构
        if (fs.existsSync(exePath) || fs.existsSync(binPath)) {
            if (validateArchitecture(executablePath)) {
                console.log('[Converter] 已存在且架构匹配，跳过下载');
                startProcess();
                return;
            } else {
                console.log('[Converter] 架构不匹配，重新下载...');
                fs.rmSync(binDir, { recursive: true });
            }
        }

        console.log('[Converter] 正在检索版本信息...');
        const releaseRes = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'SubManager-App' }
        });

        const tag = releaseRes.data.tag_name;
        const assets = releaseRes.data.assets;

        // 精确匹配逻辑（使用下划线前缀避免子串误匹配，如 darwin64 包含 win64）
        let pattern = '';
        if (platform === 'win32') {
            pattern = arch === 'x64' ? '_win64' : '_win32';
        } else if (platform === 'linux') {
            pattern = arch === 'x64' ? '_linux64' : '_aarch64';
        } else if (platform === 'darwin') {
            pattern = arch === 'arm64' ? '_darwinarm' : '_darwin64';
        }

        const asset = assets.find(a => a.name.startsWith('subconverter') && a.name.includes(pattern));

        if (!asset) {
            console.error(`[Converter] 未能找到适合系统 (${platform}-${arch}) 的安装包`);
            return;
        }

        // 目录存在但无可执行文件时清空
        if (fs.existsSync(binDir)) {
            fs.rmSync(binDir, { recursive: true });
        }
        fs.mkdirSync(binDir);

        const targetPath = path.join(binDir, asset.name);
        console.log(`[Converter] 目标版本: ${tag}`);
        console.log(`[Converter] 正在下载: ${asset.name}`);

        const response = await axios({
            url: asset.browser_download_url,
            method: 'GET',
            responseType: 'stream',
            headers: { 'User-Agent': 'SubManager-App' }
        });

        await pipeline(response.data, fs.createWriteStream(targetPath));

        console.log('[Converter] 正在解压...');
        await extract(targetPath, binDir);

        // 删除压缩包
        fs.unlinkSync(targetPath);

        // 处理嵌套目录：将 converter/subconverter/* 移动到 converter/*
        const nestedDir = path.join(binDir, 'subconverter');
        if (fs.existsSync(nestedDir) && fs.statSync(nestedDir).isDirectory()) {
            // 先重命名嵌套目录避免与内部文件同名冲突
            const tempDir = path.join(binDir, '_temp_subconverter');
            fs.renameSync(nestedDir, tempDir);
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
                fs.renameSync(path.join(tempDir, file), path.join(binDir, file));
            }
            fs.rmdirSync(tempDir);
        }

        // 调试：列出解压后的文件
        console.log('[Converter] 解压后的文件:', fs.readdirSync(binDir));

        // 检查可执行文件是否存在
        if (!fs.existsSync(executablePath)) {
            console.error(`[Converter] 可执行文件不存在: ${executablePath}`);
            return;
        }

        console.log('[Converter] 下载并解压成功');
        startProcess();

    } catch (error) {
        console.error('[Converter] 发生错误:', error.message);
    }
}

module.exports = { start, stop };

// 命令行直接调用
if (require.main === module) {
    if (process.argv[2] === 'stop') {
        stop();
    } else {
        start();
    }
}