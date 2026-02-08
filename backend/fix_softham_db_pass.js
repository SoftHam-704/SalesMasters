
const { masterPool } = require('./utils/db');
require('dotenv').config();

async function fix() {
    try {
        const correctPass = process.env.DB_PASS || 'ytAyO0u043'; // Fallback para a senha conhecida
        console.log(`Atualizando senha da SoftHam para: ${correctPass}`);

        const res = await masterPool.query(`
            UPDATE empresas 
            SET db_senha = $1 
            WHERE cnpj = '17504829000124'
            RETURNING razao_social
        `, [correctPass]);

        if (res.rows.length > 0) {
            console.log(`✅ Senha atualizada com sucesso para: ${res.rows[0].razao_social}`);
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
