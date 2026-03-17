const { masterPool, getTenantPool } = require('./utils/db');

const MIGRATION_SQL = `
-- 1) Global trigger function (schema-independent)
CREATE OR REPLACE FUNCTION update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Loop ALL schemas
DO $$
DECLARE
    schema_rec RECORD;
    v_schema TEXT;
BEGIN
    FOR schema_rec IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          AND schema_name NOT LIKE 'pg_temp%'
          AND schema_name NOT LIKE 'pg_toast%'
    LOOP
        v_schema := schema_rec.schema_name;
        
        -- Table
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.crm_followups (
                id              SERIAL PRIMARY KEY,
                ven_codigo      INTEGER NOT NULL,
                cli_codigo      INTEGER,
                interacao_id    INTEGER,
                oportunidade_id INTEGER,
                titulo          VARCHAR(255) NOT NULL,
                descricao       TEXT,
                data_prevista   DATE NOT NULL,
                data_conclusao  DATE,
                status          VARCHAR(20) NOT NULL DEFAULT ''pendente'',
                prioridade      VARCHAR(10) NOT NULL DEFAULT ''media'',
                tipo            VARCHAR(30) DEFAULT ''outro'',
                created_at      TIMESTAMP DEFAULT NOW(),
                updated_at      TIMESTAMP DEFAULT NOW(),
                CONSTRAINT chk_followup_status CHECK (status IN (''pendente'',''concluido'',''cancelado'')),
                CONSTRAINT chk_followup_prioridade CHECK (prioridade IN (''alta'',''media'',''baixa'')),
                CONSTRAINT chk_followup_tipo CHECK (tipo IN (''ligacao'',''visita'',''email'',''whatsapp'',''proposta'',''reuniao'',''outro''))
            )', v_schema);

        -- Indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_followups_ven ON %I.crm_followups(ven_codigo)', v_schema, v_schema);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_followups_cli ON %I.crm_followups(cli_codigo)', v_schema, v_schema);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_followups_status ON %I.crm_followups(status)', v_schema, v_schema);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_followups_data ON %I.crm_followups(data_prevista)', v_schema, v_schema);

        -- Trigger
        EXECUTE format('DROP TRIGGER IF EXISTS trg_followup_updated_at ON %I.crm_followups', v_schema);
        EXECUTE format('CREATE TRIGGER trg_followup_updated_at BEFORE UPDATE ON %I.crm_followups FOR EACH ROW EXECUTE FUNCTION update_followup_updated_at()', v_schema);
    END LOOP;
END $$;
`;

async function migrate() {
    try {
        console.log('🚀 Buscando empresas no Master DB para migração...');
        const res = await masterPool.query(`
            SELECT cnpj, razao_social, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta 
            FROM empresas 
            WHERE status = 'ATIVO'
        `);

        console.log(`📊 Encontradas ${res.rows.length} empresas ativas.`);

        for (const emp of res.rows) {
            console.log(`\n⚙️ Migrando empresa: ${emp.razao_social} (${emp.cnpj})`);
            
            const dbConfig = {
                host: emp.db_host,
                database: emp.db_nome,
                schema: emp.db_schema || 'public',
                user: emp.db_usuario,
                password: emp.db_senha || '',
                port: emp.db_porta || 5432
            };

            try {
                const pool = getTenantPool(emp.cnpj, dbConfig);
                await pool.query(MIGRATION_SQL);
                console.log(`✅ [${emp.cnpj}] Tabela crm_followups sincronizada com sucesso.`);
            } catch (err) {
                console.error(`❌ [${emp.cnpj}] Erro ao migrar:`, err.message);
            }
        }

        console.log('\n✨ Migração concluída em todos os tenants.');
        process.exit(0);
    } catch (err) {
        console.error('💥 Erro crítico na migração:', err);
        process.exit(1);
    }
}

migrate();
