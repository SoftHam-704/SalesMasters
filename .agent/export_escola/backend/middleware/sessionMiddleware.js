const { touchSession } = require('../utils/session');

const activeSessionMiddleware = (req, res, next) => {
    let token = req.headers['x-session-token'];
    if (!token && req.headers['authorization']?.startsWith('Bearer ')) {
        token = req.headers['authorization'].split(' ')[1];
    }
    if (token) touchSession(token);
    next();
};

module.exports = activeSessionMiddleware;
