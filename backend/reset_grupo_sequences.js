const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetSequences() {
    try {
        // Find sequence names
        const sequences = await pool.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_name LIKE '%grupo%' OR sequence_name LIKE '%gru_%'
        `);

        console.log('Found sequences:');
        console.table(sequences.rows);

        // Get max IDs
        const maxGrupoDesc = await pool.query('SELECT MAX(gde_id) as max FROM grupo_desc');
        const maxId = maxGrupoDesc.rows[0].max;

        console.log(`\nMax gde_id in grupo_desc: ${maxId}`);

        // Reset sequence (assuming it's gen_grupo_desc_id or similar)
        // We'll try common patterns
        const possibleSeqNames = [
            'gen_grupo_desc_id',
            'grupo_desc_gde_id_seq',
            'gen_gde_id'
        ];

        for (const seqName of possibleSeqNames) {
            try {
                await pool.query(`SELECT setval('${seqName}', ${maxId})`);
                console.log(`✅ Reset ${seqName} to ${maxId}`);
                break;
            } catch (e) {
                console.log(`⚠️  Sequence ${seqName} not found`);
            }
        }

        // Test next value
        console.log('\nTesting sequences...');
        for (const seqName of possibleSeqNames) {
            try {
                const next = await pool.query(`SELECT nextval('${seqName}')`);
                console.log(`Next value for ${seqName}: ${next.rows[0].nextval}`);
            } catch (e) {
                // Ignore
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetSequences();
