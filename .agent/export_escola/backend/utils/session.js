const { masterPool } = require('./db');

const SESSION_TIMEOUT_MINUTES = 15;

async function touchSession(token) {
    if (!token) return;
    try {
        await masterPool.query(`UPDATE sessoes_ativas SET ultima_atividade = NOW() WHERE token_sessao = $1`, [token]);
    } catch (error) {
        console.error('⚠️ [SESSION] Erro heartbeat:', error.message);
    }
}

async function isValidSession(token) {
    if (!token) return false;
    try {
        const result = await masterPool.query(`
            SELECT id FROM sessoes_ativas 
            WHERE token_sessao = $1 AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `, [token]);
        return result.rows.length > 0;
    } catch (error) {
        return false;
    }
}

async function endSession(token) {
    if (!token) return;
    await masterPool.query(`UPDATE sessoes_ativas SET ativo = false WHERE token_sessao = $1`, [token]);
}

module.exports = { touchSession, isValidSession, endSession, SESSION_TIMEOUT_MINUTES };
