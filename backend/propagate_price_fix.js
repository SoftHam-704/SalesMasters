const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Lista de schemas para atualizar
const SCHEMAS_TO_UPDATE = ['public', 'repsoma', 'rimef', 'markpress', 'ndsrep', 'target'];

async function propagatePriceFix() {
    try {
        console.log('🚀 Iniciando propagação de correções de Tabelas de Preço...');

        // Caminhos dos scripts corrigidos
        const script10Path = path.join(__dirname, '..', 'scripts_bancodedados', '10_create_price_tables.sql');
        const script12Path = path.join(__dirname, '..', 'scripts_bancodedados', '12_create_price_procedures.sql');
        
        const sql10 = fs.readFileSync(script10Path, 'utf8');
        const sql12 = fs.readFileSync(script12Path, 'utf8');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Aplicando no schema: ${schema}...`);
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${schema}, public`);

                // 1. Tentar renomear a coluna caso ela exista com o nome errado
                // Isso evita erro se estivermos rodando em um banco que já tinha a tabela
                await client.query(`
                    DO $$ 
                    BEGIN 
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_schema = '${schema}' 
                            AND table_name = 'cad_tabelaspre' 
                            AND column_name = 'itab_datatbela'
                        ) THEN 
                            ALTER TABLE cad_tabelaspre RENAME COLUMN itab_datatbela TO itab_datatabela;
                            RAISE NOTICE 'Coluna itab_datatbela renomeada para itab_datatabela no schema ${schema}';
                        END IF;
                    END $$;
                `);

                // 2. Extrair e atualizar a função fn_upsert_preco especificamente (pois o script 10 completo falharia no CREATE TABLE)
                // Vamos buscar o bloco da função no script 10 ou simplesmente definir aqui
                const upsertPrecoSql = `
                CREATE OR REPLACE FUNCTION fn_upsert_preco(
                    p_pro_id INTEGER,
                    p_industria INTEGER,
                    p_tabela VARCHAR(20),
                    p_precobruto DOUBLE PRECISION,
                    p_precopromo DOUBLE PRECISION DEFAULT NULL,
                    p_precoespecial DOUBLE PRECISION DEFAULT NULL,
                    p_ipi DOUBLE PRECISION DEFAULT 0,
                    p_st DOUBLE PRECISION DEFAULT 0,
                    p_grupodesconto INTEGER DEFAULT NULL,
                    p_descontoadd DOUBLE PRECISION DEFAULT 0,
                    p_datatabela DATE DEFAULT CURRENT_DATE,
                    p_datavencimento DATE DEFAULT NULL,
                    p_prepeso DOUBLE PRECISION DEFAULT 0
                )
                RETURNS VOID
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    INSERT INTO cad_tabelaspre (
                        itab_idprod, itab_industria, itab_tabela, itab_precobruto, itab_precopromo,
                        itab_precoespecial, itab_ipi, itab_st, itab_grupodesconto, itab_descontoadd,
                        itab_datatabela, itab_datavencimento, itab_prepeso, itab_status
                    ) VALUES (
                        p_pro_id, p_industria, p_tabela, p_precobruto, p_precopromo,
                        p_precoespecial, p_ipi, p_st, p_grupodesconto, p_descontoadd,
                        p_datatabela, p_datavencimento, p_prepeso, true
                    )
                    ON CONFLICT (itab_idprod, itab_tabela) 
                    DO UPDATE SET
                        itab_precobruto = EXCLUDED.itab_precobruto,
                        itab_precopromo = EXCLUDED.itab_precopromo,
                        itab_precoespecial = EXCLUDED.itab_precoespecial,
                        itab_ipi = EXCLUDED.itab_ipi,
                        itab_st = EXCLUDED.itab_st,
                        itab_grupodesconto = EXCLUDED.itab_grupodesconto,
                        itab_descontoadd = EXCLUDED.itab_descontoadd,
                        itab_datatabela = EXCLUDED.itab_datatabela,
                        itab_datavencimento = EXCLUDED.itab_datavencimento,
                        itab_prepeso = EXCLUDED.itab_prepeso,
                        itab_status = EXCLUDED.itab_status;
                END;
                $$;`;

                await client.query(upsertPrecoSql);
                console.log(`🔹 Função fn_upsert_preco atualizada no schema ${schema}`);

                // 3. Atualizar as procedures de listagem (script 12)
                await client.query(sql12); 

                await client.query('COMMIT');
                console.log(`✅ Schema ${schema} atualizado com sucesso!`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Erro no schema ${schema}:`, err.message);
            } finally {
                client.release();
            }
        }

        console.log('\n✨ Propagação concluída!');
    } catch (err) {
        console.error('❌ Erro fatal:', err);
    } finally {
        await pool.end();
    }
}

propagatePriceFix();
