const { masterPool } = require('./utils/db');
async function check() {
    try {
        const res = await masterPool.query("SELECT db_schema FROM empresas WHERE cnpj = '99999999000199'");
        console.log('✅ SCHEMA ATUAL:', res.rows[0].db_schema);
    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
check();
