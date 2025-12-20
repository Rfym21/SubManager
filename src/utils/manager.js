const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { readConfig, saveConfig } = require('../config/index.js');
const { isValidBase64, base64Decode, base64Encode } = require('./base64.js');

const filesDir = path.resolve(__dirname, '../../files');

/**
 * 检查缓存是否有效
 * @param {Object} link - 订阅链接对象
 * @param {number} globalCacheTime - 全局缓存时间（分钟）
 * @returns {boolean} 缓存是否有效
 */
const isCacheValid = (link, globalCacheTime) => {
    // 优先使用订阅自己的 cacheTime，否则使用全局的
    const cacheTime = link.cacheTime != null ? link.cacheTime : globalCacheTime;
    if (!link.lastUpdateTime || !cacheTime) {
        return false;
    }
    const currentTime = Date.now();
    const cacheExpireTime = link.lastUpdateTime + cacheTime * 60 * 1000;
    return currentTime < cacheExpireTime;
};

/**
 * 从本地文件读取缓存
 * @param {string} filename - 文件名
 * @returns {string|null} 文件内容或 null
 */
const readCacheFile = (filename) => {
    const filePath = path.join(filesDir, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
};

/**
 * 更新订阅链接的 lastUpdateTime
 * @param {string} filename - 订阅链接的 filename
 */
const updateLastUpdateTime = (filename) => {
    const config = readConfig();
    const index = config.sub_links.findIndex(link => link.filename === filename);
    if (index !== -1) {
        config.sub_links[index].lastUpdateTime = Date.now();
        saveConfig(config);
    }
};

module.exports = {
    /**
     * 获取订阅链接内容
     * @param {Object} tokenInfo - token 信息对象，包含 subscriptions 数组
     * @returns {string} base64 编码的订阅内容
     */
    getSubLinks: async (tokenInfo = null) => {
        const config = readConfig();
        let subLinks = config.sub_links.filter(link => link.status !== false);

        // 如果有 tokenInfo 且指定了 subscriptions，则只获取指定的订阅
        if (tokenInfo && tokenInfo.subscriptions && tokenInfo.subscriptions.length > 0) {
            subLinks = subLinks.filter(link => tokenInfo.subscriptions.includes(link.filename));
        }

        const globalCacheTime = config.cacheTime || 0;
        const onlineSubLinks = subLinks.filter(link => link.url !== 'localhost');
        const localSubLinks = subLinks.filter(link => link.url === 'localhost');

        const subData = [];

        for (const link of onlineSubLinks) {
            try {
                // 检查缓存是否有效
                if (isCacheValid(link, globalCacheTime)) {
                    const cachedData = readCacheFile(link.filename);
                    if (cachedData) {
                        subData.push({
                            weight: link.weight,
                            data: cachedData
                        });
                        console.log(`[缓存] ${link.filename} 命中缓存`);
                        continue;
                    }
                }

                // 缓存无效或不存在，从网络获取
                const result = await axios.get(link.url, {
                    headers: {
                        'User-Agent': 'NekoBox/Android/1.3.7 (Prefer V2ray Format)'
                    }
                });

                // 保存到文件
                if (!fs.existsSync(filesDir) || !fs.existsSync(path.join(filesDir, "..", "converter","temp"))) {
                    fs.mkdirSync(filesDir, { recursive: true });
                    fs.mkdirSync(path.join(filesDir, "..", "converter"), { recursive: true });
                    fs.mkdirSync(path.join(filesDir, "..", "converter", "temp"), { recursive: true });
                }
                let data
                if (isValidBase64(result.data)) {
                    data = base64Decode(result.data);
                } else {
                    // 保存到临时文件
                    if (!fs.existsSync(filesDir)) {
                        fs.mkdirSync(filesDir, { recursive: true });
                    }
                    fs.writeFileSync(path.join(filesDir, "..", "converter", "temp", "link_temp.txt"), result.data);
                    const temp_data = await axios.get(`http://localhost:25500/sub?${new URLSearchParams({
                        target: 'mixed',
                        url: "temp/link_temp.txt",
                    })}`);
                    data = base64Decode(temp_data.data);
                }
                fs.writeFileSync(path.join(filesDir, link.filename), data);

                // 更新 lastUpdateTime
                updateLastUpdateTime(link.filename);

                subData.push({
                    weight: link.weight,
                    data: data
                });
                console.log(`[网络] 获取 ${link.url} 成功`);
            } catch (e) {
                // 网络获取失败时尝试使用本地缓存
                const cachedData = readCacheFile(link.filename);
                if (cachedData) {
                    subData.push({
                        weight: link.weight,
                        data: cachedData
                    });
                    console.log(`[回退] ${link.filename} 网络失败，使用本地缓存`);
                } else {
                    console.error(`获取 ${link.url} 失败: ${e.message}`);
                }
            }
        }

        for (const link of localSubLinks) {
            try {
                const data = fs.readFileSync(path.join(filesDir, link.filename), 'utf-8');
                subData.push({
                    weight: link.weight,
                    data: data
                });
                console.log(`[本地] 获取 ${link.filename} 成功`);
            } catch (e) {
                console.error(`获取 ${link.filename} 失败: ${e.message}`);
            }
        }

        // 按权重从大到小排序
        return base64Encode(subData.sort((a, b) => b.weight - a.weight).map(item => item.data).join("\n"));
    }
};