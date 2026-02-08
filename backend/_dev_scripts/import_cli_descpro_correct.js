const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
});

const SCHEMA = process.env.SCHEMA || 'soma';

function normalize(str) {
    if (!str) return '';
    return str.toString().trim().toUpperCase();
}

async function importToCliDescPro() {
    try {
        console.log(`🚀 IMPORTANDO DESCONTOS (cli_descpro) -> SCHEMA: [${SCHEMA}]\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        // Read Excel file
        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/cli_descpro.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`Found ${data.length} records to import`);

        // No UPSERT for this table as it relies on complex lookups, but we'll clear first as per user's logic
        await pool.query('DELETE FROM cli_descpro');
        console.log('✅ Cleared cli_descpro table');

        let inserted = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const { CLI_NOMRED, FOR_NOMERED, GRU_NOME, cli_codigo, cli_forcodigo, cli_grupo } = row;

                // Priority to direct codes if available, otherwise lookup by name
                let finalCli = cli_codigo;
                let finalFor = cli_forcodigo;
                let finalGde = cli_grupo;

                if (!finalCli && CLI_NOMRED) {
                    const res = await pool.query(`SELECT cli_codigo FROM clientes WHERE UPPER(TRIM(cli_nomred)) = $1`, [normalize(CLI_NOMRED)]);
                    if (res.rows.length > 0) finalCli = res.rows[0].cli_codigo;
                }

                if (!finalFor && FOR_NOMERED) {
                    const res = await pool.query(`SELECT for_codigo FROM fornecedores WHERE UPPER(TRIM(for_nomered)) = $1`, [normalize(FOR_NOMERED)]);
                    if (res.rows.length > 0) finalFor = res.rows[0].for_codigo;
                }

                if (!finalGde && GRU_NOME) {
                    // Note: table is groups_desc or similar but the logic says grupo_desc
                    const res = await pool.query(`SELECT gde_id FROM grupo_desc WHERE UPPER(TRIM(gde_nome)) = $1`, [normalize(GRU_NOME)]);
                    if (res.rows.length > 0) finalGde = res.rows[0].gde_id;
                }

                if (finalCli && finalFor && finalGde) {
                    // Get group details
                    const group = await pool.query(`SELECT * FROM grupo_desc WHERE gde_id = $1`, [finalGde]);
                    const g = group.rows[0];

                    await pool.query(
                        `INSERT INTO cli_descpro 
                         (cli_codigo, cli_forcodigo, cli_grupo, cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, cli_desc6, cli_desc7, cli_desc8, cli_desc9)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                        [
                            finalCli, finalFor, finalGde,
                            g.gde_desc1 || 0, g.gde_desc2 || 0, g.gde_desc3 || 0,
                            g.gde_desc4 || 0, g.gde_desc5 || 0, g.gde_desc6 || 0,
                            g.gde_desc7 || 0, g.gde_desc8 || 0, g.gde_desc9 || 0
                        ]
                    );
                    inserted++;
                } else {
                    errors++;
                }

                if (inserted % 100 === 0) process.stdout.write(`\r🚀 Processando: ${inserted}/${data.length}`);

            } catch (err) {
                errors++;
            }
        }

        console.log(`\n\n✅ IMPORT COMPLETE`);
        console.log(`   Inserted: ${inserted} | Errors/Not Found: ${errors}\n`);

    } catch (error) {
        console.error('❌ Import failed:', error.message);
    } finally {
        await pool.end();
    }
}

importToCliDescPro();
