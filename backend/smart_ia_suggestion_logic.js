const { Pool } = require('pg');

/**
 * Motor Analítico de Sugestão Inteligente
 * Este módulo coleta todos os dados necessários (8 Pilares) para alimentar a IA
 */

class SmartIAAnalyticMotor {
    constructor(pool) {
        this.pool = pool;
    }

    async getFullContext(clienteId, industriaId) {
        console.log(`📡 [MOTOR] Iniciando coleta de contexto para Cliente: ${clienteId}, Industria: ${industriaId}`);

        try {
            const [cliente, historico, gap, abc, alertas] = await Promise.all([
                this.getClientePerfil(clienteId).catch(e => { console.error('❌ [MOTOR] Erro Perfil:', e.message); return null; }),
                this.getHistoricoCompras(clienteId, industriaId).catch(e => { console.error('❌ [MOTOR] Erro Histórico:', e.message); return []; }),
                this.getGapAnalysis(clienteId, industriaId).catch(e => { console.error('❌ [MOTOR] Erro Gap:', e.message); return []; }),
                this.getABCCurve(industriaId).catch(e => { console.error('❌ [MOTOR] Erro ABC:', e.message); return []; }),
                this.getAlertasRecompra(clienteId, industriaId).catch(e => { console.error('❌ [MOTOR] Erro Alertas:', e.message); return []; })
            ]);

            console.log(`✅ [MOTOR] Contexto coletado com sucesso. Histórico: ${historico.length}, Gap: ${gap.length}, Alertas: ${alertas.length}`);

            return {
                cliente,
                industria_analisada: industriaId,
                historico_compras: historico,
                gap_analysis: gap,
                curva_abc_produtos: abc,
                alertas_recompra: alertas,
                data_calculo: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ [MOTOR] Erro crítico no getFullContext:', error);
            throw error;
        }
    }

    async getClientePerfil(clienteId) {
        const query = `
            SELECT cli_codigo, cli_nome, cli_nomred, cli_cidade, cli_uf, cli_tipopes as cli_tipo
            FROM clientes 
            WHERE cli_codigo = $1
        `;
        const res = await this.pool.query(query, [clienteId]);
        return res.rows[0];
    }

    async getHistoricoCompras(clienteId, industriaId) {
        const query = `
            SELECT 
                i.ite_produto, 
                i.ite_nomeprod,
                COUNT(DISTINCT p.ped_pedido) as qtd_pedidos,
                SUM(i.ite_quant) as total_quantidade,
                SUM(i.ite_totbruto) as total_valor,
                MAX(p.ped_data) as ultima_compra,
                AVG(i.ite_quant) as media_quantidade
            FROM itens_ped i
            JOIN pedidos p ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_cliente = $1 AND p.ped_industria = $2
            AND p.ped_situacao NOT IN ('C', 'E')
            GROUP BY i.ite_produto, i.ite_nomeprod
            ORDER BY total_valor DESC
        `;
        const res = await this.pool.query(query, [clienteId, industriaId]);
        return res.rows;
    }

    async getGapAnalysis(clienteId, industriaId) {
        const query = `
            SELECT p.pro_codprod, p.pro_nome, p.pro_embalagem, p.pro_id
            FROM cad_prod p
            WHERE p.pro_industria = $2
            AND NOT EXISTS (
                SELECT 1 
                FROM itens_ped i 
                JOIN pedidos ped ON ped.ped_pedido = i.ite_pedido
                WHERE ped.ped_cliente = $1 AND ped.ped_industria = $2
                AND i.ite_produto = p.pro_codprod
            )
            ORDER BY p.pro_nome ASC
            LIMIT 30
        `;
        const res = await this.pool.query(query, [clienteId, industriaId]);
        return res.rows;
    }

    async getABCCurve(industriaId) {
        const query = `
            WITH vendas_prod AS (
                SELECT i.ite_produto, MIN(i.ite_nomeprod) as ite_nomeprod, SUM(i.ite_totbruto) as total_faturado
                FROM itens_ped i
                INNER JOIN pedidos p ON p.ped_pedido = i.ite_pedido
                WHERE i.ite_industria = $1
                  AND p.ped_data >= CURRENT_DATE - INTERVAL '365 days'
                  AND p.ped_situacao NOT IN ('C', 'E')
                GROUP BY i.ite_produto
            ),
            ranked_vendas AS (
                SELECT *,
                       SUM(total_faturado) OVER(ORDER BY total_faturado DESC) / 
                       NULLIF(SUM(total_faturado) OVER(), 0) as pct_acumulado
                FROM vendas_prod
            )
            SELECT ite_produto, ite_nomeprod, total_faturado,
                   CASE 
                     WHEN pct_acumulado <= 0.8 THEN 'A'
                     WHEN pct_acumulado <= 0.95 THEN 'B'
                     ELSE 'C'
                   END as curva_abc
            FROM ranked_vendas
            ORDER BY total_faturado DESC
            LIMIT 100
        `;
        const res = await this.pool.query(query, [industriaId]);
        return res.rows;
    }

    async getAlertasRecompra(clienteId, industriaId) {
        const query = `
            SELECT 
                i.ite_produto, 
                MAX(p.ped_data) as ultima_compra,
                (CURRENT_DATE - MAX(p.ped_data)) as dias_sem_compra
            FROM itens_ped i
            JOIN pedidos p ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_cliente = $1 AND p.ped_industria = $2
              AND p.ped_data >= CURRENT_DATE - INTERVAL '730 days'
            GROUP BY i.ite_produto
            HAVING (CURRENT_DATE - MAX(p.ped_data)) > 45
        `;
        const res = await this.pool.query(query, [clienteId, industriaId]);
        return res.rows;
    }
}

module.exports = SmartIAAnalyticMotor;
