const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkProdSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'cad_prod'
            ORDER BY ordinal_position
            LIMIT 20
        `);
        console.log('📋 Primeiras colunas de cad_prod:');
        console.table(res.rows);

        // Verificar se tem codigonormalizado
        const hasNorm = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cad_prod' 
            AND column_name = 'pro_codigonormalizado'
        `);

        if (hasNorm.rows.length > 0) {
            console.log('✅ cad_prod TEM pro_codigonormalizado');
        } else {
            console.log('⚠️  cad_prod NÃO TEM pro_codigonormalizado - precisa criar!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkProdSchema();
