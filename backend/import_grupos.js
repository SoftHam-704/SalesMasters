const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'salesmaster',
    user: 'postgres',
    password: 'postgres'
});

async function importGrupos() {
    try {
        console.log('📂 Importando grupos.xlsx...\n');

        const filePath = path.join(__dirname, '../data/grupos.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`📊 Encontrados ${data.length} registros na planilha`);
        console.log('Primeiros 3 registros:');
        console.table(data.slice(0, 3));

        // Clear existing data
        await pool.query('DELETE FROM grupos');
        console.log('✅ Tabela grupos limpa\n');

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO grupos (
                        gru_codigo, gru_nome, gru_industria,
                        gru_desc1, gru_desc2, gru_desc3, gru_desc4, gru_desc5,
                        gru_desc6, gru_desc7, gru_desc8, gru_desc9, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    row.GRU_CODIGO || row.gru_codigo || null,
                    row.GRU_NOME || row.gru_nome || null,
                    row.GRU_INDUSTRIA || row.gru_industria || null,
                    row.GRU_DESC1 || row.gru_desc1 || 0,
                    row.GRU_DESC2 || row.gru_desc2 || 0,
                    row.GRU_DESC3 || row.gru_desc3 || 0,
                    row.GRU_DESC4 || row.gru_desc4 || 0,
                    row.GRU_DESC5 || row.gru_desc5 || 0,
                    row.GRU_DESC6 || row.gru_desc6 || 0,
                    row.GRU_DESC7 || row.gru_desc7 || 0,
                    row.GRU_DESC8 || row.gru_desc8 || 0,
                    row.GRU_DESC9 || row.gru_desc9 || 0,
                    row.GID || row.gid || null
                ]);
                imported++;
                if (imported % 10 === 0) {
                    console.log(`   Importados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`❌ Erro na linha ${imported + errors}:`, err.message);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   - Importados: ${imported}`);
        console.log(`   - Erros: ${errors}`);

        // Show sample
        const result = await pool.query('SELECT gru_codigo, gru_nome FROM grupos ORDER BY gru_nome LIMIT 10');
        console.log('\nPrimeiros 10 grupos importados:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importGrupos();
