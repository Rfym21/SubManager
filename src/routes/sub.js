const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../config/index.js');
const { verifySubApiToken, verifyAdminToken } = require('../middleware/authorization.js');
const { getSubLinks } = require('../utils/manager.js');

/**
 * 获取订阅链接信息（需要管理员认证）
 */
router.get('/sub/info', verifyAdminToken, (req, res) => {
    res.json({
        status: true,
        data: {
            base64_url: `${config.host}/base64?token=${config.sub_api_token}`,
            sub_url: `${config.host}/sub?token=${config.sub_api_token}`
        }
    });
});

router.get('/base64', verifySubApiToken, async (req, res) => {
    try {
        const data = await getSubLinks();
        res.send(data);
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

router.get('/sub', verifySubApiToken, async (req, res) => {
    try {
        const params = new URLSearchParams({
            target: 'clash',
            url: `${config.host}/base64?token=${config.sub_api_token}`,
            config: config.sub_config,
            emoji: 'true',
            list: 'false',
            xudp: 'true',
            udp: 'true',
            tfo: 'false',
            exclude: config.exclude,
            scv: 'true',
            fdn: 'false',
            new_name: 'true',
            filename: config.filename
        });
        const result = await axios.get(`${config.subconverter}/sub?${params.toString()}`);
        res.send(result.data);
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

module.exports = router;
