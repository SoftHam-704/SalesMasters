const { Pool } = require('pg');

async function createAnalysisFunction() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'basesales',
        user: 'postgres',
        password: '@12Pilabo',
    });

    const sql = `
        CREATE OR REPLACE FUNCTION fn_analise_curva_abc(
            p_ano INTEGER,
            p_mes INTEGER DEFAULT NULL,
            p_industria INTEGER DEFAULT NULL
        )
        RETURNS TABLE (
            curva_abc VARCHAR,
            qtd_itens BIGINT,
            valor_total NUMERIC,
            percentual_itens NUMERIC,
            percentual_faturamento NUMERIC
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH vendas_produto AS (
                SELECT 
                    i.ite_idproduto as pro_id,
                    SUM(i.ite_totliquido) as valor_total_produto
                FROM itens_ped i
                INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
                WHERE ped.ped_situacao IN ('P', 'F')
                    AND (p_industria IS NULL OR ped.ped_industria = p_industria)
                    AND EXTRACT(YEAR FROM ped.ped_data) = p_ano
                    AND (p_mes IS NULL OR EXTRACT(MONTH FROM ped.ped_data) = p_mes)
                GROUP BY i.ite_idproduto
            ),
            todos_produtos AS (
                SELECT 
                    p.pro_id,
                    COALESCE(vp.valor_total_produto, 0) as valor_total_produto,
                    COALESCE((SELECT MAX(ped_data) FROM pedidos p2 INNER JOIN itens_ped i2 ON p2.ped_pedido = i2.ite_pedido WHERE i2.ite_idproduto = p.pro_id), '2000-01-01') as ultima_venda
                FROM cad_prod p
                LEFT JOIN vendas_produto vp ON p.pro_id = vp.pro_id
                WHERE (p_industria IS NULL OR p.pro_industria = p_industria)
            ),
            total_geral AS (
                SELECT 
                    SUM(valor_total_produto) as total_vendas,
                    COUNT(*) as total_produtos
                FROM todos_produtos
            ),
            produtos_percentual AS (
                SELECT 
                    tp.*,
                    tg.total_vendas,
                    tg.total_produtos,
                    SUM(tp.valor_total_produto) OVER (
                        ORDER BY tp.valor_total_produto DESC 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) / NULLIF(tg.total_vendas, 0) * 100 as percentual_acumulado
                FROM todos_produtos tp
                CROSS JOIN total_geral tg
            ),
            produtos_classificados AS (
                SELECT 
                    pp.pro_id,
                    pp.valor_total_produto,
                    pp.total_produtos,
                    pp.total_vendas,
                    CASE
                        WHEN CURRENT_DATE - pp.ultima_venda > 120 OR pp.valor_total_produto = 0 
                        THEN 'OFF'
                        WHEN pp.percentual_acumulado <= 75 
                        THEN 'A'
                        WHEN pp.percentual_acumulado <= 90 
                        THEN 'B'
                        ELSE 'C'
                    END as curva
                FROM produtos_percentual pp
            )
            SELECT 
                pc.curva::VARCHAR,
                COUNT(*)::BIGINT as qtd_itens,
                SUM(pc.valor_total_produto)::NUMERIC as valor_total,
                (COUNT(*)::NUMERIC / NULLIF(MAX(pc.total_produtos), 0) * 100)::NUMERIC as percentual_itens,
                (SUM(pc.valor_total_produto)::NUMERIC / NULLIF(MAX(pc.total_vendas), 0) * 100)::NUMERIC as percentual_faturamento
            FROM produtos_classificados pc
            GROUP BY pc.curva
            ORDER BY pc.curva;
        END;
        $$ LANGUAGE plpgsql;
    `;

    console.log('🚀 Criando função fn_analise_curva_abc no banco LOCAL...');

    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✅ Função fn_analise_curva_abc criada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao criar função:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createAnalysisFunction();
