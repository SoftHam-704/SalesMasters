const { Pool } = require('pg');
require('dotenv').config();

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254556-salesmaster.sp1.br.saveincloud.net.br',
    port: parseInt(process.env.MASTER_DB_PORT || '13062'),
    database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    connectionTimeoutMillis: 5000
});

async function reproduceError() {
    console.log('Reproducing masterQuery error...');
    const rawCnpj = '17504829000124'; // Test CNPJ
    const masterQuery = `
        SELECT id, cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                COALESCE(limite_sessoes, 999) as limite_sessoes, 
                COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo,
                ramoatv, ios_enabled,
                COALESCE(modulo_bi_ativo, false) as modulo_bi_ativo,
                COALESCE(modulo_whatsapp_ativo, false) as modulo_whatsapp_ativo,
                COALESCE(modulo_crmrep_ativo, false) as modulo_crmrep_ativo,
                COALESCE(plano_ia_nivel, 'BASIC') as plano_ia_nivel
        FROM empresas 
        WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
    `;
    try {
        const res = await masterPool.query(masterQuery, [rawCnpj]);
        console.log('✅ masterQuery works. Found rows:', res.rows.length);

        console.log('\nReproducing sessoes_ativas count error...');
        const empresaId = 1;
        const SESSION_TIMEOUT_MINUTES = 15;
        const countQuery = `
            SELECT COUNT(*) as qtd FROM sessoes_ativas 
            WHERE empresa_id = $1 AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `;
        const res2 = await masterPool.query(countQuery, [empresaId]);
        console.log('✅ countQuery works. Qtd:', res2.rows[0].qtd);

        console.log('\nReproducing session INSERT error...');
        // We'll use a transaction and rollback to test write
        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');
            const insertQuery = `
                INSERT INTO sessoes_ativas (empresa_id, usuario_id, tenant_user_id, token_sessao, ip, user_agent)
                VALUES ($1, NULL, $2, $3, $4, $5)
            `;
            await client.query(insertQuery, [1, 1, 'test-token', '127.0.0.1', 'test-agent']);
            console.log('✅ INSERT works in transaction.');
            await client.query('ROLLBACK');
        } catch (e) {
            console.error('❌ INSERT failed:', e.message);
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ General Error:', err.message);
        if (err.position) console.error('Position:', err.position);
    } finally {
        await masterPool.end();
    }
}

reproduceError();
