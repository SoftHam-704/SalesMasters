
const { masterPool } = require('./utils/db');
require('dotenv').config();

async function fix() {
    try {
        // Dados para SoftHam na SaveInCloud (Uso Interno)
        const HOST = '10.100.28.17'; // IP Interno que vimos nos logs
        const PORT = 5432;           // Porta Interna padrão
        const USER = 'webadmin';
        const PASS = 'ytAyO0u043';
        const CNPJ = '17504829000124';

        console.log(`Atualizando conexão da SoftHam para IP Interno: ${HOST}:${PORT} User: ${USER}`);

        const res = await masterPool.query(`
            UPDATE empresas 
            SET db_host = $1, db_porta = $2, db_usuario = $3, db_senha = $4
            WHERE cnpj = $5
            RETURNING razao_social
        `, [HOST, PORT, USER, PASS, CNPJ]);

        if (res.rows.length > 0) {
            console.log(`✅ Conexão atualizada com sucesso para: ${res.rows[0].razao_social}`);
        } else {
            console.error('❌ Empresa SoftHam não encontrada.');
        }

    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await masterPool.end();
        process.exit(0);
    }
}

fix();
