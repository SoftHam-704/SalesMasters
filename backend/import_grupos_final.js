const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Exatamente a mesma configuração do server.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function importGrupos() {
    const client = await pool.connect();

    try {
        const filePath = path.join(__dirname, '../data/grupos.xlsx');
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} grupos encontrados na planilha\n`);

        await client.query('BEGIN');
        await client.query('DELETE FROM grupos');

        for (const row of data) {
            await client.query(
                'INSERT INTO grupos (gru_codigo, gru_nome) VALUES ($1, $2)',
                [row.GRU_CODIGO, row.GRU_NOME]
            );
        }

        await client.query('COMMIT');

        const result = await client.query('SELECT COUNT(*) FROM grupos');
        console.log(`✅ ${result.rows[0].count} grupos importados com sucesso!\n`);

        const sample = await client.query('SELECT * FROM grupos ORDER BY gru_nome LIMIT 5');
        console.log('Primeiros 5 grupos:');
        console.table(sample.rows);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

importGrupos();
