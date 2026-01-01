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
        const filePath = path.join(__dirname, '../data/cli_ind.xlsx');
        console.log('📂 Lendo arquivo:', filePath);

        const workbook = XLSX.readFile(filePath);
        console.log(`📋 Abas encontradas: ${workbook.SheetNames.join(', ')}\n`);

        let allData = [];

        // Iterate through all sheets
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
            console.log(`${sheetName}: ${data.length} registros`);
            allData = allData.concat(data);
        }

        console.log(`\n📊 Total consolidado: ${allData.length} registros\n`);

        // Clear existing data
        await pool.query('DELETE FROM cli_ind');
        console.log('🗑️  Dados antigos removidos\n');

        let count = 0;
        let errors = 0;
        let autoId = 1; // Contador manual para cli_lancamento

        for (const row of allData) {
            // Check for required fields - only CLI_CODIGO and CLI_FORCODIGO
            if (!row.CLI_CODIGO || !row.CLI_FORCODIGO) {
                continue;
            }

            try {
                await pool.query(`
                    INSERT INTO cli_ind (
                        cli_lancamento, cli_codigo, cli_forcodigo,
                        cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                        cli_desc6, cli_desc7, cli_desc8, cli_desc9, cli_desc10,
                        cli_transportadora, cli_prazopg, cli_ipi, cli_tabela,
                        cli_codcliind, cli_obsparticular, cli_comprador,
                        cli_frete, cli_emailcomprador, cli_desc11, cli_grupodesc
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                    )
                `, [
                    autoId++, // Usar contador automático
                    row.CLI_CODIGO,
                    row.CLI_FORCODIGO,
                    row.CLI_DESC1 || null,
                    row.CLI_DESC2 || null,
                    row.CLI_DESC3 || null,
                    row.CLI_DESC4 || null,
                    row.CLI_DESC5 || null,
                    row.CLI_DESC6 || null,
                    row.CLI_DESC7 || null,
                    row.CLI_DESC8 || null,
                    row.CLI_DESC9 || null,
                    row.CLI_DESC10 || null,
                    row.CLI_TRANSPORTADORA || null,
                    row.CLI_PRAZOPG || null,
                    row.CLI_IPI || null,
                    row.CLI_TABELA || null,
                    row.CLI_CODCLIIND || null,
                    row.CLI_OBSPARTICULAR || null,
                    row.CLI_COMPRADOR || null,
                    row.CLI_FRETE || null,
                    row.CLI_EMAILCOMPRADOR || null,
                    row.CLI_DESC11 || null,
                    row.CLI_GRUPODESC || null
                ]);
                count++;
                if (count % 100 === 0) {
                    console.log(`✅ Importados: ${count}`);
                }
            } catch (err) {
                errors++;
                if (errors <= 5) {
                    console.error(`❌ Erro linha ${count + errors}:`, err.message);
                }
            }
        }

        console.log(`\n✅ ${count} registros importados com sucesso!`);
        if (errors > 0) console.log(`⚠️  ${errors} erros encontrados`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

importCliInd();
