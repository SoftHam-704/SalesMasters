const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function normalize(str) {
    if (!str) return '';
    return str.toString().trim().toUpperCase();
}

async function importToCliDescPro() {
    try {
        // Read Excel file
        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Sheet1'];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} records to import`);

        // Clear existing data
        await pool.query('DELETE FROM cli_descpro');
        console.log('✅ Cleared cli_descpro table');

        let inserted = 0;
        let notFound = [];

        for (const row of data) {
            const { CLI_NOMRED, FOR_NOMERED, GRU_NOME } = row;

            if (!CLI_NOMRED || !FOR_NOMERED || !GRU_NOME) {
                console.log('⚠️  Skipping invalid row:', row);
                continue;
            }

            const clientName = normalize(CLI_NOMRED);
            const supplierName = normalize(FOR_NOMERED);
            const groupName = normalize(GRU_NOME);

            // Find client
            const client = await pool.query(
                `SELECT cli_codigo FROM clientes WHERE UPPER(TRIM(cli_nomred)) = $1`,
                [clientName]
            );

            // Find supplier
            const supplier = await pool.query(
                `SELECT for_codigo FROM fornecedores WHERE UPPER(TRIM(for_nomered)) = $1`,
                [supplierName]
            );

            // Find group
            const group = await pool.query(
                `SELECT gde_id, gde_desc1, gde_desc2, gde_desc3, gde_desc4, gde_desc5, gde_desc6, gde_desc7, gde_desc8, gde_desc9 
                 FROM grupo_desc 
                 WHERE UPPER(TRIM(gde_nome)) = $1`,
                [groupName]
            );

            if (client.rows.length === 0) {
                notFound.push({ type: 'Client', name: CLI_NOMRED });
                continue;
            }

            if (supplier.rows.length === 0) {
                notFound.push({ type: 'Supplier', name: FOR_NOMERED });
                continue;
            }

            if (group.rows.length === 0) {
                notFound.push({ type: 'Group', name: GRU_NOME });
                continue;
            }

            const g = group.rows[0];

            // Insert into cli_descpro
            await pool.query(
                `INSERT INTO cli_descpro 
                 (cli_codigo, cli_forcodigo, cli_grupo, cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, cli_desc6, cli_desc7, cli_desc8, cli_desc9)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    client.rows[0].cli_codigo,
                    supplier.rows[0].for_codigo,
                    g.gde_id,
                    g.gde_desc1 || 0,
                    g.gde_desc2 || 0,
                    g.gde_desc3 || 0,
                    g.gde_desc4 || 0,
                    g.gde_desc5 || 0,
                    g.gde_desc6 || 0,
                    g.gde_desc7 || 0,
                    g.gde_desc8 || 0,
                    g.gde_desc9 || 0
                ]
            );

            inserted++;
            console.log(`✅ ${CLI_NOMRED} + ${FOR_NOMERED} → ${GRU_NOME}`);
        }

        console.log(`\n✅ IMPORT COMPLETE`);
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Not found: ${notFound.length}`);

        if (notFound.length > 0) {
            console.log('\n⚠️  Not found details:');
            console.table(notFound.slice(0, 10));
        }

        // Verify AMPAGRIL
        const ampagril = await pool.query(`
            SELECT c.cli_nomred, f.for_nomered, gd.gde_nome, cd.cli_desc1, cd.cli_desc2
            FROM cli_descpro cd
            JOIN clientes c ON c.cli_codigo = cd.cli_codigo
            JOIN fornecedores f ON f.for_codigo = cd.cli_forcodigo
            JOIN grupo_desc gd ON gd.gde_id = cd.cli_grupo
            WHERE UPPER(c.cli_nomred) LIKE '%AMPAGRIL%'
        `);

        console.log('\n✅ AMPAGRIL discount groups:');
        console.table(ampagril.rows);

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await pool.end();
    }
}

importToCliDescPro();
