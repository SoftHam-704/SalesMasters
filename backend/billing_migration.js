/**
 * billing_migration.js
 * Cria a tabela FATURA_PED em todos os schemas tenant do SalesMasters.
 * Execução: node billing_migration.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST,
    port: process.env.MASTER_DB_PORT || process.env.DB_PORT || 5432,
    database: process.env.MASTER_DB_NAME || process.env.DB_NAME,
    user: process.env.MASTER_DB_USER || process.env.DB_USER,
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const FATURA_PED_SQL = (schema) => `
    -- Generator para FATURA_PED
    CREATE SEQUENCE IF NOT EXISTS ${schema}.gen_fatura_ped_id START 1 INCREMENT 1;

    -- Tabela de faturamento de pedidos
    CREATE TABLE IF NOT EXISTS ${schema}.fatura_ped (
        fat_lancto    INTEGER NOT NULL DEFAULT nextval('${schema}.gen_fatura_ped_id'),
        fat_pedido    VARCHAR(10) NOT NULL,
        fat_datafat   TIMESTAMP,
        fat_valorfat  DOUBLE PRECISION,
        fat_nf        VARCHAR(10),
        fat_obs       VARCHAR(100),
        fat_percent   NUMERIC(5,2),
        fat_comissao  NUMERIC(9,2),
        fat_industria INTEGER NOT NULL,
        fat_percomissind CHAR(1),
        gid           VARCHAR(38)
    );

    -- Primary Key
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pk_fatura_ped_${schema.replace('.', '_')}'
        ) THEN
            ALTER TABLE ${schema}.fatura_ped
                ADD CONSTRAINT pk_fatura_ped_${schema.replace('.', '_')}
                PRIMARY KEY (fat_pedido, fat_industria, fat_lancto);
        END IF;
    END$$;

    -- Indices
    CREATE INDEX IF NOT EXISTS fatura_ped_idx1_${schema.replace('.', '_')}
        ON ${schema}.fatura_ped (fat_pedido);

    CREATE INDEX IF NOT EXISTS fatura_ped_idx2_${schema.replace('.', '_')}
        ON ${schema}.fatura_ped (gid);
`;

async function getSchemas() {
    const result = await masterPool.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'master')
          AND schema_name NOT LIKE 'pg_%'
        ORDER BY schema_name
    `);
    return result.rows.map(r => r.schema_name);
}

async function runMigration() {
    console.log('🚀 Iniciando migração: Tabela FATURA_PED\n');

    let schemas;
    try {
        schemas = await getSchemas();
        console.log(`📋 Schemas encontrados: ${schemas.join(', ')}\n`);
    } catch (err) {
        console.error('❌ Erro ao listar schemas:', err.message);
        process.exit(1);
    }

    const results = { ok: [], failed: [] };

    for (const schema of schemas) {
        try {
            const sql = FATURA_PED_SQL(schema);
            await masterPool.query(sql);
            console.log(`  ✅ ${schema} — OK`);
            results.ok.push(schema);
        } catch (err) {
            console.error(`  ❌ ${schema} — ERRO: ${err.message}`);
            results.failed.push({ schema, error: err.message });
        }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`  ✅ Sucesso: ${results.ok.length} schemas`);
    console.log(`  ❌ Erros:   ${results.failed.length} schemas`);

    if (results.failed.length > 0) {
        console.log('\n❌ Schemas com erro:');
        results.failed.forEach(f => console.log(`  - ${f.schema}: ${f.error}`));
    }

    await masterPool.end();
    console.log('\n✅ Migração concluída.');
}

runMigration().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
