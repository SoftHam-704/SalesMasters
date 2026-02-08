const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

const SCHEMA = process.env.SCHEMA || 'soma';

async function importGrupoDesc() {
    try {
        console.log(`🚀 IMPORTANDO DESCONTOS POR GRUPO -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/grupo_desc.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO grupo_desc (
                        gid, gde_nome, gde_desc1, gde_desc2, gde_desc3, gde_desc4, gde_desc5,
                        gde_desc6, gde_desc7, gde_desc8, gde_desc9
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    String(row.GRU_CODIGO || row.gid || row.GID || 0),
                    row.GDE_NOME || row.gde_nome || row.GRU_NOME || '',
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
                console.error(`❌ Erro no desconto [${row.GDE_NOME}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Carga concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importGrupoDesc();
