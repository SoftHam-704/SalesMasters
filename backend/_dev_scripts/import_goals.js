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

const SCHEMA = 'ro_consult';

async function importGoals() {
    try {
        console.log(`🚀 IMPORTANDO METAS -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/ind_metas.xlsx');
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
                const query = `
                    INSERT INTO ind_metas (
                        met_ano, met_industria,
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_ago, met_set, met_out, met_nov, met_dez
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (met_ano, met_industria) DO UPDATE SET
                        met_jan = EXCLUDED.met_jan,
                        met_fev = EXCLUDED.met_fev,
                        met_mar = EXCLUDED.met_mar,
                        met_abr = EXCLUDED.met_abr,
                        met_mai = EXCLUDED.met_mai,
                        met_jun = EXCLUDED.met_jun,
                        met_jul = EXCLUDED.met_jul,
                        met_ago = EXCLUDED.met_ago,
                        met_set = EXCLUDED.met_set,
                        met_out = EXCLUDED.met_out,
                        met_nov = EXCLUDED.met_nov,
                        met_dez = EXCLUDED.met_dez
                `;

                const values = [
                    row.MET_ANO || new Date().getFullYear(),
                    row.MET_INDUSTRIA || 0,
                    parseFloat(row.MET_JAN || 0),
                    parseFloat(row.MET_FEV || 0),
                    parseFloat(row.MET_MAR || 0),
                    parseFloat(row.MET_ABR || 0),
                    parseFloat(row.MET_MAI || 0),
                    parseFloat(row.MET_JUN || 0),
                    parseFloat(row.MET_JUL || 0),
                    parseFloat(row.MET_AGO || 0),
                    parseFloat(row.MET_SET || 0),
                    parseFloat(row.MET_OUT || 0),
                    parseFloat(row.MET_NOV || 0),
                    parseFloat(row.MET_DEZ || 0)
                ];

                await pool.query(query, values);
                imported++;

            } catch (err) {
                errors++;
                console.error(`\n❌ Erro na meta [${row.MET_ANO} - IND: ${row.MET_INDUSTRIA}]: ${err.message}`);
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

importGoals();
