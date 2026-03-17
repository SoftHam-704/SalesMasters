const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 30000
});

async function auditFunctions() {
    try {
        console.log('🔍 Iniciando auditoria de funções duplicadas...\n');

        // 1. Listar todas as funções do schema PUBLIC (nossa referência)
        const publicFuncs = await pool.query(`
            SELECT p.proname, p.prosrc, pg_get_function_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
        `);

        console.log(`📚 Funções no Public (Base): ${publicFuncs.rows.length}`);

        // Mapa para facilitar verificação
        const publicMap = new Map();
        publicFuncs.rows.forEach(f => {
            // Chave única: nome + argumentos
            publicMap.set(`${f.proname}(${f.args})`, f.prosrc);
        });

        // 2. Listar schemas de clientes (excluindo sistemas)
        const schemas = await pool.query(`
            SELECT nspname FROM pg_namespace 
            WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'public') 
            AND nspname NOT LIKE 'pg_%'
        `);

        console.log(`🏢 Schemas de Tenants encontrados: ${schemas.rows.length}\n`);

        for (const schemaRow of schemas.rows) {
            const schema = schemaRow.nspname;
            let redundantes = 0;
            let customizadas = 0;
            const toDrop = [];

            // Buscar funções deste schema
            const tenantFuncs = await pool.query(`
                SELECT p.proname, p.prosrc, pg_get_function_arguments(p.oid) as args
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = $1
            `, [schema]);

            if (tenantFuncs.rows.length === 0) continue;

            console.log(`🔹 Schema: ${schema.toUpperCase()}`);

            for (const f of tenantFuncs.rows) {
                const key = `${f.proname}(${f.args})`;

                if (publicMap.has(key)) {
                    const publicSrc = publicMap.get(key);
                    // Comparação básica do código fonte
                    // (Remove espaços em branco para evitar falsos positivos de formatação)
                    const cleanPublic = publicSrc.replace(/\s+/g, '');
                    const cleanTenant = f.prosrc.replace(/\s+/g, '');

                    if (cleanPublic === cleanTenant) {
                        redundantes++;
                        toDrop.push(f.proname);
                    } else {
                        customizadas++;
                        console.log(`   ⚠️  PERSONALIZADA: ${f.proname} (diferente do Public)`);
                    }
                }
            }

            if (redundantes > 0) {
                console.log(`   ✅ Podem ser removidas: ${redundantes} funções (são idênticas ao Public e o search_path resolve)`);
                // Exibir comando SQL sugerido (comentado para segurança)
                // console.log(`   💡 SQL: DROP FUNCTION ${schema}.${toDrop[0]}(...);`);
            } else {
                console.log(`   ✨ Nenhuma função redundante encontrada.`);
            }
            console.log('---');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

auditFunctions();
