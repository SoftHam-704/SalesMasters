
const { masterPool, getTenantPool } = require('./utils/db');

async function check() {
    try {
        const resEmp = await masterPool.query("SELECT cnpj, db_host, db_nome, db_schema, db_usuario, db_senha FROM empresas WHERE cnpj = '40778122000128' LIMIT 1");
        if (resEmp.rows.length === 0) {
            console.log("Tenant not found");
            return;
        }
        const emp = resEmp.rows[0];
        const pool = getTenantPool(emp.cnpj, {
            host: emp.db_host,
            database: emp.db_nome,
            schema: emp.db_schema || 'public',
            user: emp.db_usuario,
            password: emp.db_senha
        });

        const resProd = await pool.query(`
            SELECT pro_codprod, pro_nome, pro_codigonormalizado, pro_industria
            FROM cad_prod 
            WHERE pro_industria = 3
            LIMIT 10
        `);
        console.log("Products for Industry 3:");
        console.table(resProd.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
