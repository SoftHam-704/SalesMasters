const { touchSession } = require('../utils/session');

/**
 * Middleware para manter a sessão viva (Heartbeat)
 * Deve ser colocado antes das rotas da API.
 * Busca o token no header 'x-session-token' ou 'authorization'.
 */
const activeSessionMiddleware = (req, res, next) => {
    // Tenta pegar o token de vários lugares possíveis
    let token = req.headers['x-session-token'];

    // Se estiver no Authorization Bearer
    if (!token && req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
        // Assume que o Bearer PODE ser o token de sessão (se o frontend usar a mesma estratégia)
        // Por segurança, vamos focar no header customizado 'x-session-token' que implementaremos no frontend depois.
        // token = req.headers['authorization'].split(' ')[1];
    }

    if (token) {
        // Fire and forget - não await para não atrasar a resposta
        touchSession(token);
    }

    next();
};

module.exports = activeSessionMiddleware;
