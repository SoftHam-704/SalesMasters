const { Pool } = require('pg');
require('dotenv').config();

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function run() {
    try {
        console.log('Inserting Hamilton into master usuarios table...');

        // Verifica se a empresa SoftHam existe
        const emp = await masterPool.query("SELECT id FROM empresas WHERE cnpj = '17504829000124'");
        if (emp.rows.length === 0) {
            console.error('Empresa SoftHam (17504829000124) not found in master DB!');
            return;
        }
        const companyId = emp.rows[0].id;
        console.log(`Found SoftHam with ID ${companyId}`);

        // Insere o usuário
        const query = `
            INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin, ativo)
            VALUES ($1, 'Hamilton', 'Sistemas', 'hamilton@softham.com.br', '123456', true, true)
            ON CONFLICT (email) DO UPDATE SET e_admin = true, ativo = true
            RETURNING id
        `;
        // Nota: A tabela usuarios pode não ter UNIQUE no email, vamos verificar ou usar INSERT se não existir

        const exists = await masterPool.query("SELECT id FROM usuarios WHERE email = 'hamilton@softham.com.br'");
        if (exists.rows.length > 0) {
            await masterPool.query("UPDATE usuarios SET e_admin = true, ativo = true, empresa_id = $1 WHERE email = 'hamilton@softham.com.br'", [companyId]);
            console.log('Updated existing Hamilton user.');
        } else {
            await masterPool.query("INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin, ativo) VALUES ($1, 'Hamilton', 'Sistemas', 'hamilton@softham.com.br', '123456', true, true)", [companyId]);
            console.log('Inserted new Hamilton user.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await masterPool.end();
    }
}

run();
