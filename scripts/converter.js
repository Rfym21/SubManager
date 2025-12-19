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

    if (has7z) {
        // 使用系统 7z
        execSync(`7z x "${archivePath}" -o"${outputDir}" -y`, { stdio: 'ignore' });
    } else {
        // 使用 7zip-min
        const _7z = require('7zip-min');
        await new Promise((resolve, reject) => {
            _7z.unpack(archivePath, outputDir, err => {
                if (err) reject(err);
                else resolve();
            });
        });
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

    // 非 Windows 平台添加执行权限
    if (platform !== 'win32' && fs.existsSync(executablePath)) {
        try {
            fs.chmodSync(executablePath, 0o755);
        } catch {
            // 忽略权限设置失败
        }
    }

    console.log('[Converter] 正在启动...');
    const child = spawn(executablePath, [], {
        cwd: binDir,
        detached: true,
        stdio: 'ignore'
    });
    child.unref();
    console.log('[Converter] 已启动');
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
        // 已存在 subconverter 可执行文件则跳过下载，直接启动
        if (fs.existsSync(exePath) || fs.existsSync(binPath)) {
            console.log('[Converter] 已存在，跳过下载');
            startProcess();
            return;
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
            const files = fs.readdirSync(nestedDir);
            for (const file of files) {
                fs.renameSync(path.join(nestedDir, file), path.join(binDir, file));
            }
            fs.rmdirSync(nestedDir);
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