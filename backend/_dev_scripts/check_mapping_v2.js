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

async function checkMapping() {
    try {
        const code = '912069';
        console.log(`Checking for code: ${code}`);

        // Check pro_codprod
        const res1 = await pool.query(`SELECT pro_id, pro_codprod, pro_codigofabricante, pro_industria FROM cad_prod WHERE pro_codprod = $1`, [code]);
        console.log('Result in pro_codprod:', res1.rows);

        // Check pro_codigofabricante
        const res2 = await pool.query(`SELECT pro_id, pro_codprod, pro_codigofabricante, pro_industria FROM cad_prod WHERE pro_codigofabricante = $1`, [code]);
        console.log('Result in pro_codigofabricante:', res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkMapping();
