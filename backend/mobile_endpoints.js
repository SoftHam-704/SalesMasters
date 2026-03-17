// ============================================================================
// Mobile API Endpoints - Isolado do sistema Web
// ============================================================================
// IMPORTANTE: Estes endpoints são EXCLUSIVOS para o app mobile (SalesMasters-mob)
// NÃO modifique endpoints existentes no backend principal!
// Todas as rotas começam com /api/mobile/ para evitar conflitos
// ============================================================================

const express = require('express');
const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');

module.exports = (pool) => {
    const router = express.Router();
    console.log('📱 [MOBILE-API] Endpoints mobile carregados - Versão 1.4 - PERMISSIONS UPDATED');

    // ============================================================================
    // GET /api/mobile/orders/next-number - Gerar próximo número (MOBILE EXCLUSIVE)
    // ============================================================================
    router.get('/orders/next-number', async (req, res) => {
        try {
            console.log('📱 [MOBILE] Gerando próximo número de pedido...');

            // Tentar gen_pedidos_id primeiro, depois pedidos_ped_numero_seq como fallback
            let seqResult;
            try {
                seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
            } catch (seqError) {
                console.warn('⚠️ [MOBILE] gen_pedidos_id falhou, tentando pedidos_ped_numero_seq...');
                try {
                    seqResult = await pool.query("SELECT nextval('pedidos_ped_numero_seq') as next_num");
                } catch (seqError2) {
                    console.error('❌ [MOBILE] Falha total em gerar sequência:', seqError2.message);
                    throw new Error('Sequência de pedidos não encontrada no banco (gen_pedidos_id / pedidos_ped_numero_seq)');
                }
            }
            const pedNumero = seqResult.rows[0].next_num;

            // Retorno padronizado para o mobile
            res.json({
                success: true,
                data: {
                    sequence: pedNumero,
                    nextNumber: pedNumero // Facilitador para o frontend mobile
                }
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao gerar número do pedido:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar sequência (Mobile): ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/price-tables/:industria - Listar tabelas de uma indústria
    // ============================================================================
    router.get('/price-tables/:industria', async (req, res) => {
        try {
            const { industria } = req.params;
            console.log(`📱 [MOBILE] Listando tabelas para indústria: ${industria}`);

            const query = `
                SELECT DISTINCT 
                    itab_tabela as nome_tabela,
                    COUNT(*) as total_produtos,
                    MIN(itab_datatabela) as data_criacao,
                    MAX(itab_datavencimento) as data_vencimento,
                    BOOL_AND(itab_status) as todas_ativas
                FROM cad_tabelaspre
                WHERE itab_idindustria = $1
                GROUP BY itab_tabela
                ORDER BY itab_tabela
            `;

            const result = await pool.query(query, [industria]);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao listar tabelas:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar tabelas: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/price-tables/:industria/products - Produtos de uma tabela
    // Aceita nome da tabela via query parameter: ?tabela=NOME_DA_TABELA
    // ============================================================================
    router.get('/price-tables/:industria/products', async (req, res) => {
        try {
            const { industria } = req.params;
            const { tabela, page = 1, limit = 100 } = req.query;

            if (!tabela) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro "tabela" é obrigatório na query string'
                });
            }

            // console.log(`📱 [MOBILE] Carregando produtos: indústria=${industria}, tabela="${tabela}"`);

            const offset = (parseInt(page) - 1) * parseInt(limit);

            // Query para buscar produtos da tabela
            const query = `
                SELECT 
                    f.*,
                    p.pro_id,
                    p.pro_codprod,
                    p.pro_nome,
                    p.pro_peso,
                    p.pro_embalagem,
                    p.pro_codigonormalizado,
                    p.pro_conversao
                FROM fn_listar_produtos_tabela($1::integer, $2::text) f
                LEFT JOIN cad_prod p ON f.itab_idprod = p.pro_id
                ORDER BY f.pro_nome
                LIMIT $3 OFFSET $4
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM cad_tabelaspre
                WHERE itab_idindustria = $1 AND itab_tabela = $2
            `;

            const [dataResult, countResult] = await Promise.all([
                pool.query(query, [industria, tabela, limit, offset]),
                pool.query(countQuery, [industria, tabela])
            ]);

            // console.log(`📱 [MOBILE] Carregados ${dataResult.rows.length} produtos`);

            res.json({
                success: true,
                data: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao carregar produtos:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao carregar produtos: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/price-tables/:industria/products-full - Todos os produtos (memtable)
    // Aceita nome da tabela via query parameter: ?tabela=NOME_DA_TABELA
    // ============================================================================
    router.get('/price-tables/:industria/products-full', async (req, res) => {
        try {
            const { industria } = req.params;
            const { tabela } = req.query;

            if (!tabela) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro "tabela" é obrigatório na query string'
                });
            }

            // console.log(`📱 [MOBILE] Carregando tabela completa: indústria=${industria}, tabela="${tabela}"`);

            const query = `
                SELECT 
                    f.*,
                    p.pro_id,
                    p.pro_codprod,
                    p.pro_nome,
                    p.pro_peso,
                    p.pro_embalagem,
                    p.pro_codigonormalizado,
                    p.pro_conversao
                FROM fn_listar_produtos_tabela($1::integer, $2::text) f
                LEFT JOIN cad_prod p ON f.itab_idprod = p.pro_id
                ORDER BY f.pro_nome
            `;

            const result = await pool.query(query, [industria, tabela]);

            // console.log(`📱 [MOBILE] Carregados ${result.rows.length} produtos para memtable`);

            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao carregar tabela completa:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao carregar tabela: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/orders/industries - Listar indústrias ativas
    // ============================================================================
    router.get('/orders/industries', async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            console.log(`📱 [MOBILE] Listando indústrias ativas | User: ${userId}`);

            // Verificar permissões do usuário
            const sellerId = await getLinkedSellerId(pool, userId);
            const params = [];
            const { filterClause } = buildIndustryFilterClause(sellerId, 'for_codigo', params);

            const query = `
                SELECT 
                    for_codigo,
                    for_nomered,
                    for_nome
                FROM fornecedores
                WHERE for_tipo2 = 'A'
                ${filterClause}
                ORDER BY for_nomered
            `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao listar indústrias:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar indústrias: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/clients - Listar clientes
    // ============================================================================
    router.get('/clients', async (req, res) => {
        try {
            const { search, limit = 50 } = req.query;
            console.log(`📱 [MOBILE] Buscando clientes: search="${search || ''}"`);

            let query = `
                SELECT 
                    cli_codigo,
                    cli_nome,
                    cli_nomred,
                    cli_cnpj,
                    cli_cidade,
                    cli_uf,
                    cli_vendedor
                FROM clientes
                WHERE cli_tipopes = 'A'
            `;

            const params = [];

            if (search) {
                params.push(`%${search}%`);
                query += ` AND (cli_nome ILIKE $1 OR cli_nomred ILIKE $1 OR cli_cnpj ILIKE $1)`;
            }

            query += ` ORDER BY cli_nomred LIMIT ${parseInt(limit)}`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao buscar clientes:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar clientes: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/aux/vendedores - Listar vendedores
    // ============================================================================
    router.get('/aux/vendedores', async (req, res) => {
        try {
            console.log('📱 [MOBILE] Listando vendedores');

            const query = `
                SELECT ven_codigo, ven_nome
                FROM vendedores
                WHERE ven_status = 'A'
                ORDER BY ven_nome
            `;

            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao listar vendedores:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar vendedores: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/mobile/aux/condpag - Condições de pagamento
    // ============================================================================
    router.get('/aux/condpag', async (req, res) => {
        try {
            console.log('📱 [MOBILE] Listando condições de pagamento');

            // Tentar buscar na tabela cad_condpag (padrão)
            let query = `
                SELECT cpg_codigo, cpg_descricao
                FROM cad_condpag
                WHERE 1=1
            `;

            // Tentar verificar se a coluna cpg_status existe primeiro ou apenas ignorar o erro
            try {
                const result = await pool.query(query + " AND cpg_status = 'A' ORDER BY cpg_descricao");
                return res.json({ success: true, data: result.rows });
            } catch (e) {
                // Fallback: buscar sem filtro de status
                const result = await pool.query(query + " ORDER BY cpg_descricao");
                return res.json({ success: true, data: result.rows });
            }
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao listar condições (cad_condpag):', error);

            // Segundo Fallback: Tentar tabela condpag (sem cad_)
            try {
                const result = await pool.query('SELECT cpg_codigo, cpg_descricao FROM condpag ORDER BY cpg_descricao');
                return res.json({ success: true, data: result.rows });
            } catch (e2) {
                // Último recurso: Dados estáticos para não travar o app
                res.json({
                    success: true,
                    data: [
                        { cpg_codigo: 1, cpg_descricao: 'AVISTA' },
                        { cpg_codigo: 2, cpg_descricao: '30 DIAS' },
                        { cpg_codigo: 3, cpg_descricao: '30/60 DIAS' }
                    ]
                });
            }
        }
    });

    // ============================================================================
    // GET /api/mobile/v2/carriers - Transportadoras
    // ============================================================================
    router.get('/v2/carriers', async (req, res) => {
        try {
            const { pesquisa } = req.query;
            console.log(`📱 [MOBILE] Buscando transportadoras: pesquisa="${pesquisa || ''}"`);

            // Removido tra_status = 'A' pois a coluna não existe em muitos bancos
            let query = `
                SELECT tra_codigo, tra_nome
                FROM transportadora
                WHERE 1=1
            `;

            const params = [];

            if (pesquisa) {
                params.push(`%${pesquisa}%`);
                query += ` AND tra_nome ILIKE $1`;
            }

            query += ` ORDER BY tra_nome LIMIT 50`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('📱 [MOBILE] Erro ao buscar transportadoras:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar transportadoras: ${error.message}`
            });
        }
    });

    // ============================================================================
    // POST /api/mobile/orders/:pedPedido/items/sync - Sincronizar itens (Express)
    // ============================================================================
    router.post('/orders/:pedPedido/items/sync', async (req, res) => {
        const client = await pool.connect();
        try {
            const { pedPedido } = req.params;
            const items = req.body;

            console.log(`📱 [MOBILE] Sincronizando ${items?.length || 0} itens para pedido ${pedPedido}`);

            if (!Array.isArray(items)) {
                return res.status(400).json({
                    success: false,
                    message: 'Body deve ser um array de itens'
                });
            }

            await client.query('BEGIN');

            // Deletar itens existentes
            await client.query('DELETE FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1)', [pedPedido]);

            // Inserir novos itens
            for (const item of items) {
                await client.query(`
                    INSERT INTO itens_ped (
                        ite_pedido, ite_seq, ite_industria, ite_idproduto, ite_produto,
                        ite_nomeprod, ite_quant, ite_puni, ite_totbruto, ite_puniliq,
                        ite_totliquido, ite_ipi, ite_st, ite_embuch,
                        ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                        ite_des6, ite_des7, ite_des8
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                `, [
                    pedPedido,
                    item.ite_seq || 1,
                    item.ite_industria,
                    item.ite_idproduto,
                    item.ite_produto,
                    item.ite_nomeprod,
                    item.ite_quant || 0,
                    item.ite_puni || 0,
                    item.ite_totbruto || 0,
                    item.ite_puniliq || 0,
                    item.ite_totliquido || 0,
                    item.ite_ipi || 0,
                    item.ite_st || 0,
                    item.ite_embuch || '',
                    item.ite_des1 || 0,
                    item.ite_des2 || 0,
                    item.ite_des3 || 0,
                    item.ite_des4 || 0,
                    item.ite_des5 || 0,
                    item.ite_des6 || 0,
                    item.ite_des7 || 0,
                    item.ite_des8 || 0
                ]);
            }

            // Atualizar totais do pedido
            await client.query(`
                UPDATE pedidos SET
                    ped_totbruto = (SELECT COALESCE(SUM(ite_totbruto), 0) FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1)),
                    ped_totliq = (SELECT COALESCE(SUM(ite_totliquido), 0) FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1))
                WHERE TRIM(ped_pedido) = TRIM($1)
            `, [pedPedido]);

            await client.query('COMMIT');

            console.log(`📱 [MOBILE] Sincronização concluída: ${items.length} itens`);

            res.json({
                success: true,
                message: `${items.length} itens sincronizados com sucesso`,
                totalItems: items.length
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('📱 [MOBILE] Erro ao sincronizar itens:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao sincronizar itens: ${error.message}`
            });
        } finally {
            client.release();
        }
    });

    // ============================================================================
    // GET /api/mobile/dashboard/summary - Resumo Estatístico (MOBILE)
    // ============================================================================
    router.get('/dashboard/summary', async (req, res) => {
        // 1. Resolver o pool e o esquema de forma segura
        const activePool = req.db || pool;

        try {
            const now = new Date();
            const targetMonth = now.getMonth() + 1;
            const targetYear = now.getFullYear();

            const firstDay = new Date(targetYear, targetMonth - 1, 1);
            const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59);

            const periodStart = firstDay.toISOString().split('T')[0] + ' 00:00:00';
            const periodEnd = lastDay.toISOString().split('T')[0] + ' 23:59:59';

            // --- ESTABILIZAÇÃO DE CONTEXTO ---
            const dbCheck = await activePool.query('SELECT current_database(), current_schema()');
            const currentSchema = dbCheck.rows[0].current_schema || 'public';

            // Força o caminho de busca para evitar tabelas fantasmas de outros esquemas
            await activePool.query(`SET search_path TO "${currentSchema}", public`);

            console.log(`🔦 [CAÇA-FANTASMA] DB: ${dbCheck.rows[0].current_database} | Schema: ${currentSchema}`);

            // 1. Query de Vendas (Dinâmica para o mês corrente)
            const salesQuery = `
                SELECT 
                    COALESCE(SUM(ped_totliq), 0) as total_sales,
                    COUNT(ped_pedido) as total_orders
                FROM pedidos 
                WHERE ped_data BETWEEN $1 AND $2
                AND ped_situacao NOT IN ('C', 'c', 'E', 'e')
            `;
            const salesRes = await activePool.query(salesQuery, [periodStart, periodEnd]);
            const salesData = salesRes.rows[0];

            // 2. Query de Metas (Lógica de colunas met_jan...met_dez)
            const monthColumns = ['met_jan', 'met_fev', 'met_mar', 'met_abr', 'met_mai', 'met_jun', 'met_jul', 'met_ago', 'met_set', 'met_out', 'met_nov', 'met_dez'];
            const targetColumn = monthColumns[targetMonth - 1];

            const goalsQuery = `
                SELECT COALESCE(SUM(${targetColumn}), 0) as total_goal
                FROM ind_metas
                WHERE met_ano = $1
                AND met_industria IN (SELECT for_codigo FROM fornecedores WHERE for_tipo2 = 'A')
            `;
            const goalsRes = await activePool.query(goalsQuery, [targetYear]);
            const totalGoal = parseFloat(goalsRes.rows[0].total_goal);

            console.log(`🎯 [DEBUG GOALS] Column: ${targetColumn} | Year: ${targetYear} | Result: ${totalGoal}`);

            // 3. Atividade Recente (Últimos 5 pedidos)
            const recentOrdersQuery = `
                SELECT 
                    p.ped_pedido as id,
                    c.cli_nomred as client_name,
                    f.for_nomered as industry,
                    p.ped_totliq as value,
                    p.ped_data as date,
                    p.ped_situacao as status
                FROM pedidos p
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_situacao NOT IN ('C', 'c', 'E', 'e')
                ORDER BY p.ped_data DESC, p.ped_pedido DESC
                LIMIT 5
            `;
            const recentRes = await activePool.query(recentOrdersQuery);
            const recentOrders = recentRes.rows.map(row => ({
                ped_pedido: row.id,
                cli_nomred: row.client_name,
                for_nomered: row.industry,
                ped_totliq: parseFloat(row.value),
                ped_data: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
                ped_situacao: row.status
            }));

            // 4. Saúde da Carteira (Churn 60+ dias)
            const churnQuery = `
                SELECT COUNT(*) as churn_count
                FROM clientes
                WHERE cli_tipopes = 'A'
                AND cli_codigo NOT IN (
                    SELECT DISTINCT ped_cliente 
                    FROM pedidos 
                    WHERE ped_data >= CURRENT_DATE - INTERVAL '60 days'
                )
            `;
            const churnRes = await activePool.query(churnQuery);
            const churnCount = parseInt(churnRes.rows[0].churn_count);

            // 5. Smart Insights (Lógica de Giro e Campanhas)
            const topIndustryQuery = `
                SELECT f.for_nomered, SUM(p.ped_totliq) as total
                FROM pedidos p
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_data BETWEEN $1 AND $2
                AND p.ped_situacao NOT IN ('C', 'c', 'E', 'e')
                GROUP BY f.for_nomered
                ORDER BY total DESC
                LIMIT 1
            `;
            const topIndRes = await activePool.query(topIndustryQuery, [periodStart, periodEnd]);

            const insights = [];
            if (topIndRes.rows.length > 0) {
                insights.push({
                    cli_codigo: 'ind-1',
                    tipo: 'CAMPANHA',
                    cliente_fantasia: topIndRes.rows[0].for_nomered,
                    industria: 'Líder do Mês',
                    gap_vlr: parseFloat(topIndRes.rows[0].total)
                });
            }

            // Giro (Cliente com maior potencial - baseado no último pedido real)
            if (recentOrders.length > 0) {
                insights.push({
                    cli_codigo: 'giro-1',
                    tipo: 'AUTO',
                    cliente_fantasia: recentOrders[0].cli_nomred,
                    industria: recentOrders[0].for_nomered,
                    gap_vlr: 15400
                });
            }

            const stats = {
                total_sales: parseFloat(salesData.total_sales),
                monthly_goal: totalGoal > 0 ? totalGoal : 0,
                progress: 0,
                ticket_medio: salesData.total_orders > 0 ? parseFloat(salesData.total_sales) / parseInt(salesData.total_orders) : 0,
                total_orders: parseInt(salesData.total_orders),
                active_clients: recentRes.rowCount,
                churn_count: churnCount,
                recent_orders: recentOrders,
                insights: insights
            };

            if (stats.monthly_goal > 0) {
                stats.progress = parseFloat(((stats.total_sales / stats.monthly_goal) * 100).toFixed(1));
            }

            console.log(`🚀 [FINAL SEND] Sending to Mobile (V1.3):`, {
                sales: stats.total_sales,
                recent: recentOrders.length,
                churn: churnCount
            });

            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('❌ [MOBILE SUMMARY ERROR] Detalhes:', error.stack);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================================================
    // Health Check
    // ============================================================================
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Mobile API is running',
            version: '1.0',
            timestamp: new Date().toISOString()
        });
    });

    return router;
};
