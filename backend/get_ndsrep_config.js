const { Pool } = require('pg');

async function getTenantConfig() {
    const masterPool = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'salesmasters_master',
        user: 'webadmin',
        password: 'ytAyO0u043',
    });

    try {
        console.log('--- Fetching ndsrep configuration ---');
        const res = await masterPool.query("SELECT * FROM empresas WHERE db_schema = 'ndsrep'");
        if (res.rows.length === 0) {
            console.log('No enterprise found with schema ndsrep.');
            // Try searching by name if schema name is different
            const res2 = await masterPool.query("SELECT * FROM empresas WHERE razao_social ILIKE '%nds%' OR nome_fantasia ILIKE '%nds%'");
            if (res2.rows.length > 0) {
                console.log('Found potential candidates:');
                console.table(res2.rows.map(r => ({ id: r.id, cnpj: r.cnpj, schema: r.db_schema, name: r.razao_social })));
            }
            return;
        }

        const tenant = res.rows[0];
        console.log('✅ Found NDSREP config:');
        console.log(JSON.stringify(tenant, null, 2));

        // Now try connecting to the tenant DB
        console.log(`\n--- Connecting to Tenant DB: ${tenant.db_schema} ---`);
        const tenantPool = new Pool({
            host: tenant.db_host,
            port: tenant.db_porta || 5432,
            database: tenant.db_nome,
            user: tenant.db_usuario,
            password: tenant.db_senha,
            options: tenant.db_schema && tenant.db_schema !== 'public'
                ? `-c search_path=${tenant.db_schema},public`
                : undefined
        });

        const test = await tenantPool.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = $1', [tenant.db_schema]);
        console.log('Tables in ndsrep:');
        console.table(test.rows);

        // Get industries mapping
        const industries = await tenantPool.query("SELECT for_codigo, for_nomered FROM fornecedores ORDER BY for_nomered");
        console.log('Industries Mapping:');
        console.table(industries.rows);

        await tenantPool.end();

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await masterPool.end();
    }
}

getTenantConfig();
