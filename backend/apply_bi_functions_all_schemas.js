const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
        ssl: false
    });

    await client.connect();
    console.log('Connected!');

    // ======= PART 1: Create fn_curva_abc in schemas that need it =======
    const needFunctions = ['ro_consult', 'repsoma', 'target', 'public', 'markpress', 'rimef', 'eticarep', 'rmvcrep', 'repwill', 'repmoraes', 'garrarep', 'brasil_wl', 'ndsrep', 'remap'];

    for (const schema of needFunctions) {
        try {
            // Check if cad_prod exists
            const check = await client.query(`SELECT 1 FROM pg_tables WHERE schemaname=$1 AND tablename='cad_prod'`, [schema]);
            if (check.rows.length === 0) {
                console.log(`⏭️  ${schema}: no cad_prod, skip`);
                continue;
            }

            await client.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_curva_abc(
                    p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
                    p_meses TEXT DEFAULT 'todos',
                    p_industria TEXT DEFAULT 'todos',
                    p_clientes TEXT DEFAULT 'todos',
                    p_metrica TEXT DEFAULT 'valor'
                )
                RETURNS TABLE (
                    produto_id INTEGER, produto_nome VARCHAR, total NUMERIC,
                    qtd_clientes INTEGER, percentual NUMERIC, percentual_acum NUMERIC,
                    curva CHAR(1), ranking INTEGER
                ) AS $$
                BEGIN
                    RETURN QUERY
                    WITH produto_totais AS (
                        SELECT 
                            i.ite_idproduto as ite_produto, pr.pro_nome,
                            CASE 
                                WHEN p_metrica = 'quantidade' THEN SUM(i.ite_quant)
                                WHEN p_metrica = 'unidades' THEN COUNT(DISTINCT i.ite_pedido)
                                ELSE SUM(i.ite_totliquido)
                            END as total_calc,
                            COUNT(DISTINCT p.ped_cliente) as clientes
                        FROM ${schema}.itens_ped i
                        INNER JOIN ${schema}.pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        INNER JOIN ${schema}.cad_prod pr ON i.ite_idproduto = pr.pro_id
                        WHERE p.ped_data >= make_date(p_ano, 1, 1) AND p.ped_data <= make_date(p_ano, 12, 31)
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_meses = 'todos' OR EXTRACT(MONTH FROM p.ped_data)::TEXT = ANY(string_to_array(p_meses, ',')))
                          AND (p_industria = 'todos' OR p.ped_industria::TEXT = p_industria)
                          AND (p_clientes = 'todos' OR p.ped_cliente::TEXT = ANY(string_to_array(p_clientes, ',')))
                        GROUP BY i.ite_idproduto, pr.pro_nome
                    ),
                    produto_acumulado AS (
                        SELECT ite_produto, pro_nome, total_calc, clientes,
                            SUM(total_calc) OVER () as total_geral,
                            SUM(total_calc) OVER (ORDER BY total_calc DESC) as acumulado,
                            ROW_NUMBER() OVER (ORDER BY total_calc DESC) as rank_num
                        FROM produto_totais
                    )
                    SELECT 
                        ite_produto::INTEGER, pro_nome::VARCHAR,
                        ROUND(total_calc::NUMERIC, 2), clientes::INTEGER,
                        ROUND((total_calc / total_geral * 100)::NUMERIC, 2),
                        ROUND((acumulado / total_geral * 100)::NUMERIC, 2),
                        CASE 
                            WHEN acumulado / total_geral <= 0.80 THEN 'A'
                            WHEN acumulado / total_geral <= 0.95 THEN 'B'
                            ELSE 'C'
                        END::CHAR(1),
                        rank_num::INTEGER
                    FROM produto_acumulado
                    ORDER BY total_calc DESC;
                END;
                $$ LANGUAGE plpgsql;
            `);

            await client.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_analise_curva_abc(
                    p_ano INTEGER, p_mes INTEGER DEFAULT NULL, p_industria INTEGER DEFAULT NULL
                )
                RETURNS TABLE (
                    curva_abc TEXT, qtd_itens BIGINT, valor_total NUMERIC, perc_valor NUMERIC
                ) AS $$
                BEGIN
                    RETURN QUERY
                    WITH vendas AS (
                        SELECT i.ite_idproduto, SUM(i.ite_totliquido) as val
                        FROM ${schema}.itens_ped i
                        INNER JOIN ${schema}.pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        WHERE p.ped_data >= make_date(p_ano, COALESCE(p_mes, 1), 1)
                          AND p.ped_data <= CASE WHEN p_mes IS NOT NULL 
                              THEN (make_date(p_ano, p_mes, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
                              ELSE make_date(p_ano, 12, 31) END
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_industria IS NULL OR p.ped_industria = p_industria)
                        GROUP BY i.ite_idproduto
                    ),
                    total AS (SELECT SUM(val) as grand_total FROM vendas),
                    ranked AS (
                        SELECT v.ite_idproduto, v.val,
                            SUM(v.val) OVER (ORDER BY v.val DESC) / NULLIF(t.grand_total, 0) as pct_acum
                        FROM vendas v, total t
                    ),
                    classified AS (
                        SELECT CASE
                            WHEN pct_acum <= 0.80 THEN 'A'
                            WHEN pct_acum <= 0.95 THEN 'B'
                            ELSE 'C'
                        END as abc, val
                        FROM ranked
                    )
                    SELECT abc::TEXT, COUNT(*)::BIGINT, SUM(val)::NUMERIC,
                        ROUND((SUM(val) / NULLIF((SELECT grand_total FROM total), 0) * 100)::NUMERIC, 2)
                    FROM classified
                    GROUP BY abc;
                END;
                $$ LANGUAGE plpgsql;
            `);

            console.log(`✅ ${schema}: fn_curva_abc + fn_analise_curva_abc`);
        } catch (err) {
            console.log(`❌ ${schema}: ${err.message.substring(0, 100)}`);
        }
    }

    // ======= PART 2: Create views in schemas that need them =======
    const needViews = ['barrosrep', 'repseven'];

    for (const schema of needViews) {
        try {
            // vw_metricas_cliente
            await client.query(`
                CREATE OR REPLACE VIEW ${schema}.vw_metricas_cliente AS
                SELECT 
                    p.ped_cliente AS cliente_id,
                    c.cli_nomred AS cliente_nome,
                    p.ped_industria AS industry_id,
                    CURRENT_DATE - max(p.ped_data) AS dias_sem_compra,
                    sum(p.ped_totliq) AS valor_total,
                    count(p.ped_numero) AS total_pedidos,
                    avg(p.ped_totliq) AS ticket_medio
                FROM ${schema}.pedidos p
                JOIN ${schema}.clientes c ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_situacao IN ('P', 'F')
                GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria
            `);
            console.log(`✅ ${schema}.vw_metricas_cliente`);

            // vw_performance_mensal  
            await client.query(`
                CREATE OR REPLACE VIEW ${schema}.vw_performance_mensal AS
                SELECT 
                    EXTRACT(year FROM ped_data) AS ano,
                    EXTRACT(month FROM ped_data) AS mes,
                    ped_industria AS industry_id,
                    ped_cliente AS cliente_id,
                    MAX(c.cli_nomred) AS cliente_nome,
                    sum(ped_totliq) AS valor_total,
                    count(DISTINCT ped_numero) AS qtd_pedidos,
                    count(DISTINCT ped_cliente) AS clientes_ativos,
                    avg(ped_totliq) AS ticket_medio
                FROM ${schema}.pedidos p
                LEFT JOIN ${schema}.clientes c ON p.ped_cliente = c.cli_codigo
                WHERE ped_situacao IN ('P', 'F')
                GROUP BY EXTRACT(year FROM ped_data), EXTRACT(month FROM ped_data), ped_industria, ped_cliente, c.cli_nomred
            `);
            console.log(`✅ ${schema}.vw_performance_mensal`);

            // vw_produtos_precos
            await client.query(`
                CREATE OR REPLACE VIEW ${schema}.vw_produtos_precos AS
                SELECT 
                    p.pro_id, p.pro_industria,
                    COALESCE(f.for_nomered, 'Indústria ' || p.pro_industria) AS industria_nome,
                    p.pro_codprod, p.pro_codigonormalizado, p.pro_nome,
                    p.pro_grupo, p.pro_ncm,
                    t.itab_tabela, t.itab_precobruto, t.itab_precopromo,
                    t.itab_precoespecial, t.itab_ipi, t.itab_st,
                    t.itab_grupodesconto, t.itab_datatabela, t.itab_datavencimento,
                    COALESCE(t.itab_status, true) AS itab_status
                FROM ${schema}.cad_prod p
                LEFT JOIN ${schema}.fornecedores f ON p.pro_industria = f.for_codigo
                LEFT JOIN ${schema}.itens_tab t ON p.pro_id = t.itab_produto
            `);
            console.log(`✅ ${schema}.vw_produtos_precos`);
        } catch (err) {
            console.log(`❌ ${schema} views: ${err.message.substring(0, 150)}`);
        }
    }

    // ======= PART 3: Quick test =======
    console.log('\n--- TESTS ---');
    try {
        await client.query(`SET search_path TO ro_consult`);
        const r = await client.query(`SELECT count(*) FROM fn_curva_abc(2025, 'todos', 'todos', 'todos', 'valor')`);
        console.log(`ro_consult.fn_curva_abc: ${r.rows[0].count} products`);
    } catch (e) {
        console.log(`TEST fn_curva_abc: ${e.message.substring(0, 100)}`);
    }

    await client.end();
    console.log('\nDone!');
}

main().catch(e => console.error('FATAL:', e));
