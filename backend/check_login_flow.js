const { masterPool } = require('./utils/db');
const crypto = require('crypto');

async function checkLogin() {
    const rawCnpj = '99999999000199';
    const nome = 'hamilton';
    const sobrenome = 'sistemas';
    const password = 'hamilton123';

    try {
        console.log('--- Iniciando Verificação de Login ---');

        // 1. Empresa
        const empRes = await masterPool.query("SELECT * FROM empresas WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1", [rawCnpj]);
        if (empRes.rows.length === 0) { console.error('❌ Empresa inexistente'); return; }
        const empresa = empRes.rows[0];
        console.log('✅ Empresa:', empresa.nome_fantasia);

        // 2. Usuário
        const userRes = await masterPool.query("SELECT * FROM usuarios WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND empresa_id = $3 AND senha = $4", [nome, sobrenome, empresa.id, password]);
        if (userRes.rows.length === 0) { console.error('❌ Usuário inexistente com essa senha no Master'); return; }
        const user = userRes.rows[0];
        console.log('✅ Usuário encontrado:', user.nome, user.sobrenome);

        // 3. Sessão
        const sessionToken = crypto.randomUUID();
        const insertSessionQuery = `
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, ip, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        const sessRes = await masterPool.query(insertSessionQuery, [empresa.id, user.id, sessionToken, '127.0.0.1', 'Debug Script']);
        console.log('✅ Sessão criada:', sessRes.rows[0].id);

        process.exit(0);
    } catch (e) {
        console.error('❌ ERRO CRÍTICO:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}
checkLogin();
