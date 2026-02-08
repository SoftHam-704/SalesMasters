
const { masterPool } = require('./utils/db');

async function check() {
    try {
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'empresas'
            ORDER BY ordinal_position
        `);
        console.log('Colunas de public.empresas (Master):');
        res.rows.forEach(row => console.log(` - ${row.column_name}: ${row.data_type}`));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await masterPool.end(); // Assuming masterPool has .end(), otherwise logic closes
        process.exit(0);
    }
}

check();
