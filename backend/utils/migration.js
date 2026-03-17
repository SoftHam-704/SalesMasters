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

/**
 * Garante que a tabela crm_followups existe no pool atual.
 * @param {Object} pool Pool de conexão (node-postgres)
 */
async function ensureCrmFollowupsTable(pool) {
    try {
        console.log('🚀 [MIGRATION] Verificando/Criando tabela crm_followups...');
        await pool.query(MIGRATION_SQL);
        console.log('✅ [MIGRATION] Sincronização concluída com sucesso.');
        return true;
    } catch (err) {
        console.error('❌ [MIGRATION] Erro ao sincronizar tabela:', err.message);
        return false;
    }
}

module.exports = {
    ensureCrmFollowupsTable
};
