const { masterPool } = require('./utils/db');
async function check() {
    try {
        const res = await masterPool.query("SELECT cnpj, db_schema, ramoatv FROM empresas WHERE cnpj = '99999999000199'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
check();
