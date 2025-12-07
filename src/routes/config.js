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
 * 修改基础配置 (host, subconverter, filename, exclude, sub_config)
 */
router.patch('/config', verifyAdminToken, (req, res) => {
    try {
        const { host, subconverter, filename, exclude, sub_config } = req.body;
        const config = readConfig();

        if (host !== undefined) config.host = host;
        if (subconverter !== undefined) config.subconverter = subconverter;
        if (filename !== undefined) config.filename = filename;
        if (exclude !== undefined) config.exclude = exclude;
        if (sub_config !== undefined) config.sub_config = sub_config;

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
        const { url, weight, filename } = req.body;
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
            filename
        };
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
        const { url, weight, filename } = req.body;
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

        saveConfig(config);
        res.json({ status: true, data: config.sub_links[index] });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/**
 * 删除订阅链接 (通过 filename)
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

module.exports = router;
