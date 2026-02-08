const { masterPool } = require('./utils/db');

async function inspectEmpresasTable() {
    try {
        console.log('Inspecting columns of "empresas" table in Master DB...');
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'empresas'
        `);
        console.log('Columns found:', res.rows.map(r => r.column_name));
        process.exit(0);
    } catch (err) {
        console.error('FAILED to inspect table:', err.message);
        process.exit(1);
    }
}

inspectEmpresasTable();
