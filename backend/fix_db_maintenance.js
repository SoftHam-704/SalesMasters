require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: process.env.DB_PASSWORD, // Carregando do .env
    ssl: false
});

async function runFix() {
    try {
        console.log("🚀 Iniciando manutenção corretiva do banco de dados...");

        // 1. Normalizar códigos existentes que podem estar nulos ou desatualizados
        console.log("📦 Sincronizando códigos normalizados...");
        await pool.query(`
            UPDATE cad_prod 
            SET pro_codigonormalizado = fn_normalizar_codigo(pro_codprod)
            WHERE pro_codigonormalizado IS NULL OR pro_codigonormalizado != fn_normalizar_codigo(pro_codprod);
        `);
        console.log("✅ Códigos normalizados sincronizados.");

        // 2. Sincronizar Sequências (Resolve o erro cad_prod_pkey)
        console.log("🔄 Sincronizando sequências de IDs...");
        await pool.query(`
            SELECT setval('public.gen_cad_prod_id', COALESCE((SELECT MAX(pro_id) FROM cad_prod), 0) + 1, false);
        `);
        // Adicionar outras sequências críticas se necessário
        await pool.query(`
            SELECT setval('public.categoria_prod_cat_id_seq', COALESCE((SELECT MAX(cat_id) FROM categoria_prod), 0) + 1, false);
        `);
        console.log("✅ Sequências sincronizadas.");

        // 3. Atualizar a função fn_upsert_produto para ser atômica e usar ON CONFLICT
        // Isso é muito mais seguro contra erros de duplicidade
        console.log("🛠️ Atualizando lógica de UPSERT (fn_upsert_produto)...");
        await pool.query(`
            CREATE OR REPLACE FUNCTION fn_upsert_produto(
                p_industria INTEGER,
                p_codprod VARCHAR(25),
                p_nome VARCHAR(100),
                p_peso DOUBLE PRECISION DEFAULT NULL,
                p_embalagem INTEGER DEFAULT NULL,
                p_grupo INTEGER DEFAULT NULL,
                p_setor VARCHAR(30) DEFAULT NULL,
                p_linha VARCHAR(50) DEFAULT NULL,
                p_ncm VARCHAR(10) DEFAULT NULL,
                p_origem CHAR(1) DEFAULT NULL,
                p_aplicacao VARCHAR(300) DEFAULT NULL,
                p_codbarras VARCHAR(13) DEFAULT NULL
            )
            RETURNS INTEGER
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_pro_id INTEGER;
                v_codigo_normalizado VARCHAR(50);
            BEGIN
                v_codigo_normalizado := fn_normalizar_codigo(p_codprod);
                
                -- Tenta atualizar primeiro
                UPDATE cad_prod SET
                    pro_nome = COALESCE(p_nome, pro_nome),
                    pro_peso = COALESCE(p_peso, pro_peso),
                    pro_embalagem = COALESCE(p_embalagem, pro_embalagem),
                    pro_grupo = COALESCE(p_grupo, pro_grupo),
                    pro_setor = COALESCE(p_setor, pro_setor),
                    pro_linha = COALESCE(p_linha, pro_linha),
                    pro_ncm = COALESCE(p_ncm, pro_ncm),
                    pro_origem = COALESCE(p_origem, pro_origem),
                    pro_aplicacao = COALESCE(p_aplicacao, pro_aplicacao),
                    pro_codbarras = COALESCE(p_codbarras, pro_codbarras),
                    pro_codprod = p_codprod
                WHERE pro_industria = p_industria 
                  AND pro_codigonormalizado = v_codigo_normalizado
                RETURNING pro_id INTO v_pro_id;

                -- Se não existia, insere
                IF v_pro_id IS NULL THEN
                    INSERT INTO cad_prod (
                        pro_industria, pro_codprod, pro_codigonormalizado, pro_codigooriginal,
                        pro_nome, pro_peso, pro_embalagem, pro_grupo, pro_setor,
                        pro_linha, pro_ncm, pro_origem, pro_aplicacao, pro_codbarras, pro_status
                    ) VALUES (
                        p_industria, p_codprod, v_codigo_normalizado, p_codprod,
                        p_nome, p_peso, p_embalagem, p_grupo, p_setor,
                        p_linha, p_ncm, p_origem, p_aplicacao, p_codbarras, true
                    )
                    RETURNING pro_id INTO v_pro_id;
                END IF;

                RETURN v_pro_id;
            EXCEPTION WHEN unique_violation THEN
                -- Se cair aqui por race condition, tenta o SELECT uma última vez
                SELECT pro_id INTO v_pro_id
                FROM cad_prod
                WHERE pro_industria = p_industria 
                  AND pro_codigonormalizado = v_codigo_normalizado;
                RETURN v_pro_id;
            END;
            $$;
        `);
        console.log("✅ Função fn_upsert_produto atualizada com proteção contra concorrência.");

        console.log("✨ Manutenção concluída com sucesso!");
    } catch (err) {
        console.error("❌ Erro durante a manutenção:", err);
    } finally {
        await pool.end();
    }
}

runFix();
