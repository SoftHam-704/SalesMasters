const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function importGrupos() {
    try {
        console.log('📂 Importando grupos de produtos...\n');

        const filePath = path.join(__dirname, '../data/grupos.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} grupos encontrados\n`);

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO grupos (gru_codigo, gru_nome, gru_percomiss, gid)
                    VALUES ($1, $2, $3, $4)
                `, [
                    row.GRU_CODIGO || 0,
                    row.GRU_NOME || '',
                    row.GRU_PERCOMISS || 0,
                    row.GID || ''
                ]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const result = await pool.query('SELECT * FROM grupos ORDER BY gru_codigo');
        console.log('📋 Grupos importados:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importGrupos();
