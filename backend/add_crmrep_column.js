const { masterPool } = require('./utils/db');

async function addCrmRepColumn() {
    try {
        console.log('Adding "modulo_crmrep_ativo" column to "empresas" table in Master DB...');
        await masterPool.query(`
            ALTER TABLE empresas 
            ADD COLUMN IF NOT EXISTS modulo_crmrep_ativo BOOLEAN DEFAULT false;
        `);
        console.log('✅ Column "modulo_crmrep_ativo" added successfully!');

        // Verifying
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' AND column_name = 'modulo_crmrep_ativo'
        `);

        if (res.rows.length > 0) {
            console.log('Verification: Column exists with type:', res.rows[0].data_type);
        } else {
            console.log('Verification: Column NOT found after ALTER!');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ FAILED to add column:', err.message);
        process.exit(1);
    }
}

addCrmRepColumn();
