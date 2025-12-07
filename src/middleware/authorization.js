const config = require('../config/index.js')
const { parseTokenData } = require('../utils/jwt.js');

module.exports = {
    verifySubApiToken: (req, res, next) => {
        const token = req.query.token
        if (!token || token !== config.sub_api_token) {
            return res.status(401).json({
                status: false,
                message: 'Token is invalid'
            });
        }
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
}