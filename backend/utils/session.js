const { masterPool } = require('./db');

/**
 * Atualiza a última atividade de uma sessão (Heartbeat)
 * @param {string} token - Token da sessão
 */
async function touchSession(token) {
    if (!token) return;

    try {
        await masterPool.query(`
            UPDATE sessoes_ativas 
            SET ultima_atividade = NOW() 
            WHERE token_sessao = $1
        `, [token]);
    } catch (error) {
        // Silencioso para não travar request principal
        console.error('⚠️ [SESSION] Erro ao atualizar heartbeat:', error.message);
    }
}

/**
 * Verifica se a sessão é válida (não expirou e não foi encerrada)
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
async function isValidSession(token) {
    if (!token) return false;

    // Timeout de 15 minutos (hardcoded conforme regra de negócio)
    const SESSION_TIMEOUT_MINUTES = 15;

    try {
        const result = await masterPool.query(`
            SELECT id 
            FROM sessoes_ativas 
            WHERE token_sessao = $1 
              AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `, [token]);

        return result.rows.length > 0;
    } catch (error) {
        console.error('⚠️ [SESSION] Erro ao validar sessão:', error.message);
        return false;
    }
}

module.exports = {
    touchSession,
    isValidSession
};
