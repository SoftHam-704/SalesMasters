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

async function importCidadesRegioes() {
    try {
        console.log(`🚀 IMPORTANDO VÍNCULO CIDADES-REGIÕES -> SCHEMA: [${SCHEMA}]\n`);

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/cidades_regioes.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const reg_id = row.reg_id || row.REG_ID;
                const cid_id = row.cid_id || row.CID_ID;

                if (!reg_id || !cid_id) continue;

                await pool.query(
                    `INSERT INTO cidades_regioes (reg_id, cid_id) 
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [reg_id, cid_id]
                );
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\r🚀 Processando: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCidadesRegioes();
