const { readConfig } = require('../config/index.js');
const { parseTokenData } = require('../utils/jwt.js');

module.exports = {
    /**
     * 验证订阅 API Token
     * 从 tokens 数组中匹配，并将匹配的 token 对象附加到 req.tokenInfo
     */
    verifySubApiToken: (req, res, next) => {
        const token = req.query.token;
        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'Token is required'
            });
        }

        const config = readConfig();
        const tokenInfo = config.tokens.find(t => t.token === token);

        if (!tokenInfo) {
            return res.status(401).json({
                status: false,
                message: 'Token is invalid'
            });
        }

        if (tokenInfo.status === false) {
            return res.status(403).json({
                status: false,
                message: 'Token is disabled'
            });
        }

        req.tokenInfo = tokenInfo;
        next();
    },
    verifyAdminToken: (req, res, next) => {
        const token = req.headers.authorization || req.headers.Authorization;
        if (!token || token?.length <= 7) {
            return res.status(401).json({
                status: false,
                message: 'Unauthorized'
            });
        }

        const decoded = parseTokenData(token.includes('Bearer') ? token.split(' ')[1] : token);
        if (!decoded) {
          return res.status(401).json({
            code: 401,
            message: 'Token is invalid or expired'
          });
        }
        next();
    }
};