require('dotenv').config();
const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function importGrupos() {
    try {
        const filePath = path.join(__dirname, '../data/grupos.xlsx');
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`Importando ${data.length} registros...`);

        await pool.query('DELETE FROM grupos');

        let count = 0;
        for (const row of data) {
            await pool.query(`
                INSERT INTO grupos (gru_codigo, gru_nome, gru_percomiss, gid)
                VALUES ($1, $2, $3, $4)
            `, [
                row.GRU_CODIGO,
                row.GRU_NOME,
                row.GRU_PERCOMISS || null,
                row.GID || null
            ]);
            count++;
        }

        console.log(`✅ ${count} registros importados com sucesso!`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importGrupos();
