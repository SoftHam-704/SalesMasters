const { masterPool } = require('./utils/db');

async function listSchemas() {
    try {
        const res = await masterPool.query("SELECT cnpj, db_schema, nome_fantasia FROM empresas WHERE status = 'ATIVO'");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
listSchemas();
