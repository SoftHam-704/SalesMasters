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

async function migrateCliDescPro() {
    try {
        // Read Excel file
        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Sheet1'];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} discount group assignments`);

        // First, check if we need to add a column to cli_ind for group reference
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='cli_ind' AND column_name='cli_grupodesc'
        `);

        if (checkCol.rows.length === 0) {
            console.log('Adding cli_grupodesc column to cli_ind...');
            await pool.query(`
                ALTER TABLE cli_ind 
                ADD COLUMN IF NOT EXISTS cli_grupodesc INTEGER REFERENCES grupo_desc(gde_id)
            `);
            console.log('✅ Column added');
        }

        let updated = 0;
        let notFound = 0;

        for (const row of data) {
            const { CLI_NOMRED, FOR_NOMERED, GRU_NOME } = row;

            if (!CLI_NOMRED || !FOR_NOMERED || !GRU_NOME) {
                console.log('Skipping invalid row:', row);
                continue;
            }

            // Find client by nome reduzido
            const client = await pool.query(
                `SELECT cli_codigo FROM clientes WHERE cli_nomered = $1`,
                [CLI_NOMRED]
            );

            // Find supplier by nome reduzido
            const supplier = await pool.query(
                `SELECT for_codigo FROM fornecedor WHERE for_nomered = $1`,
                [FOR_NOMERED]
            );

            // Find discount group by name and supplier
            const group = await pool.query(
                `SELECT gde_id FROM grupo_desc WHERE gde_nome = $1 AND gde_industria = $2`,
                [GRU_NOME, supplier.rows[0]?.for_codigo]
            );

            if (client.rows.length === 0) {
                console.log(`⚠️  Client not found: ${CLI_NOMRED}`);
                notFound++;
                continue;
            }

            if (supplier.rows.length === 0) {
                console.log(`⚠️  Supplier not found: ${FOR_NOMERED}`);
                notFound++;
                continue;
            }

            if (group.rows.length === 0) {
                console.log(`⚠️  Group not found: ${GRU_NOME} for ${FOR_NOMERED}`);
                notFound++;
                continue;
            }

            // Update cli_ind with group reference
            await pool.query(
                `UPDATE cli_ind 
                 SET cli_grupodesc = $1 
                 WHERE cli_codigo = $2 AND cli_forcodigo = $3`,
                [group.rows[0].gde_id, client.rows[0].cli_codigo, supplier.rows[0].for_codigo]
            );

            updated++;
            console.log(`✅ ${CLI_NOMRED} + ${FOR_NOMERED} → ${GRU_NOME}`);
        }

        console.log(`\n✅ Migration complete: ${updated} updated, ${notFound} not found`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrateCliDescPro();
