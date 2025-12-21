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

async function importCliInd() {
    try {
        const filePath = path.join(__dirname, '../data/indclientes.xlsx');
        const workbook = XLSX.readFile(filePath); // Read all rows

        console.log(`Abas encontradas: ${workbook.SheetNames.join(', ')}\n`);

        let allData = [];

        // Iterate through all sheets
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
            console.log(`${sheetName}: ${data.length} registros`);
            allData = allData.concat(data);
        }

        console.log(`\nTotal consolidado: ${allData.length} registros\n`);

        await pool.query('DELETE FROM indclientes');

        let count = 0;
        let errors = 0;

        for (const row of allData) {
            // Check for required fields based on user mapping
            // CLI_ID = cli_id, CLI_INDID = cli_indid
            if (!row.CLI_ID || !row.CLI_INDID) {
                continue;
            }

            try {
                await pool.query(`
                    INSERT INTO indclientes (cli_id, cli_indid, gid)
                    VALUES ($1, $2, $3)
                `, [
                    row.CLI_ID,
                    row.CLI_INDID,
                    row.GID || null
                ]);
                count++;
                if (count % 500 === 0) {
                    console.log(`Importados: ${count}`);
                }
            } catch (err) {
                // Ignore duplicates if unique constraint exists
                errors++;
            }
        }

        console.log(`\n✅ ${count} registros importados com sucesso!`);
        if (errors > 0) console.log(`⚠️  ${errors} erros (provavelmente duplicados ou chaves inválidas)`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importCliInd();
