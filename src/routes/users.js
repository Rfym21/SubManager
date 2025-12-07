const express = require('express');
const users = express.Router();
const config = require('../config/index.js');
const { createToken } = require('../utils/jwt.js');

/**
 * 用户登录接口
 */
users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === config.admin_username && password === config.admin_password) {
    const token = createToken({ username }, '30d');
    res.json({
      status: true,
      data: {
        username,
        access_token: token
      }
    });
  } else {
    res.status(403).json({
      status: false,
      message: 'Login failed, username or password is incorrect!'
    });
  }
});

module.exports = users;
