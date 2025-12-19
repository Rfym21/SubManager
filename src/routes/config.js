const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { readConfig, saveConfig } = require('../config/index.js');
const { verifyAdminToken } = require('../middleware/authorization.js');

const filesDir = path.resolve(__dirname, '../../files');

/**
 * 获取所有配置
 */
router.get('/config', verifyAdminToken, (req, res) => {
    try {
        const config = readConfig();
        res.json({ status: true, data: config });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 修改基础配置 (host, subconverter, filename, exclude, sub_config, cacheTime)
 */
router.patch('/config', verifyAdminToken, (req, res) => {
    try {
        const { host, subconverter, filename, exclude, sub_config, cacheTime } = req.body;
        const config = readConfig();

        if (host !== undefined) config.host = host;
        if (subconverter !== undefined) config.subconverter = subconverter;
        if (filename !== undefined) config.filename = filename;
        if (exclude !== undefined) config.exclude = exclude;
        if (sub_config !== undefined) config.sub_config = sub_config;
        if (cacheTime !== undefined) config.cacheTime = cacheTime;

        saveConfig(config);
        res.json({ status: true, data: config });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 获取所有订阅链接
 */
router.get('/config/sub_links', verifyAdminToken, (req, res) => {
    try {
        const config = readConfig();
        res.json({ status: true, data: config.sub_links });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 添加订阅链接
 */
router.post('/config/sub_links', verifyAdminToken, (req, res) => {
    try {
        const { url, weight, filename, status, remark, cacheTime } = req.body;
        if (!url || !filename) {
            return res.status(400).json({ status: false, message: 'url and filename are required' });
        }

        const config = readConfig();

        // 检查 filename 是否已存在
        if (config.sub_links.some(link => link.filename === filename)) {
            return res.status(400).json({ status: false, message: 'filename already exists' });
        }

        const newLink = {
            url,
            weight: weight || 0,
            filename,
            status: status !== undefined ? status : true,
            remark: remark || ''
        };
        if (cacheTime !== undefined) newLink.cacheTime = cacheTime;
        config.sub_links.push(newLink);

        saveConfig(config);
        res.json({ status: true, data: newLink });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 修改订阅链接 (通过 filename)
 */
router.patch('/config/sub_links/:filename', verifyAdminToken, (req, res) => {
    try {
        const targetFilename = req.params.filename;
        const { url, weight, filename, status, remark, cacheTime } = req.body;
        const config = readConfig();

        const index = config.sub_links.findIndex(link => link.filename === targetFilename);
        if (index === -1) {
            return res.status(404).json({ status: false, message: 'sub_link not found' });
        }

        // 如果要修改 filename，检查新 filename 是否已存在
        if (filename !== undefined && filename !== targetFilename) {
            if (config.sub_links.some(link => link.filename === filename)) {
                return res.status(400).json({ status: false, message: 'filename already exists' });
            }
            config.sub_links[index].filename = filename;
        }

        if (url !== undefined) config.sub_links[index].url = url;
        if (weight !== undefined) config.sub_links[index].weight = weight;
        if (status !== undefined) config.sub_links[index].status = status;
        if (remark !== undefined) config.sub_links[index].remark = remark;
        if (cacheTime !== undefined) config.sub_links[index].cacheTime = cacheTime;

        saveConfig(config);
        res.json({ status: true, data: config.sub_links[index] });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 删除订阅链接 (通过 filename)，同时删除本地文件
 */
router.delete('/config/sub_links/:filename', verifyAdminToken, (req, res) => {
    try {
        const targetFilename = req.params.filename;
        const config = readConfig();

        const index = config.sub_links.findIndex(link => link.filename === targetFilename);
        if (index === -1) {
            return res.status(404).json({ status: false, message: 'sub_link not found' });
        }

        const deleted = config.sub_links.splice(index, 1)[0];
        saveConfig(config);

        // 同时删除本地文件
        const filePath = path.join(filesDir, targetFilename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ status: true, data: deleted });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 获取订阅文件内容
 */
router.get('/config/files/:filename', verifyAdminToken, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(filesDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ status: false, message: 'file not found' });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.json({ status: true, data: { filename, content } });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 修改订阅文件内容
 */
router.put('/config/files/:filename', verifyAdminToken, (req, res) => {
    try {
        const filename = req.params.filename;
        const { content } = req.body;

        if (content === undefined) {
            return res.status(400).json({ status: false, message: 'content is required' });
        }

        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        const filePath = path.join(filesDir, filename);
        fs.writeFileSync(filePath, content, 'utf-8');

        res.json({ status: true, data: { filename, content } });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 删除订阅文件
 */
router.delete('/config/files/:filename', verifyAdminToken, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(filesDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ status: false, message: 'file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ status: true, data: { filename } });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 获取所有 tokens
 */
router.get('/config/tokens', verifyAdminToken, (req, res) => {
    try {
        const config = readConfig();
        res.json({ status: true, data: config.tokens || [] });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 添加 token
 */
router.post('/config/tokens', verifyAdminToken, (req, res) => {
    try {
        const { name, subscriptions } = req.body;
        if (!name) {
            return res.status(400).json({ status: false, message: 'name is required' });
        }

        const config = readConfig();
        if (!config.tokens) config.tokens = [];

        // 检查 name 是否已存在
        if (config.tokens.some(t => t.name === name)) {
            return res.status(400).json({ status: false, message: 'token name already exists' });
        }

        // 生成 UUID v4
        const token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        const newToken = {
            name,
            token,
            status: true,
            subscriptions: subscriptions || []
        };
        config.tokens.push(newToken);

        saveConfig(config);
        res.json({ status: true, data: newToken });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 修改 token (通过 name)
 */
router.patch('/config/tokens/:name', verifyAdminToken, (req, res) => {
    try {
        const targetName = req.params.name;
        const { name, status, subscriptions } = req.body;
        const config = readConfig();

        const index = config.tokens.findIndex(t => t.name === targetName);
        if (index === -1) {
            return res.status(404).json({ status: false, message: 'token not found' });
        }

        // 如果要修改 name，检查新 name 是否已存在
        if (name !== undefined && name !== targetName) {
            if (config.tokens.some(t => t.name === name)) {
                return res.status(400).json({ status: false, message: 'token name already exists' });
            }
            config.tokens[index].name = name;
        }

        if (status !== undefined) config.tokens[index].status = status;
        if (subscriptions !== undefined) config.tokens[index].subscriptions = subscriptions;

        saveConfig(config);
        res.json({ status: true, data: config.tokens[index] });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 删除 token (通过 name)
 */
router.delete('/config/tokens/:name', verifyAdminToken, (req, res) => {
    try {
        const targetName = req.params.name;
        const config = readConfig();

        const index = config.tokens.findIndex(t => t.name === targetName);
        if (index === -1) {
            return res.status(404).json({ status: false, message: 'token not found' });
        }

        const deleted = config.tokens.splice(index, 1)[0];
        saveConfig(config);
        res.json({ status: true, data: deleted });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

module.exports = router;
