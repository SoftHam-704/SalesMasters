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

async function importCliInd() {
    try {
        console.log(`🚀 IMPORTANDO CONDIÇÕES COMERCIAIS (CLI_IND) -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/cli_ind.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        // Tenta garantir que existe o índice único para o ON CONFLICT funcionar
        try {
            await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_cli_ind_unique ON cli_ind (cli_codigo, cli_forcodigo)');
        } catch (e) {
            console.log('💡 Índice único já existe ou não pôde ser criado:', e.message);
        }

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO cli_ind (
                        cli_codigo, cli_forcodigo, cli_desc1, cli_desc2, cli_desc3,
                        cli_desc4, cli_desc5, cli_desc6, cli_desc7, cli_desc8,
                        cli_desc9, cli_desc10, cli_prazopg, cli_tabela, cli_comprador
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (cli_codigo, cli_forcodigo) DO UPDATE SET
                        cli_desc1 = EXCLUDED.cli_desc1,
                        cli_prazopg = EXCLUDED.cli_prazopg,
                        cli_tabela = EXCLUDED.cli_tabela
                `;

                const values = [
                    row.CLI_CODIGO || 0,
                    row.CLI_FORCODIGO || 0,
                    row.CLI_DESC1 || 0,
                    row.CLI_DESC2 || 0,
                    row.CLI_DESC3 || 0,
                    row.CLI_DESC4 || 0,
                    row.CLI_DESC5 || 0,
                    row.CLI_DESC6 || 0,
                    row.CLI_DESC7 || 0,
                    row.CLI_DESC8 || 0,
                    row.CLI_DESC9 || 0,
                    row.CLI_DESC10 || 0,
                    row.CLI_PRAZOPG || '',
                    row.CLI_TABELA || '',
                    row.CLI_COMPRADOR || ''
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\r🚀 Processando: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro no cli_ind [CLI: ${row.CLI_CODIGO} IND: ${row.CLI_FORCODIGO}]: ${err.message}`);
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

importCliInd();
