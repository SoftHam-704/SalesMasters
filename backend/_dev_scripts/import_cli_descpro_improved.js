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

async function importCliDescPro() {
    try {
        // Read Excel file
        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Sheet1'];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} discount group assignments to import`);

        // First, clear existing links
        await pool.query('UPDATE cli_ind SET cli_grupodesc = NULL WHERE cli_grupodesc IS NOT NULL');
        console.log('✅ Cleared existing discount group links');

        let linked = 0;
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

            // Find client (case-insensitive, trimmed)
            const client = await pool.query(
                `SELECT cli_codigo FROM clientes WHERE UPPER(TRIM(cli_nomred)) = $1`,
                [clientName]
            );

            // Find supplier (case-insensitive, trimmed)
            const supplier = await pool.query(
                `SELECT for_codigo FROM fornecedores WHERE UPPER(TRIM(for_nomered)) = $1`,
                [supplierName]
            );

            // Find group (case-insensitive, trimmed)
            const group = await pool.query(
                `SELECT gde_id FROM grupo_desc WHERE UPPER(TRIM(gde_nome)) = $1`,
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

            // Update cli_ind with group reference
            const result = await pool.query(
                `UPDATE cli_ind 
                 SET cli_grupodesc = $1 
                 WHERE cli_codigo = $2 AND cli_forcodigo = $3`,
                [group.rows[0].gde_id, client.rows[0].cli_codigo, supplier.rows[0].for_codigo]
            );

            if (result.rowCount > 0) {
                linked++;
                console.log(`✅ ${CLI_NOMRED} + ${FOR_NOMERED} → ${GRU_NOME}`);
            } else {
                console.log(`⚠️  No cli_ind record found for: ${CLI_NOMRED} + ${FOR_NOMERED}`);
            }
        }

        console.log(`\n✅ IMPORT COMPLETE`);
        console.log(`   Linked: ${linked}`);
        console.log(`   Not found: ${notFound.length}`);

        if (notFound.length > 0) {
            console.log('\n⚠️  Not found details:');
            console.table(notFound.slice(0, 10));
        }

        // Verify AMPAGRIL
        const ampagril = await pool.query(`
            SELECT c.cli_nomred, f.for_nomered, gd.gde_nome
            FROM cli_ind ci
            JOIN clientes c ON c.cli_codigo = ci.cli_codigo
            JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
            JOIN grupo_desc gd ON gd.gde_id = ci.cli_grupodesc
            WHERE UPPER(c.cli_nomred) LIKE '%AMPAGRIL%'
            AND ci.cli_grupodesc IS NOT NULL
        `);

        console.log('\n✅ AMPAGRIL discount groups:');
        console.table(ampagril.rows);

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await pool.end();
    }
}

importCliDescPro();
