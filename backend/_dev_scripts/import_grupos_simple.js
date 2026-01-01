const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Mesma configuração do server.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function importGrupos() {
    try {
        const filePath = path.join(__dirname, '../data/grupos.xlsx');
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`Importando ${data.length} grupos...`);

        await pool.query('DELETE FROM grupos');

        for (const row of data) {
            await pool.query(
                'INSERT INTO grupos (gru_codigo, gru_nome) VALUES ($1, $2)',
                [row.GRU_CODIGO, row.GRU_NOME]
            );
        }

        const result = await pool.query('SELECT COUNT(*) FROM grupos');
        console.log(`✅ ${result.rows[0].count} grupos importados!`);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importGrupos();
