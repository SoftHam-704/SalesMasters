const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        // 1. Check DB Count
        const res = await pool.query('SELECT COUNT(*) FROM area_atu');
        console.log(`DB Count area_atu: ${res.rows[0].count}`);

        // 2. Inspect File Sheets
        const filePath = path.join(__dirname, '../data/area_atu.xlsx');
        const workbook = XLSX.readFile(filePath);
        console.log(`Sheets in area_atu.xlsx: ${workbook.SheetNames.join(', ')}`);

        workbook.SheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, limit: 1 });
            console.log(`Sheet '${name}' headers:`, data[0]);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
