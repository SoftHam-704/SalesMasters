require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixTenantConfig() {
    console.log('🔧 Iniciando correção de configurações das empresas...');

    // Conecta no Master DB
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master', // Garantir que é o master
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        // 1. Verificar configuração atual
        console.log('📊 Configuração ATUAL:');
        const resBefore = await pool.query("SELECT id, razao_social, db_host, db_porta FROM empresas");
        console.table(resBefore.rows);

        // 2. Aplicar correção (Update geral para usar porta 13062 onde for o host da saveincloud)
        // Só aplicamos onde a porta está errada (5432 ou null)
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        console.log(`🛠️ Atualizando empresas no host ${hostTarget}...`);

        const updateQuery = `
            UPDATE empresas 
            SET db_porta = 13062
            WHERE db_host = $1 AND (db_porta = 5432 OR db_porta IS NULL)
        `;

        const updateRes = await pool.query(updateQuery, [hostTarget]);
        console.log(`✅ ${updateRes.rowCount} empresas atualizadas!`);

        // 3. Verificar resultado
        console.log('📊 Configuração NOVA:');
        const resAfter = await pool.query("SELECT id, razao_social, db_host, db_porta FROM empresas");
        console.table(resAfter.rows);

    } catch (err) {
        console.error('❌ Erro ao atualizar:', err);
    } finally {
        await pool.end();
    }
}

fixTenantConfig();
