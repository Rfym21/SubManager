const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, 'config.json');

/**
 * 读取配置文件
 * @returns {Object} 配置对象
 */
const readConfig = () => {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({
            subconverter: 'http://localhost:25500',
            sub_config: 'config/ACL4SSR_Online_Mini_NoAuto.ini',
            exclude: '',
            filename: 'mySubs',
            cacheTime: 5,
            tokens: [],
            sub_links: []
        }, null, 4), 'utf-8');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
};

/**
 * 保存配置文件
 * @param {Object} config - 配置对象
 */
const saveConfig = (config) => {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
};

module.exports = {
    // 工具函数
    readConfig,
    saveConfig,

    // 环境变量配置（静态）
    admin_username: process.env.ADMIN_USERNAME || 'admin',
    admin_password: process.env.ADMIN_PASSWORD || 'admin',
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key',

    // 文件配置（动态读取）
    get subconverter() {
        return readConfig().subconverter || 'https://api.v1.mk';
    },
    get sub_config() {
        return readConfig().sub_config || 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_NoAuto.ini';
    },
    get exclude() {
        return readConfig().exclude || '';
    },
    get filename() {
        return readConfig().filename || 'mySubs';
    },
    get cacheTime() {
        return readConfig().cacheTime || 30;
    },
    get tokens() {
        return readConfig().tokens || [];
    },
    get sub_links() {
        return readConfig().sub_links || [];
    }
};
