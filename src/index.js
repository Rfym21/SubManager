require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const users = require('./routes/users.js');
const sub = require('./routes/sub.js');
const config = require('./routes/config.js');

// ---------------------------------以下为中间件配置---------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------以下为API路由---------------------------------
app.use(users);
app.use(sub);
app.use(config);

// ---------------------------------以下为静态文件服务---------------------------------
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA 路由回退
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// ---------------------------------以下为服务启动---------------------------------
app.listen(process.env.PORT || 8103, async () => {
    console.log(`服务在端口${process.env.PORT || 8103}上启动成功!`);
});
