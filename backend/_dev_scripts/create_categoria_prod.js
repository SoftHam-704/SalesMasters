const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function createAndSeedTable() {
    try {
        console.log('🛠️ Creating table categoria_prod...');

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categoria_prod (
                cat_id SERIAL PRIMARY KEY,
                cat_descricao VARCHAR(255) NOT NULL
            );
        `);
        console.log('✅ Table created/verified.');

        // Seed data
        const categories = [
            'Leve',
            'Pesada',
            'Agricola',
            'Utilitários',
            'Off-road',
            'Motopeças'
        ];

        console.log('🌱 Seeding data...');
        let added = 0;
        for (const cat of categories) {
            // Check if exists to avoid duplicates on re-run
            const check = await pool.query('SELECT 1 FROM categoria_prod WHERE cat_descricao = $1', [cat]);

            if (check.rowCount === 0) {
                await pool.query('INSERT INTO categoria_prod (cat_descricao) VALUES ($1)', [cat]);
                added++;
            }
        }

        console.log(`✅ Seed complete. Added ${added} new categories.`);

        const result = await pool.query('SELECT * FROM categoria_prod ORDER BY cat_id');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

createAndSeedTable();
