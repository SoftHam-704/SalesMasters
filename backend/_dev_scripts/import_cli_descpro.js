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

async function importCliDescPro() {
    try {
        console.log('📊 Importando descontos especiais (cli_descpro)...\n');

        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} registros encontrados\n`);

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO cli_descpro (
                        cli_codigo, cli_forcodigo, cli_grupo,
                        cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                        cli_desc6, cli_desc7, cli_desc8, cli_desc9, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    row.CLI_CODIGO || 0,
                    row.CLI_FORCODIGO || 0,
                    row.CLI_GRUPO || 0,
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
                imported++;
            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const result = await pool.query('SELECT * FROM cli_descpro');
        console.log('📋 Registro importado:');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCliDescPro();
