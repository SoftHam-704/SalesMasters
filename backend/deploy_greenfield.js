const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function deployViews() {
    const sqlPath = path.join(__dirname, 'sql', 'deploy_greenfield_views.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Iniciando deploy das views Greenfield...');

    try {
        const res = await pool.query(sql);
        console.log('✅ Deploy finalizado com sucesso!');
        // O postgres retorna as notices no client
        pool.on('notice', (msg) => {
            console.log('Postgres Notice:', msg.message);
        });
    } catch (err) {
        console.error('❌ ERRO NO DEPLOY:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

deployViews();
