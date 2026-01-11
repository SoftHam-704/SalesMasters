const { Pool } = require('pg');

const pool = new Pool({
    database: 'salesmasters_master',
    user: 'postgres',
    password: '@12Pilabo',
    host: 'localhost',
    port: 5432
});

async function run() {
    // Apontar SoftHam para a nuvem
    await pool.query(`
        UPDATE empresas 
        SET db_host = 'node254557-salesmaster.sp1.br.saveincloud.net.br', 
            db_porta = 13062,
            db_senha = 'process.env.DB_PASSWORD'
        WHERE cnpj = '00000000000191'
    `);
    console.log('✅ SoftHam agora aponta para a NUVEM!');

    const res = await pool.query('SELECT cnpj, db_host, db_porta FROM empresas');
    console.table(res.rows);

    await pool.end();
}

run().catch(console.error);

