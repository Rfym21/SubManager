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

// ---------------------------------以下为全局错误处理---------------------------------
/**
 * 全局错误处理中间件
 */
app.use((err, req, res, next) => {
    console.error('全局错误:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        status: false,
        message: 'Server Error, please try again later.'
    });
});

/**
 * 处理未捕获的Promise rejection
 */
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise rejection:', reason);
});

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

// ---------------------------------以下为服务启动---------------------------------
app.listen(process.env.PORT || 8103, async () => {
    console.log(`服务在 http://localhost:${process.env.PORT || 8103} 上启动成功!`);
});
