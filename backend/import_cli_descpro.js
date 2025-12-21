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

async function importCliDescpro() {
    try {
        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath, { sheetRows: 0 }); // Read all rows
        const sheet = workbook.Sheets['Sheet1'];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

        console.log(`Total de registros encontrados: ${data.length}\n`);

        await pool.query('DELETE FROM cli_descpro');

        let count = 0;
        let errors = 0;

        for (const row of data) {
            // Skip empty rows
            if (!row.CLI_CODIGO || !row.CLI_FORCODIGO || !row.CLI_GRUPO) {
                continue;
            }

            try {
                await pool.query(`
                    INSERT INTO cli_descpro (
                        cli_codigo, cli_forcodigo, cli_grupo,
                        cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                        cli_desc6, cli_desc7, cli_desc8, cli_desc9, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    row.CLI_CODIGO,
                    row.CLI_FORCODIGO,
                    row.CLI_GRUPO,
                    row.CLI_DESC1 || 0,
                    row.CLI_DESC2 || 0,
                    row.CLI_DESC3 || 0,
                    row.CLI_DESC4 || 0,
                    row.CLI_DESC5 || 0,
                    row.CLI_DESC6 || 0,
                    row.CLI_DESC7 || 0,
                    row.CLI_DESC8 || 0,
                    row.CLI_DESC9 || 0,
                    row.GID || null
                ]);
                count++;
                if (count % 100 === 0) {
                    console.log(`Importados: ${count}`);
                }
            } catch (err) {
                errors++;
            }
        }

        console.log(`\n✅ ${count} registros importados com sucesso!`);
        if (errors > 0) console.log(`⚠️  ${errors} erros`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importCliDescpro();
