const jwt = require('jsonwebtoken');
const config = require('../config/index.js');

/**
 * 创建 JWT Token
 * @param {Object} data - 用户数据
 * @param {string} time - 过期时间
 * @returns {string} JWT token
 */
const createToken = (data, time) => {
  return jwt.sign(data, config.secret, {
    expiresIn: time
  });
};

/**
 * 解析 Token 并返回解码数据
 * @param {string} token - JWT token
 * @returns {Object|false} 解码后的数据或 false
 */
const parseTokenData = (token) => {
  try {
    return jwt.verify(token, config.secret);
  } catch (e) {
    return false;
  }
};

module.exports = {
  createToken,
  parseTokenData
};
