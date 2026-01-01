const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkTable() {
    try {
        console.log('🔍 Checking transportadora table...\n');

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'transportadora'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Table transportadora does NOT exist.');

            // Create table
            console.log('🛠️ Creating table transportadora...');
            await pool.query(`
                CREATE TABLE transportadora (
                    tra_codigo INTEGER PRIMARY KEY,
                    tra_nome VARCHAR(255),
                    tra_endereco VARCHAR(255),
                    tra_bairro VARCHAR(100),
                    tra_cidade VARCHAR(100),
                    tra_uf VARCHAR(2),
                    tra_cep VARCHAR(20),
                    tra_fone VARCHAR(50),
                    tra_cgc VARCHAR(50),
                    tra_inscricao VARCHAR(50),
                    tra_email VARCHAR(255),
                    tra_contato VARCHAR(100),
                    tra_obs TEXT
                );
            `);
            console.log('✅ Table transportadora created.');
        } else {
            console.log('✅ Table transportadora exists.');
            const count = await pool.query('SELECT COUNT(*) FROM transportadora');
            console.log(`📊 Current record count: ${count.rows[0].count}`);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTable();
