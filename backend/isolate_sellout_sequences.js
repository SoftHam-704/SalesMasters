const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function isolateSequences() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Isolating Sequences for crm_sellout ---');

        const schemasRes = await pool.query(`
            SELECT table_schema 
            FROM information_schema.tables 
            WHERE table_name = 'crm_sellout'
        `);
        const schemas = schemasRes.rows.map(r => r.table_schema);

        for (const schema of schemas) {
            console.log(`Processing schema: [${schema}]`);

            // 1. Create local sequence if it doesn't exist
            await pool.query(`CREATE SEQUENCE IF NOT EXISTS ${schema}.crm_sellout_id_seq`);

            // 2. Point table to this local sequence
            await pool.query(`
                ALTER TABLE ${schema}.crm_sellout 
                ALTER COLUMN id SET DEFAULT nextval('${schema}.crm_sellout_id_seq'::regclass)
            `);

            // 3. Sync it to MAX(id) + 1
            const maxRes = await pool.query(`SELECT MAX(id) as m FROM ${schema}.crm_sellout`);
            const maxVal = parseInt(maxRes.rows[0].m) || 0;
            await pool.query(`SELECT setval('${schema}.crm_sellout_id_seq', $1)`, [maxVal + 1]);

            console.log(`  ✅ Isolated and synced to ${maxVal + 1}`);
        }

        console.log('\n✅ All schemas isolated.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

isolateSequences();
