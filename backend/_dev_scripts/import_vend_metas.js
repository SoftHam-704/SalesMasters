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

async function importVendMetas() {
    try {
        console.log(`🚀 IMPORTANDO METAS -> SCHEMA: [${SCHEMA}]\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/ind_metas.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`✅ Arquivo lido: ${data.length} registros encontrados\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO vend_metas (
                        met_ano, met_industria, met_vendedor,
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_ago, met_set, met_out, met_nov, met_dez, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT ON CONSTRAINT vend_metas_pkey DO NOTHING -- Ajuste se houver unique key
                `, [
                    row.MET_ANO || row.met_ano || 2025,
                    row.MET_INDUSTRIA || row.met_industria || 0,
                    row.MET_VENDEDOR || row.met_vendedor || 0,
                    row.MET_JAN || row.met_jan || 0,
                    row.MET_FEV || row.met_fev || 0,
                    row.MET_MAR || row.met_mar || 0,
                    row.MET_ABR || row.met_abr || 0,
                    row.MET_MAI || row.met_mai || 0,
                    row.MET_JUN || row.met_jun || 0,
                    row.MET_JUL || row.met_jul || 0,
                    row.MET_AGO || row.met_ago || 0,
                    row.MET_SET || row.met_set || 0,
                    row.MET_OUT || row.met_out || 0,
                    row.MET_NOV || row.met_nov || 0,
                    row.MET_DEZ || row.met_dez || 0,
                    row.GID || row.gid || null
                ]);
                imported++;
            } catch (err) {
                errors++;
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importVendMetas();
