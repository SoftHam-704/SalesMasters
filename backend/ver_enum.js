const { Pool } = require('pg');

const masterConfig = {
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 5432,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 5000
};

const masterPool = new Pool(masterConfig);

async function checkEnum() {
    try {
        console.log('🔍 Buscando credenciais do tenant 18987717000134...');

        // 1. Buscar credenciais do tenant no Master
        const res = await masterPool.query(`
            SELECT db_host, db_nome, db_schema, db_usuario, db_senha, db_porta 
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = '18987717000134'
        `);

        if (res.rows.length === 0) {
            console.error('❌ Tenant não encontrado no Master.');
            return;
        }

        const emp = res.rows[0];
        console.log(`✅ Credenciais achadas! Host: ${emp.db_host}, Schema: ${emp.db_schema}`);

        // 2. Conectar no Tenant
        const tenantPool = new Pool({
            host: emp.db_host, // Pode ser o mesmo do master
            port: emp.db_porta || 5432,
            database: emp.db_nome,
            user: emp.db_usuario,
            password: emp.db_senha,
            connectionTimeoutMillis: 5000
        });

        const schema = emp.db_schema || 'public';

        console.log(`\n🕵️ Verificando ENUM wpp_conversa_estado no schema ${schema}...`);

        // 3. Ler ENUM
        try {
            const enumVals = await tenantPool.query(`
                SELECT unnest(enum_range(NULL::${schema}.wpp_conversa_estado)) as valor
            `);
            console.log(`✅ ENUM VALORES:`, enumVals.rows.map(r => r.valor));
        } catch (e) {
            console.error(`❌ Erro ao ler ENUM: ${e.message}`);
            // Tenta Check Constraints como fallback
            const checks = await tenantPool.query(`
                SELECT check_clause 
                FROM information_schema.check_constraints cc
                JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
                WHERE tc.table_schema = $1 AND tc.table_name = 'wpp_conversa'
            `, [schema]);
            if (checks.rows.length > 0) console.log('✅ CHECK CONSTRAINTS:', checks.rows.map(r => r.check_clause));
        }

        await tenantPool.end();

    } catch (err) {
        console.error('❌ Erro Fatal:', err.message);
    } finally {
        await masterPool.end();
    }
}

checkEnum();
