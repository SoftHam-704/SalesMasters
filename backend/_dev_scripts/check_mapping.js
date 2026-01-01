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
        // Check finding product by manufacturer code (which seems to be the CSV code)
        // CSV Examples: 912069, 340847, 272957
        // CSV Industria: 35
        console.log('Checking Products for codes: 912069, 340847, 272957...');
        const res = await pool.query(`
            SELECT pro_codigo, pro_codigofabricante, pro_industria 
            FROM cad_prod 
            WHERE pro_codigofabricante IN ('912069', '340847', '272957')
        `);
        console.log('Found in DB:', res.rows);

        // Check if Industria 35 exists
        const resInd = await pool.query('SELECT for_codigo, for_nomered FROM fornecedores WHERE for_codigo = 35');
        console.log('Industria 35:', resInd.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkMapping();
