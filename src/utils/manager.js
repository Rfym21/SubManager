const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config/index.js');
const { isValidBase64, base64Decode, base64Encode } = require('./base64.js');

module.exports = {
    getSubLinks: async () => {
        const subLinks = config.sub_links;
        const onlineSubLinks = subLinks.filter(link => link.url !== 'localhost');
        const localSubLinks = subLinks.filter(link => link.url === 'localhost');

        const subData = [];

        for (const link of onlineSubLinks) {
            try {
                const result = await axios.get(link.url,null,{
                    headers: {
                        'User-Agent': 'NekoBox/Android/1.3.7 (Prefer ClashMeta Format)'
                    }
                });
                const data = isValidBase64(result.data) ? base64Decode(result.data) : result.data;
                fs.writeFileSync(path.resolve(__dirname, `../../files/${link.filename}`), data);
                subData.push({
                    weight: link.weight,
                    data: data
                })
                console.log(`获取 ${link.url} 成功`);
            } catch (e) {
                console.error(`获取 ${link.url} 失败: ${e.message}`);
            }
        }
        for (const link of localSubLinks) {
            try {
                const data = fs.readFileSync(path.resolve(__dirname, `../../files/${link.filename}`), 'utf-8');
                subData.push({
                    weight: link.weight,
                    data: data
                })
                console.log(`获取 ${link.filename} 成功`);
            } catch (e) {
                console.error(`获取 ${link.filename} 失败: ${e.message}`);
            }
        }
        // 按权重从大到小排序
        return base64Encode(subData.sort((a, b) => b.weight - a.weight).map(item => item.data).join("\n"));
    }
}