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

async function migrateDiscountGroups() {
    try {
        console.log('=== STEP 1: Import Group Names (grupos.xlsx) ===');
        const gruposPath = path.join(__dirname, '../data/grupos.xlsx');
        const gruposWb = XLSX.readFile(gruposPath);
        const gruposData = XLSX.utils.sheet_to_json(gruposWb.Sheets['Sheet1']);

        // Clear existing data
        await pool.query('DELETE FROM grupo_desc');
        console.log('Cleared grupo_desc table');

        let groupsInserted = 0;
        for (const row of gruposData) {
            if (!row.GRU_CODIGO || !row.GRU_NOME) continue;

            await pool.query(
                `INSERT INTO grupo_desc (gde_id, gde_nome, gde_industria, gid) 
                 VALUES ($1, $2, 0, $3)
                 ON CONFLICT (gde_id) DO UPDATE SET gde_nome = $2`,
                [row.GRU_CODIGO, row.GRU_NOME, row.GID || null]
            );
            groupsInserted++;
        }
        console.log(`✅ Inserted ${groupsInserted} group names`);

        console.log('\n=== STEP 2: Update Discount Values (grupo_desc.xlsx) ===');
        const grupoDescPath = path.join(__dirname, '../data/grupo_desc.xlsx');
        const grupoDescWb = XLSX.readFile(grupoDescPath);
        const grupoDescData = XLSX.utils.sheet_to_json(grupoDescWb.Sheets['Sheet1']);

        let valuesUpdated = 0;
        for (const row of grupoDescData) {
            if (!row.GRU_CODIGO) continue;

            await pool.query(
                `UPDATE grupo_desc 
                 SET gde_desc1 = $1, gde_desc2 = $2, gde_desc3 = $3, 
                     gde_desc4 = $4, gde_desc5 = $5, gde_desc6 = $6,
                     gde_desc7 = $7, gde_desc8 = $8, gde_desc9 = $9
                 WHERE gde_id = $10`,
                [
                    row.GRU_DESC1 || 0, row.GRU_DESC2 || 0, row.GRU_DESC3 || 0,
                    row.GRU_DESC4 || 0, row.GRU_DESC5 || 0, row.GRU_DESC6 || 0,
                    row.GRU_DESC7 || 0, row.GRU_DESC8 || 0, row.GRU_DESC9 || 0,
                    row.GRU_CODIGO
                ]
            );
            valuesUpdated++;
        }
        console.log(`✅ Updated ${valuesUpdated} groups with discount values`);

        console.log('\n=== STEP 3: Link Clients to Groups (cli_descpro.xlsx) ===');

        // Add column if needed
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='cli_ind' AND column_name='cli_grupodesc'
        `);

        if (checkCol.rows.length === 0) {
            console.log('Adding cli_grupodesc column...');
            await pool.query(`
                ALTER TABLE cli_ind 
                ADD COLUMN cli_grupodesc INTEGER REFERENCES grupo_desc(gde_id)
            `);
        }

        const cliDescProPath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const cliDescProWb = XLSX.readFile(cliDescProPath);
        const cliDescProData = XLSX.utils.sheet_to_json(cliDescProWb.Sheets['Sheet1']);

        let linked = 0;
        let notFound = 0;

        for (const row of cliDescProData) {
            const { CLI_NOMRED, FOR_NOMERED, GRU_NOME } = row;
            if (!CLI_NOMRED || !FOR_NOMERED || !GRU_NOME) continue;

            // Find IDs
            const client = await pool.query('SELECT cli_codigo FROM clientes WHERE cli_nomred = $1', [CLI_NOMRED]);
            const supplier = await pool.query('SELECT for_codigo FROM fornecedores WHERE for_nomered = $1', [FOR_NOMERED]);
            const group = await pool.query('SELECT gde_id FROM grupo_desc WHERE gde_nome = $1', [GRU_NOME]);

            if (client.rows.length === 0 || supplier.rows.length === 0 || group.rows.length === 0) {
                console.log(`⚠️  Not found: ${CLI_NOMRED} + ${FOR_NOMERED} + ${GRU_NOME}`);
                notFound++;
                continue;
            }

            await pool.query(
                `UPDATE cli_ind 
                 SET cli_grupodesc = $1 
                 WHERE cli_codigo = $2 AND cli_forcodigo = $3`,
                [group.rows[0].gde_id, client.rows[0].cli_codigo, supplier.rows[0].for_codigo]
            );

            linked++;
            console.log(`✅ ${CLI_NOMRED} + ${FOR_NOMERED} → ${GRU_NOME}`);
        }

        console.log(`\n✅ MIGRATION COMPLETE`);
        console.log(`   Groups: ${groupsInserted}`);
        console.log(`   Values: ${valuesUpdated}`);
        console.log(`   Linked: ${linked}`);
        console.log(`   Not found: ${notFound}`);

        // Show sample
        const sample = await pool.query('SELECT * FROM grupo_desc LIMIT 5');
        console.log('\nSample data:');
        console.table(sample.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrateDiscountGroups();
