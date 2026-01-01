const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'basesales',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: 5432,
});

async function checkNormalized() {
    try {
        const code = '912069';
        console.log(`Checking for code: ${code}`);

        const res = await pool.query(`SELECT pro_id, pro_codprod, pro_codigonormalizado, pro_industria FROM cad_prod WHERE pro_codprod = $1`, [code]);
        console.log('Product Data:', res.rows);

        // Also check if we can find it by searching normalized
        const normalizedInput = code.replace(/[^a-zA-Z0-9]/g, ''); // mimic normalization
        const resNorm = await pool.query(`SELECT pro_id FROM cad_prod WHERE pro_codigonormalizado = $1`, [normalizedInput]);
        console.log(`Found by normalized '${normalizedInput}':`, resNorm.rowCount > 0);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkNormalized();
