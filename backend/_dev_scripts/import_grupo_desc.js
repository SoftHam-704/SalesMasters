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

async function importGrupoDesc() {
    try {
        console.log('📊 Importando descontos por grupo (grupo_desc)...\n');

        const filePath = path.join(__dirname, '../data/grupo_desc.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} grupos de desconto encontrados\n`);

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO grupo_desc (
                        gid, gde_nome, gde_desc1, gde_desc2, gde_desc3, gde_desc4, gde_desc5,
                        gde_desc6, gde_desc7, gde_desc8, gde_desc9
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    String(row.GRU_CODIGO || 0), // Ensure string for GID
                    row.GDE_NOME || '',
                    row.GDE_DESC1 || row.GRU_DESC1 || 0,
                    row.GDE_DESC2 || row.GRU_DESC2 || 0,
                    row.GDE_DESC3 || row.GRU_DESC3 || 0,
                    row.GDE_DESC4 || row.GRU_DESC4 || 0,
                    row.GDE_DESC5 || row.GRU_DESC5 || 0,
                    row.GDE_DESC6 || row.GRU_DESC6 || 0,
                    row.GDE_DESC7 || row.GRU_DESC7 || 0,
                    row.GDE_DESC8 || row.GRU_DESC8 || 0,
                    row.GDE_DESC9 || row.GRU_DESC9 || 0
                ]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const result = await pool.query('SELECT * FROM grupo_desc ORDER BY gru_codigo');
        console.log('📋 Descontos por grupo:');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importGrupoDesc();
