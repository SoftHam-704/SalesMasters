const { Pool } = require('pg');
require('dotenv').config();

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function check() {
    try {
        console.log('--- EMPRESAS DETAILS ---');
        const empresas = await masterPool.query('SELECT id, cnpj, razao_social, db_host, db_nome, db_usuario FROM empresas');
        console.table(empresas.rows);

        const softham = empresas.rows.find(e => e.cnpj === '17504829000124');
        if (softham) {
            console.log('\n--- CHECKING SOFTHAM TENANT USERS ---');
            const tenantConfig = {
                host: softham.db_host,
                database: softham.db_nome,
                user: softham.db_usuario,
                password: process.env.DB_PASSWORD || '@12Pilabo', // Usando fallback comum
                port: 5432
            };

            console.log('Connecting to tenant:', tenantConfig.database, 'at', tenantConfig.host);

            const tenantPool = new Pool(tenantConfig);
            try {
                // Tenta buscar usuários na tabela do tenant
                const users = await tenantPool.query('SELECT codigo, nome, sobrenome, usuario, master FROM user_nomes');
                console.table(users.rows);
            } catch (e) {
                console.error('Error querying tenant users:', e.message);
            } finally {
                await tenantPool.end();
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await masterPool.end();
    }
}

check();
