const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrateRegions() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Creating Tables ---');
        // Drop tables to ensure clean slate (safe here as we are importing from source of truth)
        await client.query('DROP TABLE IF EXISTS cidades_regioes CASCADE');
        await client.query('DROP TABLE IF EXISTS regioes CASCADE');

        // Create regioes table
        await client.query(`
            CREATE TABLE regioes (
                reg_codigo SERIAL PRIMARY KEY,
                reg_descricao VARCHAR(255) NOT NULL
            );
        `);

        // Create cidades_regioes table
        // Composite PK ensures one region per city if uniqueness is desired, 
        // but here (reg_id, cid_id) just prevents duplicates.
        // Assuming strict referential integrity.
        await client.query(`
            CREATE TABLE IF NOT EXISTS cidades_regioes (
                reg_id INTEGER REFERENCES regioes(reg_codigo) ON DELETE CASCADE,
                cid_id INTEGER REFERENCES cidades(cid_codigo) ON DELETE CASCADE,
                PRIMARY KEY (reg_id, cid_id)
            );
        `);
        console.log('Tables created successfully.');

        console.log('\n--- Importing Regioes ---');
        const regioesPath = path.join(__dirname, '../data/regioes.xlsx');
        const regWorkbook = xlsx.readFile(regioesPath);
        const regData = xlsx.utils.sheet_to_json(regWorkbook.Sheets[regWorkbook.SheetNames[0]]);

        for (const row of regData) {
            // Upsert region
            await client.query(`
                INSERT INTO regioes (reg_codigo, reg_descricao)
                VALUES ($1, $2)
                ON CONFLICT (reg_codigo) DO UPDATE SET
                    reg_descricao = EXCLUDED.reg_descricao
            `, [row.REG_CODIGO, row.REG_DESCRICAO]);
        }
        console.log(`Imported ${regData.length} regions.`);

        console.log('\n--- Importing Cidades Regioes ---');
        const linkPath = path.join(__dirname, '../data/cidades_regioes.xlsx');
        const linkWorkbook = xlsx.readFile(linkPath);
        const linkData = xlsx.utils.sheet_to_json(linkWorkbook.Sheets[linkWorkbook.SheetNames[0]]);

        const CHUNK_SIZE = 1000;
        let processed = 0;

        for (const row of linkData) {
            // Assuming REG_ID matches reg_codigo and CID_ID matches cid_codigo
            // We use simple INSERT ON CONFLICT DO NOTHING to restartability
            // Safely insert only if city exists (to avoid FK errors)
            await client.query(`
                INSERT INTO cidades_regioes (reg_id, cid_id)
                SELECT $1, $2
                WHERE EXISTS (SELECT 1 FROM cidades WHERE cid_codigo = $2)
                ON CONFLICT (reg_id, cid_id) DO NOTHING
            `, [row.REG_ID, row.CID_ID]);
            processed++;
            if (processed % CHUNK_SIZE === 0) console.log(`Processed ${processed} links...`);
        }
        console.log(`Imported ${processed} city-region links.`);

        await client.query('COMMIT');
        console.log('\nMigration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrateRegions();
