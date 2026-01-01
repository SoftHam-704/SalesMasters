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

async function importCliInd() {
    try {
        console.log('📊 Importando cli_ind (Condições Comerciais Cliente x Indústria)...\n');

        const dataNovaEra = '2025-12-29';
        const filePath = path.join(__dirname, '../data/cli_ind.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} condições comerciais encontradas\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // cli_lancamento é autoincremento, não precisa enviar
                await pool.query(`
                    INSERT INTO cli_ind (
                        cli_codigo, cli_forcodigo, cli_desc1, cli_desc2, cli_desc3,
                        cli_desc4, cli_desc5, cli_desc6, cli_desc7, cli_desc8,
                        cli_desc9, cli_desc10, cli_transportadora, cli_prazopg,
                        cli_tabela, cli_comprador
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
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
                    row.CLI_TRANSPORTADORA || null,
                    row.CLI_PRAZOPG || '',
                    row.CLI_TABELA || '',
                    row.CLI_COMPRADOR || ''
                ]);
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                if (errors <= 5) {
                    console.error(`\n❌ Erro: ${err.message}`);
                }
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length}`);
        console.log(`   Importados: ${imported}`);
        console.log(`   Erros: ${errors}\n`);

        const count = await pool.query('SELECT COUNT(*) FROM cli_ind');
        console.log(`📊 Total de condições no banco: ${count.rows[0].count}`);

        const sample = await pool.query(`
            SELECT ci.cli_lancamento, c.cli_nomred as cliente, f.for_nomered as fornecedor,
                   ci.cli_desc1, ci.cli_tabela, ci.cli_comprador
            FROM cli_ind ci
            LEFT JOIN clientes c ON c.cli_codigo = ci.cli_codigo
            LEFT JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
            LIMIT 5
        `);
        console.log('\n📋 Amostra com relacionamentos:');
        console.table(sample.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCliInd();
