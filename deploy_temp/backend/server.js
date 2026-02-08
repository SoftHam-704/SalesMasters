require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Firebird = require('node-firebird');
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const path = require('path');
const multer = require('multer');

// Multi-tenant Utils
const { masterPool, getTenantPool, getTenantConfig } = require('./utils/db');
const { dbContextMiddleware, getCurrentPool } = require('./utils/context');

// Proxy para o pool original: isso garante que TODAS as rotas existentes
// usem automaticamente o banco de dados do cliente logado sem alterar o código delas.
const pool = {
    query: (...args) => (getCurrentPool() || masterPool).query(...args),
    connect: (...args) => (getCurrentPool() || masterPool).connect(...args),
    end: (...args) => (getCurrentPool() || masterPool).end(...args)
};


// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Fallback robusto para múltiplos ambientes
        const uploadDir = process.env.UPLOAD_DIR ||
            (process.platform === 'win32'
                ? 'C:\\SalesMasters\\Imagens'
                : path.join(process.cwd(), 'uploads'));

        if (!fs.existsSync(uploadDir)) {
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
            } catch (err) {
                console.error('❌ Erro ao criar diretório de upload:', err);
                return cb(err);
            }
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const uploadLogo = multer({ storage: logoStorage });

const app = express();
const PORT = (() => {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p) && p > 0 && p < 65536) return p;
    console.warn('⚠️ Invalid PORT env var, falling back to 8080');
    return 8080;
})();

// Middleware
app.use(cors());
/* app.use((req, res, next) => {
    console.log(`🚀 [VIP REQUEST] ${req.method} ${req.url}`);
    next();
}); */
app.use(express.json({ limit: '100mb' })); // Aumentado para suportar importações muito grandes (20k+ produtos)
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Session Heartbeat Middleware (Controle de Equipamentos)
const activeSessionMiddleware = require('./middleware/sessionMiddleware');
app.use(activeSessionMiddleware);

// Middleware Multi-tenant: Identifica qual cliente está acessando
// MOVIDO PARA CIMA do proxy para garantir que o BI saiba quem é o cliente no 1º acesso
app.use(dbContextMiddleware(getTenantPool, masterPool));

// Proxy para o BI Engine (Python na porta 8000)
// Todas as requisições /bi-api/* são encaminhadas para o Python
app.use('/bi-api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    timeout: 120000,       // Tempo de espera para o servidor (Proxy -> BI Engine)
    proxyTimeout: 120000,  // Tempo de espera para a conexão
    pathRewrite: {
        '^/bi-api': '' // Remove /bi-api do path antes de enviar ao Python
    },
    onProxyReq: (proxyReq, req, res) => {
        req._bi_start = Date.now();
        // console.log(`📡 [BI PROXY] Encaminhando: ${req.url}`);

        const tenantCnpj = req.headers['x-tenant-cnpj'];
        if (tenantCnpj) {
            const config = getTenantConfig(tenantCnpj);
            if (config) {
                proxyReq.setHeader('x-tenant-cnpj', tenantCnpj);
                proxyReq.setHeader('x-tenant-db-config', JSON.stringify(config));
                // console.log(`🔗 [BI PROXY] Contexto injetado: ${tenantCnpj}`);
            } else {
                console.warn(`⚠️ [BI PROXY] Config não encontrada no cache para ${tenantCnpj}. O Python pode falhar.`);
            }
        } else {
            console.warn(`⚠️ [BI PROXY] Requisição sem x-tenant-cnpj header!`);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        const duration = Date.now() - req._bi_start;
        // console.log(`✅ [BI PROXY] Resposta: ${req.url} | Status: ${proxyRes.statusCode} | Duração: ${duration}ms`);
        // Adiciona headers CORS na resposta
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: (err, req, res) => {
        console.error('❌ [BI PROXY] Erro:', err.message);
        res.status(502).json({ success: false, message: 'BI Engine não disponível ou timeout excedido' });
    }
}));

// O middleware já foi movido para cima do Proxy

// Rota de Login Master (Central de Controle)
const authMasterRoutes = require('./auth_master_endpoints');
app.use('/api/auth', authMasterRoutes);

// Painel de Administração Master (Apenas para Hamilton)
const masterPanelRoutes = require('./master_panel_endpoints');
app.use('/api/master', masterPanelRoutes);

// --- ENDPOINT DE DEBUG DE DEPLOY (Prioridade Máxima) ---
app.get('/api/deploy-test', (req, res) => {
    const debugData = {
        dirname: __dirname,
        cwd: process.cwd(),
        node_version: process.version,
        env_node_env: process.env.NODE_ENV,
        mobile_path: path.resolve(__dirname, '..', 'mobile'),
        mobile_exists: fs.existsSync(path.resolve(__dirname, '..', 'mobile')),
        mobile_index: path.join(path.resolve(__dirname, '..', 'mobile'), 'index.html'),
        mobile_index_exists: fs.existsSync(path.join(path.resolve(__dirname, '..', 'mobile'), 'index.html')),
        frontend_path: path.resolve(__dirname, '..', 'frontend'),
        frontend_exists: fs.existsSync(path.resolve(__dirname, '..', 'frontend')),
    };
    res.json({ success: true, debug: debugData });
});

// Endpoints modules
const clientsRoutes = require('./clients_endpoints')(pool);
const productsRoutes = require('./products_endpoints')(pool);
const priceTablesRoutes = require('./price_tables_endpoints')(pool);
const auxRoutes = require('./aux_endpoints')(pool);

// Core API Routes
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/price-tables', priceTablesRoutes);
app.use('/api/aux', auxRoutes);

// Special & Helper Modules
app.use('/api', require('./login_endpoints')(pool));
app.use('/api', require('./parametros_endpoints')(pool));
app.use('/api/cli-ind', require('./cli_ind_endpoints')(pool));
app.use('/api', require('./cli_aniv_endpoints')(pool));
app.use('/api/suppliers', require('./suppliers_endpoints')(pool));
app.use('/api/sellers', require('./vendedores_endpoints')(pool));
app.use('/api/reports', require('./reports_endpoints_v2')(pool));
app.use('/api/intelligence', require('./client_intelligence_endpoints')(pool));
app.use('/api/metas', require('./metas_endpoints')(pool));
app.use('/api/agenda', require('./agenda_endpoints')(pool));
app.use('/api/chat', require('./chat_endpoints')(pool));
app.use('/api/financeiro', require('./financial_endpoints')(pool));

// Mobile-specific endpoints (isolado para evitar conflitos com web)
app.use('/api/mobile', require('./mobile_endpoints')(pool));

// GET - Buscar pedido individual por ID (para edição no mobile)
app.get('/api/orders/:pedPedido', async (req, res, next) => {
    const { pedPedido } = req.params;

    // Lista de palavras-chave reservadas que NÃO são IDs de pedido
    const reserved = ['industries', 'clients', 'stats', 'next-number', 'product-history', 'calculate-group-discounts', 'batch-last-prices', 'batch-original-codes', 'deploy-test'];
    if (reserved.includes(pedPedido)) {
        return next();
    }

    const currentTenantPool = getCurrentPool();

    // NUNCA permitir que rotas de dados (como pedidos) usem o masterPool.
    if (!currentTenantPool) {
        console.error(`❌ [ORDERS] Acesso negado: Contexto de tenant ausente para pedido ${pedPedido}`);
        return res.status(403).json({
            success: false,
            message: 'Erro de autenticação: Empresa não identificada. Por favor, faça login novamente.'
        });
    }

    const activePool = currentTenantPool;
    const dbName = activePool.options?.database || 'Unknown';
    const tenantId = req.headers['x-tenant-cnpj'] || 'N/A';

    console.log(`📦 [ORDERS] Detail request: ${pedPedido} | DB: ${dbName} | Tenant: ${tenantId}`);

    // Suporte a ID composto (pedido:industria)
    let finalPedido = pedPedido;
    let finalIndustria = null;
    if (pedPedido.includes(':')) {
        [finalPedido, finalIndustria] = pedPedido.split(':');
    }

    try {
        // 1. Fetch Order Header
        let orderQuery = `
            SELECT 
                p.*,
                c.cli_nome as ped_clientenome,
                c.cli_nomred,
                f.for_nomered as ped_industrianome,
                v.ven_nome as ped_vendedornome
            FROM pedidos p
            LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
            LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
            LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
            WHERE TRIM(p.ped_pedido) = TRIM($1)
        `;
        const queryParams = [finalPedido];
        if (finalIndustria) {
            orderQuery += ` AND p.ped_industria = $2`;
            queryParams.push(parseInt(finalIndustria));
        }

        const orderResult = await activePool.query(orderQuery, queryParams);

        if (orderResult.rows.length === 0) {
            console.log(`⚠️ [ORDERS] Order ${pedPedido} not found in ${currentTenantPool ? 'Tenant' : 'Master'} DB`);
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado no banco de dados ativo.'
            });
        }

        const order = orderResult.rows[0];

        // 2. Fetch Order Items
        const itemsQuery = `
            SELECT 
                ip.*,
                ip.ite_nomeprod as ite_descricao,
                ip.ite_quant as ite_quantidade,
                ip.ite_puni as ite_preco,
                ip.ite_totbruto as ite_total,
                ip.ite_embuch as ite_unidade
            FROM itens_ped ip
            WHERE TRIM(ip.ite_pedido) = TRIM($1)
            ${finalIndustria ? 'AND ip.ite_industria = $2' : ''}
            ORDER BY ip.ite_seq
        `;
        const itemsResult = await activePool.query(itemsQuery, queryParams);

        console.log(`✅ [ORDERS] Returning order ${pedPedido} with ${itemsResult.rows.length} items from ${currentTenantPool ? 'Tenant' : 'Master'} DB`);

        // 3. Return combined result
        res.json({
            ...order,
            items: itemsResult.rows
        });

    } catch (error) {
        console.error(`❌ [ORDERS] Error fetching order ${pedPedido}:`, error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar pedido: ${error.message}`
        });
    }
});

// Non-pool Modules (Direct app injection)
require('./orders_endpoints')(app, pool);
require('./smart_order_endpoints')(app, pool);
require('./order_items_endpoints')(app, pool);
require('./order_print_endpoints')(app, pool);
require('./email_endpoints')(app, pool);
require('./pdf_save_endpoints')(app, pool);
require('./crm_endpoints_v2')(app, pool);
require('./narratives_endpoints')(app);
require('./cli_discounts_endpoints')(app, pool);
require('./portal_integration_endpoints')(app, pool);


app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', version: '1.2.0-clean', timestamp: new Date() });
});

app.use('/api', (req, res, next) => {
    console.log(`[API_HIT] ${req.method} ${req.url} | Tenant: ${req.headers['x-tenant-db-config'] ? 'Sim' : 'Não'}`);
    next();
});

// Serve static images from C:\SalesMasters\Imagens
app.use('/images', express.static('C:\\SalesMasters\\Imagens'));

// Endpoint to serve any local image file
app.get('/api/image', (req, res) => {
    const { path: imagePath } = req.query;

    if (!imagePath) {
        return res.status(400).json({ success: false, message: 'Path is required' });
    }

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Send the file
    res.sendFile(imagePath);
});

// --- DASHBOARD API BYPASS (Prioridade Alta) ---
// Estas rotas precisam ser definidas antes do static files/fallback do React
app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        const { ano, mes, industria } = req.query;
        if (!ano) return res.status(400).json({ success: false, message: 'Ano obrigatório' });

        const result = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2, $3)',
            [
                parseInt(ano),
                mes ? parseInt(mes) : 0,
                industria ? parseInt(industria) : 0
            ]
        );

        res.json({
            success: true,
            data: result.rows[0] || {
                total_vendido_current: 0,
                vendas_percent_change: 0,
                quantidade_vendida_current: 0,
                quantidade_percent_change: 0,
                clientes_atendidos_current: 0,
                clientes_percent_change: 0,
                total_pedidos_current: 0,
                pedidos_percent_change: 0
            }
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error:', error);
        res.json({ success: true, data: { total_vendido_current: 0 } });
    }
});

app.get('/api/dashboard/industry-revenue', async (req, res) => {
    try {
        const { ano, mes } = req.query;
        let query = `
            SELECT i.for_nomered as industria_nome, SUM(p.ped_totliq) as total_faturamento
            FROM pedidos p
            JOIN fornecedores i ON i.for_codigo = p.ped_industria
            WHERE EXTRACT(YEAR FROM p.ped_data) = $1
              AND p.ped_situacao <> 'C'
        `;
        const params = [parseInt(ano)];
        if (mes) {
            query += ' AND EXTRACT(MONTH FROM p.ped_data) = $2 ';
            params.push(parseInt(mes));
        }
        query += ' GROUP BY i.for_nomered ORDER BY total_faturamento DESC LIMIT 20';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows || [] });
    } catch (error) {
        console.error('❌ [INDUSTRY] Error:', error);
        res.json({ success: true, data: [] });
    }
});

app.get('/api/dashboard/top-clients', async (req, res) => {
    try {
        const { ano, mes, limit = 15 } = req.query;
        let query = `
            SELECT 
                c.cli_codigo as cliente_codigo,
                COALESCE(NULLIF(c.cli_nomred, ''), c.cli_nome) as cliente_nome,
                SUM(p.ped_totliq) as total_vendido,
                COUNT(DISTINCT p.ped_pedido) as quantidade_pedidos
            FROM pedidos p
            JOIN clientes c ON c.cli_codigo = p.ped_cliente
            WHERE EXTRACT(YEAR FROM p.ped_data) = $1
              AND p.ped_situacao <> 'C'
        `;
        const params = [parseInt(ano)];
        let pIndex = 2;
        if (mes) {
            query += ` AND EXTRACT(MONTH FROM p.ped_data) = $${pIndex} `;
            params.push(parseInt(mes));
            pIndex++;
        }
        query += ` GROUP BY c.cli_codigo, c.cli_nomred, c.cli_nome ORDER BY total_vendido DESC LIMIT $${pIndex}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows || [] });
    } catch (error) {
        console.error('❌ [TOP-CLIENTS] Error:', error);
        res.json({ success: true, data: [] });
    }
});


// 4. Comparativo de Vendas (Gráfico)
app.get('/api/dashboard/sales-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;
        const result = await pool.query(
            'SELECT * FROM fn_comparacao_vendas_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );
        res.json({ success: true, data: result.rows || [] });
    } catch (error) {
        console.error('❌ [SALES-COMP] Error:', error);
        res.json({ success: true, data: [] });
    }
});

// 5. Comparativo de Quantidades (Gráfico)
app.get('/api/dashboard/quantities-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;
        const result = await pool.query(
            'SELECT * FROM fn_comparacao_quantidades_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );
        res.json({ success: true, data: result.rows || [] });
    } catch (error) {
        console.error('❌ [QTY-COMP] Error:', error);
        res.json({ success: true, data: [] });
    }
});

// 6. Performance de Vendedores (Tabela)
app.get('/api/dashboard/sales-performance', async (req, res) => {
    try {
        const { ano, mes } = req.query;
        const result = await pool.query(
            'SELECT * FROM get_sales_performance($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );
        res.json({ success: true, data: result.rows || [] });
    } catch (error) {
        console.error('❌ [PERFORMANCE] Error:', error);
        res.json({ success: true, data: [] });
    }
});





// --- CONFIGURAÇÃO APP MOBILE PWA (PRIORIDADE ALTA) ---
const mobilePath = path.resolve(__dirname, '..', 'mobile');
const frontendPath = path.resolve(__dirname, '..', 'frontend');

// Rota específica para o Mobile
if (fs.existsSync(mobilePath)) {
    console.log('📱 [DEPLOY] Mobile path detected:', mobilePath);
    app.use('/app', express.static(mobilePath));

    // Fallback SPA: Regex compatível com Node.js v22+ e path-to-regexp moderno
    app.get(/^\/app(\/.*)?$/, (req, res) => {
        const indexPath = path.join(mobilePath, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('❌ [DEPLOY] Error sending mobile index:', err.message);
                if (!res.headersSent) {
                    res.status(404).send(`Mobile App: Arquivo index.html não encontrado em ${indexPath}`);
                }
            }
        });
    });
}


// Rota para o Sistema Web
if (process.env.NODE_ENV === 'production' || fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get(/(.*)/, (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/app')) return next();
        const indexPath = path.join(frontendPath, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                if (!res.headersSent) {
                    console.error('❌ [DEPLOY] Error sending web index:', err.message);
                    res.status(500).send(`Erro interno: Não foi possível carregar o sistema web em ${indexPath}. Erro: ${err.message}`);
                }
            }
        });
    });
} else {
    app.get('/', (req, res) => {
        res.json({ success: true, message: 'SalesMasters Backend running', version: '1.0.0' });
    });
}


// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if ((req.method === 'PUT' || req.method === 'POST') && req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body).substring(0, 500));
    }
    next();
});

// System Info (Connection Type)
app.get('/api/system-info', (req, res) => {
    //Tenta pegar o host do tenant via header (injetado pelo interceptor do frontend)
    const tenantDbConfigHeader = req.headers['x-tenant-db-config'];
    let dbHost = process.env.DB_HOST || 'localhost';

    if (tenantDbConfigHeader) {
        try {
            const dbConfig = JSON.parse(tenantDbConfigHeader);
            if (dbConfig.host) dbHost = dbConfig.host;
        } catch (e) {
            console.error('⚠️ [SYSTEM-INFO] Erro ao parsear header de config:', e.message);
        }
    }

    // Determinar se é LOCAL ou CLOUD baseado no host
    const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1' || dbHost.startsWith('192.168.');

    console.log(`🔍 [SYSTEM-INFO] dbHost=${dbHost}, isLocal=${isLocal}`);

    res.json({
        success: true,
        database_type: isLocal ? 'local' : 'cloud'
    });
});

// O pool agora é gerenciado dinamicamente via Proxy definido no topo do arquivo.
// Antiga definição estática removida para dar lugar ao Multi-tenant.


// ==================== V2 ENDPOINTS (Top Priority) ====================

// --- SYSTEM / USER MANAGEMENT (V2) ---
const userManagementRoutes = require('./user_management_endpoints')(pool);
app.use('/api/v2/system', userManagementRoutes);

// --- PRODUCT GROUPS (V2) ---
app.get('/api/v2/product-groups', async (req, res) => {
    console.log('🔍 HIT TOP /api/v2/product-groups');
    try {
        const query = 'SELECT * FROM grupos ORDER BY gru_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM grupos WHERE gru_codigo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/v2/product-groups', async (req, res) => {
    try {
        const { gru_nome, gru_percomiss } = req.body;
        if (!gru_nome) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO grupos (gru_nome, gru_percomiss) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [gru_nome, gru_percomiss || 0]);
        res.json({ success: true, data: result.rows[0], message: 'Grupo criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { gru_nome, gru_percomiss } = req.body;
        const result = await pool.query('UPDATE grupos SET gru_nome = $1, gru_percomiss = $2 WHERE gru_codigo = $3 RETURNING *', [gru_nome, gru_percomiss, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, data: result.rows[0], message: 'Grupo atualizado!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM grupos WHERE gru_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, message: 'Grupo excluído!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Grupo em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- DISCOUNT GROUPS (V2) ---


// GET - Listar todos os grupos de descontos
app.get('/api/v2/discount-groups', async (req, res) => {
    console.log('🔍 HIT TOP /api/v2/discount-groups');
    try {
        const query = `
            SELECT 
                gde_id,
                gid,
                gde_nome,
                gde_desc1,
                gde_desc2,
                gde_desc3,
                gde_desc4,
                gde_desc5,
                gde_desc6,
                gde_desc7,
                gde_desc8,
                gde_desc9
            FROM grupo_desc
            ORDER BY NULLIF(gid, '')::integer
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupos de descontos: ${error.message}`
        });
    }
});

// GET - Buscar grupo de desconto por ID
app.get('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM grupo_desc WHERE gde_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupo de desconto: ${error.message}`
        });
    }
});

// POST - Criar novo grupo de desconto
app.post('/api/v2/discount-groups', async (req, res) => {
    try {
        const {
            gid,
            gde_nome,
            gde_desc1, gde_desc2, gde_desc3,
            gde_desc4, gde_desc5, gde_desc6,
            gde_desc7, gde_desc8, gde_desc9
        } = req.body;

        const checkGid = await pool.query('SELECT gde_id FROM grupo_desc WHERE gid = $1', [gid]);
        if (checkGid.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um grupo com este ID'
            });
        }

        const query = `
            INSERT INTO grupo_desc (
                gid, gde_nome,
                gde_desc1, gde_desc2, gde_desc3,
                gde_desc4, gde_desc5, gde_desc6,
                gde_desc7, gde_desc8, gde_desc9
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await pool.query(query, [
            gid || '0',
            gde_nome || '',
            gde_desc1 || 0, gde_desc2 || 0, gde_desc3 || 0,
            gde_desc4 || 0, gde_desc5 || 0, gde_desc6 || 0,
            gde_desc7 || 0, gde_desc8 || 0, gde_desc9 || 0
        ]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo de desconto criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar grupo de desconto: ${error.message}`
        });
    }
});

// PUT - Atualizar grupo de desconto
app.put('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            gid,
            gde_nome,
            gde_desc1, gde_desc2, gde_desc3,
            gde_desc4, gde_desc5, gde_desc6,
            gde_desc7, gde_desc8, gde_desc9
        } = req.body;

        const query = `
            UPDATE grupo_desc
            SET gid = $1,
                gde_nome = $2,
                gde_desc1 = $3,
                gde_desc2 = $4,
                gde_desc3 = $5,
                gde_desc4 = $6,
                gde_desc5 = $7,
                gde_desc6 = $8,
                gde_desc7 = $9,
                gde_desc8 = $10,
                gde_desc9 = $11
            WHERE gde_id = $12
            RETURNING *
        `;

        const result = await pool.query(query, [
            gid,
            gde_nome,
            gde_desc1 || 0, gde_desc2 || 0, gde_desc3 || 0,
            gde_desc4 || 0, gde_desc5 || 0, gde_desc6 || 0,
            gde_desc7 || 0, gde_desc8 || 0, gde_desc9 || 0,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo de desconto atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar grupo de desconto: ${error.message}`
        });
    }
});

// DELETE - Excluir grupo de desconto
app.delete('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM grupo_desc WHERE gde_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Grupo de desconto excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir grupo de desconto: ${error.message}`
        });
    }
});


// --- REGIONS (V2) ---

// GET - List all regions
app.get('/api/v2/regions', async (req, res) => {
    try {
        const query = 'SELECT * FROM regioes ORDER BY reg_descricao';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get region by ID
app.get('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM regioes WHERE reg_codigo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new region
app.post('/api/v2/regions', async (req, res) => {
    try {
        const { reg_descricao } = req.body;
        if (!reg_descricao) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO regioes (reg_descricao) VALUES ($1) RETURNING *';
        const result = await pool.query(query, [reg_descricao]);
        res.json({ success: true, data: result.rows[0], message: 'Região criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update region
app.put('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reg_descricao } = req.body;
        const result = await pool.query('UPDATE regioes SET reg_descricao = $1 WHERE reg_codigo = $2 RETURNING *', [reg_descricao, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, data: result.rows[0], message: 'Região atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete region
app.delete('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM regioes WHERE reg_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, message: 'Região excluída!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Região em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- CITIES (V2) ---

// GET - List all cities (for combobox)
// GET - List all cities (for combobox)
app.get('/api/v2/cities', async (req, res) => {
    try {
        const { search = '', limit = 20 } = req.query;

        let query = 'SELECT cid_codigo, cid_nome, cid_uf FROM cidades WHERE cid_ativo = true';
        const params = [];

        if (search) {
            query += ' AND cid_nome ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY cid_nome LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List cities of a specific region
app.get('/api/v2/regions/:id/cities', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT c.cid_codigo, c.cid_nome, c.cid_uf 
            FROM cidades c
            INNER JOIN cidades_regioes cr ON c.cid_codigo = cr.cid_id
            WHERE cr.reg_id = $1
            ORDER BY c.cid_nome
        `;
        const result = await pool.query(query, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Add city to region
app.post('/api/v2/regions/:id/cities', async (req, res) => {
    try {
        const { id } = req.params;
        const { cid_id } = req.body;

        // Check if association already exists
        const checkQuery = 'SELECT * FROM cidades_regioes WHERE reg_id = $1 AND cid_id = $2';
        const checkResult = await pool.query(checkQuery, [id, cid_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Cidade já está nesta região' });
        }

        const query = 'INSERT INTO cidades_regioes (reg_id, cid_id) VALUES ($1, $2)';
        await pool.query(query, [id, cid_id]);
        res.json({ success: true, message: 'Cidade adicionada à região!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Remove city from region
app.delete('/api/v2/regions/:regionId/cities/:cityId', async (req, res) => {
    try {
        const { regionId, cityId } = req.params;
        const result = await pool.query(
            'DELETE FROM cidades_regioes WHERE reg_id = $1 AND cid_id = $2 RETURNING *',
            [regionId, cityId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Associação não encontrada' });
        }

        res.json({ success: true, message: 'Cidade removida da região!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- SETORES (Subdivisões de Cidades) ---

// GET - List all sectors (optionally filtered by city)
app.get('/api/v2/sectors', async (req, res) => {
    const tenantCnpj = req.headers['x-tenant-cnpj'];
    console.log(`🔍 [SECTORS] HIT | Tenant: ${tenantCnpj} | city_id: ${req.query.city_id}`);

    try {
        const { city_id } = req.query;

        let query = `
            SELECT s.*, c.cid_nome, c.cid_uf 
            FROM setores s
            LEFT JOIN cidades c ON s.set_cidade_id = c.cid_codigo
            WHERE 1=1
        `;
        const params = [];

        if (city_id && city_id !== 'undefined' && city_id !== 'null') {
            query += ' AND s.set_cidade_id = $1';
            params.push(parseInt(city_id)); // Use parseInt for safety
        }

        query += ' ORDER BY s.set_descricao';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ [SECTORS] Error:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar setores: ${error.message}`,
            details: error.stack,
            poolSource: getCurrentPool() ? 'Tenant' : 'Master FALLBACK'
        });
    }
});

// GET - Get sector by ID
app.get('/api/v2/sectors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT s.*, c.cid_nome, c.cid_uf 
            FROM setores s
            LEFT JOIN cidades c ON s.set_cidade_id = c.cid_codigo
            WHERE s.set_codigo = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Setor não encontrado' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new sector
app.post('/api/v2/sectors', async (req, res) => {
    try {
        const { set_descricao, set_cidade_id, set_ordem, set_cor, set_observacao } = req.body;

        if (!set_descricao || !set_cidade_id) {
            return res.status(400).json({ success: false, message: 'Descrição e Cidade são obrigatórios' });
        }

        const query = `
            INSERT INTO setores (set_descricao, set_cidade_id, set_ordem, set_cor, set_observacao)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            set_descricao,
            set_cidade_id,
            set_ordem || 0,
            set_cor || '#3B82F6',
            set_observacao || null
        ]);

        res.json({ success: true, data: result.rows[0], message: 'Setor criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update sector
app.put('/api/v2/sectors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { set_descricao, set_cidade_id, set_ordem, set_cor, set_observacao, set_ativo } = req.body;

        const query = `
            UPDATE setores SET
                set_descricao = COALESCE($1, set_descricao),
                set_cidade_id = COALESCE($2, set_cidade_id),
                set_ordem = COALESCE($3, set_ordem),
                set_cor = COALESCE($4, set_cor),
                set_observacao = $5,
                set_ativo = COALESCE($6, set_ativo),
                updated_at = NOW()
            WHERE set_codigo = $7
            RETURNING *
        `;
        const result = await pool.query(query, [
            set_descricao,
            set_cidade_id,
            set_ordem,
            set_cor,
            set_observacao,
            set_ativo,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Setor não encontrado' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Setor atualizado!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete sector (soft delete)
app.delete('/api/v2/sectors/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if sector has clients
        const clientCheck = await pool.query('SELECT COUNT(*) as cnt FROM clientes WHERE cli_setor_id = $1', [id]);
        if (parseInt(clientCheck.rows[0].cnt) > 0) {
            return res.status(400).json({
                success: false,
                message: `Setor possui ${clientCheck.rows[0].cnt} cliente(s) vinculado(s). Remova-os primeiro.`
            });
        }

        const result = await pool.query('DELETE FROM setores WHERE set_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Setor não encontrado' });
        }

        res.json({ success: true, message: 'Setor excluído!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List clients in a sector
app.get('/api/v2/sectors/:id/clients', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT cli_codigo, cli_nome, cli_endereco, cli_telefone, cli_cidade
            FROM clientes
            WHERE cli_setor_id = $1 AND cli_ativo = true
            ORDER BY cli_nome
        `, [id]);

        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- ITINERÁRIOS (Rotas de Visita) ---

// GET - List all itineraries
app.get('/api/v2/itineraries', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, v.ven_nome 
            FROM itinerarios i
            LEFT JOIN vendedores v ON i.iti_vendedor_id = v.ven_codigo
            WHERE i.iti_ativo = true
            ORDER BY i.iti_descricao
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get itinerary details (with items)
app.get('/api/v2/itineraries/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Header
        const headerRes = await pool.query('SELECT * FROM itinerarios WHERE iti_codigo = $1', [id]);
        if (headerRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Itinerário não encontrado' });
        }

        // Check if tables exist in the current schema to avoid 42P01
        const tablesCheckRes = await pool.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = current_schema() 
            AND tablename IN ('cidades', 'setores')
        `);
        const foundTables = tablesCheckRes.rows.map(r => r.tablename);
        const hasCidades = foundTables.includes('cidades');
        const hasSetores = foundTables.includes('setores');

        // Items - Conditional Join
        let query = `
            SELECT it.*, 
                   ${hasCidades ? "c.cid_nome, c.cid_uf" : "'' as cid_nome, '' as cid_uf"}, 
                   ${hasSetores ? "s.set_descricao, s.set_cor" : "'' as set_descricao, '#3B82F6' as set_cor"}
            FROM itinerarios_itens it
        `;

        if (hasCidades) query += ` LEFT JOIN cidades c ON it.ite_cidade_id = c.cid_codigo `;
        if (hasSetores) query += ` LEFT JOIN setores s ON it.ite_setor_id = s.set_codigo `;

        query += ` WHERE it.ite_itinerario_id = $1 ORDER BY it.ite_ordem `;

        const itemsRes = await pool.query(query, [id]);

        res.json({
            success: true,
            data: {
                ...headerRes.rows[0],
                items: itemsRes.rows
            }
        });
    } catch (error) {
        console.error('❌ [GET ITINERARY DETAILS] Error:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao carregar detalhes do itinerário: ${error.message}`
        });
    }
});

// DEBUG - Verificar bancos e tabelas
app.get('/api/v2/debug-db', async (req, res) => {
    try {
        const tenantCnpj = req.headers['x-tenant-cnpj'];
        const currentPool = getCurrentPool();

        // Query de contexto
        const ctxRes = await pool.query('SELECT current_database(), current_schema()');
        const pathRes = await pool.query('SHOW search_path');

        // Tabelas disponíveis no schema atual
        const tablesRes = await pool.query(`
            SELECT schemaname, tablename 
            FROM pg_tables 
            WHERE schemaname = current_schema()
            AND tablename IN ('itinerarios', 'itinerarios_itens', 'campanhas_promocionais', 'setores', 'cidades')
        `);

        res.json({
            success: true,
            debug: {
                tenantCnpj,
                hasTenantDbConfig: !!req.headers['x-tenant-db-config'],
                hasCurrentPool: !!currentPool,
                database: ctxRes.rows[0].current_database,
                schema: ctxRes.rows[0].current_schema,
                searchPath: pathRes.rows[0].search_path,
                tablesFound: tablesRes.rows,
                headers: {
                    'x-tenant-cnpj': req.headers['x-tenant-cnpj'] || 'MISSING',
                    'x-access-token': req.headers['x-access-token'] ? 'PRESENT' : 'MISSING'
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST - Create itinerary with items
app.post('/api/v2/itineraries', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { iti_descricao, iti_vendedor_id, iti_frequencia, iti_observacao, items } = req.body;
        console.log(`📝 [POST ITINERARY] Saving: ${iti_descricao} | Items: ${items?.length || 0}`);

        // 1. Create Header
        const headerRes = await client.query(`
            INSERT INTO itinerarios (iti_descricao, iti_vendedor_id, iti_frequencia, iti_observacao)
            VALUES ($1, $2, $3, $4)
            RETURNING iti_codigo
        `, [iti_descricao, (iti_vendedor_id === 0 || !iti_vendedor_id) ? null : iti_vendedor_id, iti_frequencia || 'SEMANAL', iti_observacao]);

        const itiId = headerRes.rows[0].iti_codigo;

        // 2. Create Items
        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                await client.query(`
                    INSERT INTO itinerarios_itens (ite_itinerario_id, ite_tipo, ite_cidade_id, ite_setor_id, ite_ordem)
                    VALUES ($1, $2, $3, $4, $5)
                `, [itiId, item.ite_tipo, item.ite_cidade_id, item.ite_setor_id, i]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Itinerário criado com sucesso!', id: itiId });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// PUT - Update itinerary
app.put('/api/v2/itineraries/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { iti_descricao, iti_vendedor_id, iti_frequencia, iti_observacao, iti_ativo, items } = req.body;
        console.log(`📝 [PUT ITINERARY] Updating ${id}: ${iti_descricao} | Items: ${items?.length || 0}`);

        // 1. Update Header
        await client.query(`
            UPDATE itinerarios SET
                iti_descricao = COALESCE($1, iti_descricao),
                iti_vendedor_id = $2,
                iti_frequencia = COALESCE($3, iti_frequencia),
                iti_observacao = $4,
                iti_ativo = COALESCE($5, iti_ativo),
                updated_at = NOW()
            WHERE iti_codigo = $6
        `, [iti_descricao, (iti_vendedor_id === 0 || !iti_vendedor_id) ? null : iti_vendedor_id, iti_frequencia, iti_observacao, iti_ativo, id]);

        // 2. Replace Items (Delete all and re-insert) - Simplest strategy
        if (items) {
            await client.query('DELETE FROM itinerarios_itens WHERE ite_itinerario_id = $1', [id]);

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                await client.query(`
                    INSERT INTO itinerarios_itens (ite_itinerario_id, ite_tipo, ite_cidade_id, ite_setor_id, ite_ordem)
                    VALUES ($1, $2, $3, $4, $5)
                `, [id, item.ite_tipo, item.ite_cidade_id, item.ite_setor_id, i]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Itinerário atualizado!' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// DELETE - Delete itinerary
app.delete('/api/v2/itineraries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade delete will handle items
        await pool.query('DELETE FROM itinerarios WHERE iti_codigo = $1', [id]);
        res.json({ success: true, message: 'Itinerário excluído!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- CAMPAIGN MANAGER (Campanhas Promocionais) ---

/**
 * Calcula a quantidade de dias úteis entre duas datas (Segunda a Sábado)
 */
function getBusinessDays(startDate, endDate) {
    let count = 0;
    let curDate = new Date(startDate);
    const end = new Date(endDate);

    // Normalizar para evitar problemas de fuso horário
    curDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0) { // 0 = Domingo
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

app.post('/api/v2/campaigns/simulate', async (req, res) => {
    try {
        const {
            client_id,
            industry_id,
            base_start,
            base_end,
            campaign_start,
            campaign_end,
            growth_percent
        } = req.body;

        if (!client_id || !industry_id || !base_start || !base_end) {
            return res.status(400).json({ success: false, message: 'Dados insuficientes para simulação.' });
        }

        // 1. Calculate History (Baseline)
        const historyQuery = `
            SELECT 
                COALESCE(SUM(i.ite_totliquido), 0) as total_value,
                COALESCE(SUM(i.ite_quant), 0) as total_qty
            FROM itens_ped i
            JOIN pedidos p ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_cliente = $1
              AND i.ite_industria = $2
              AND p.ped_data BETWEEN $3 AND $4
              AND p.ped_situacao IN ('P', 'F', 'B')
        `;

        const historyRes = await pool.query(historyQuery, [client_id, industry_id, base_start, base_end]);
        const baseValue = parseFloat(historyRes.rows[0].total_value);
        const baseQty = parseFloat(historyRes.rows[0].total_qty);

        // 2. Calculate Business Days (Mon-Sat)
        const baseDays = Math.max(1, getBusinessDays(base_start, base_end));
        const campDays = Math.max(1, getBusinessDays(campaign_start, campaign_end));

        // 3. Averages
        const dailyAvgVal = baseValue / baseDays;
        const dailyAvgQty = baseQty / baseDays;

        // 4. Projections (Targets)
        const growthFactor = 1 + (parseFloat(growth_percent || 0) / 100);

        const targetDailyVal = dailyAvgVal * growthFactor;
        const targetDailyQty = dailyAvgQty * growthFactor;

        const targetTotalVal = targetDailyVal * campDays;
        const targetTotalQty = targetDailyQty * campDays;

        res.json({
            success: true,
            data: {
                base: {
                    days: baseDays,
                    total_value: baseValue,
                    total_qty: baseQty,
                    daily_avg_value: dailyAvgVal,
                    daily_avg_qty: dailyAvgQty
                },
                projection: {
                    days: campDays,
                    growth_percent: parseFloat(growth_percent || 0),
                    target_daily_value: targetDailyVal,
                    target_daily_qty: targetDailyQty,
                    target_total_value: targetTotalVal,
                    target_total_qty: targetTotalQty
                }
            }
        });

    } catch (error) {
        console.error('❌ [CAMPAIGN SIMULATION] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create Campaign
app.post('/api/v2/campaigns', async (req, res) => {
    try {
        const {
            cmp_descricao,
            cmp_cliente_id,
            cmp_industria_id,
            cmp_promotor_id,
            cmp_periodo_base_ini,
            cmp_periodo_base_fim,
            cmp_campanha_ini,
            cmp_campanha_fim,
            cmp_perc_crescimento,
            simulation_data,
            cmp_observacao,
            // Novos Campos
            cmp_setor,
            cmp_regiao,
            cmp_equipe_vendas,
            cmp_verba_solicitada,
            cmp_tema,
            cmp_tipo_periodo
        } = req.body;

        const { base, projection } = simulation_data;

        const result = await pool.query(`
            INSERT INTO campanhas_promocionais (
                cmp_descricao, cmp_cliente_id, cmp_industria_id, cmp_promotor_id,
                cmp_periodo_base_ini, cmp_periodo_base_fim, cmp_campanha_ini, cmp_campanha_fim,
                cmp_base_dias_kpi, cmp_base_valor_total, cmp_base_qtd_total,
                cmp_base_media_diaria_val, cmp_base_media_diaria_qtd,
                cmp_perc_crescimento,
                cmp_meta_valor_total, cmp_meta_qtd_total,
                cmp_meta_diaria_val, cmp_meta_diaria_qtd,
                cmp_observacao,
                cmp_setor, cmp_regiao, cmp_equipe_vendas, 
                cmp_verba_solicitada, cmp_tema, cmp_tipo_periodo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24, $25
            ) RETURNING cmp_codigo
        `, [
            cmp_descricao, cmp_cliente_id, cmp_industria_id, cmp_promotor_id,
            cmp_periodo_base_ini, cmp_periodo_base_fim, cmp_campanha_ini, cmp_campanha_fim,
            base.days, base.total_value, base.total_qty,
            base.daily_avg_value, base.daily_avg_qty,
            cmp_perc_crescimento,
            projection.target_total_value, projection.target_total_qty,
            projection.target_daily_value, projection.target_daily_qty,
            cmp_observacao,
            cmp_setor, cmp_regiao, cmp_equipe_vendas || 0,
            cmp_verba_solicitada || 0, cmp_tema, cmp_tipo_periodo
        ]);

        res.json({ success: true, message: "Campanha criada com sucesso!", id: result.rows[0].cmp_codigo });

    } catch (error) {
        console.error('❌ [CREATE CAMPAIGN] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update Campaign
app.put('/api/v2/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            cmp_descricao,
            cmp_cliente_id,
            cmp_industria_id,
            cmp_promotor_id,
            cmp_periodo_base_ini,
            cmp_periodo_base_fim,
            cmp_campanha_ini,
            cmp_campanha_fim,
            cmp_perc_crescimento,
            cmp_observacao,
            cmp_status,
            // Novos Campos
            cmp_setor,
            cmp_regiao,
            cmp_equipe_vendas,
            cmp_verba_solicitada,
            cmp_tema,
            cmp_tipo_periodo,
            cmp_justificativa,
            cmp_premiacoes,
            cmp_real_valor_total,
            cmp_real_qtd_total
        } = req.body;

        await pool.query(`
            UPDATE campanhas_promocionais SET
                cmp_descricao = COALESCE($1, cmp_descricao),
                cmp_cliente_id = COALESCE($2, cmp_cliente_id),
                cmp_industria_id = COALESCE($3, cmp_industria_id),
                cmp_promotor_id = $4,
                cmp_periodo_base_ini = COALESCE($5, cmp_periodo_base_ini),
                cmp_periodo_base_fim = COALESCE($6, cmp_periodo_base_fim),
                cmp_campanha_ini = COALESCE($7, cmp_campanha_ini),
                cmp_campanha_fim = COALESCE($8, cmp_campanha_fim),
                cmp_perc_crescimento = COALESCE($9, cmp_perc_crescimento),
                cmp_observacao = $10,
                cmp_status = COALESCE($11, cmp_status),
                cmp_setor = COALESCE($12, cmp_setor),
                cmp_regiao = COALESCE($13, cmp_regiao),
                cmp_equipe_vendas = COALESCE($14, cmp_equipe_vendas),
                cmp_verba_solicitada = COALESCE($15, cmp_verba_solicitada),
                cmp_tema = COALESCE($16, cmp_tema),
                cmp_tipo_periodo = COALESCE($17, cmp_tipo_periodo),
                cmp_justificativa = $18,
                cmp_premiacoes = $19,
                cmp_real_valor_total = COALESCE($20, cmp_real_valor_total),
                cmp_real_qtd_total = COALESCE($21, cmp_real_qtd_total),
                cmp_data_atualizacao = NOW()
            WHERE cmp_codigo = $22
        `, [
            cmp_descricao, cmp_cliente_id, cmp_industria_id, cmp_promotor_id,
            cmp_periodo_base_ini, cmp_periodo_base_fim, cmp_campanha_ini, cmp_campanha_fim,
            cmp_perc_crescimento, cmp_observacao, cmp_status,
            cmp_setor, cmp_regiao, cmp_equipe_vendas, cmp_verba_solicitada,
            cmp_tema, cmp_tipo_periodo, cmp_justificativa, cmp_premiacoes,
            cmp_real_valor_total, cmp_real_qtd_total,
            id
        ]);

        res.json({ success: true, message: "Campanha atualizada com sucesso!" });
    } catch (error) {
        console.error('❌ [UPDATE CAMPAIGN] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- CAMPAIGN TRACKING ---

// GET - List Tracking for a Campaign
app.get('/api/v2/campaigns/:id/tracking', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT * FROM campanhas_tracking 
            WHERE tra_campanha_id = $1 
            ORDER BY tra_data DESC, tra_id DESC
        `, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ [GET TRACKING] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Add Tracking Log
app.post('/api/v2/campaigns/:id/tracking', async (req, res) => {
    try {
        const { id } = req.params;
        const { tra_data, tra_vlr_acumulado, tra_qtd_acumulada, tra_observacao } = req.body;

        const result = await pool.query(`
            INSERT INTO campanhas_tracking (
                tra_campanha_id, tra_data, tra_vlr_acumulado, tra_qtd_acumulada, tra_observacao
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [id, tra_data || new Date(), tra_vlr_acumulado || 0, tra_qtd_acumulada || 0, tra_observacao]);

        // Atualizar o valor "Realizado" na tabela principal para o valor mais recente
        await pool.query(`
            UPDATE campanhas_promocionais SET
                cmp_real_valor_total = $1,
                cmp_real_qtd_total = $2,
                cmp_data_atualizacao = NOW()
            WHERE cmp_codigo = $3
        `, [tra_vlr_acumulado || 0, tra_qtd_acumulada || 0, id]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('❌ [POST TRACKING] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Remove Tracking Log
app.delete('/api/v2/campaigns/tracking/:tid', async (req, res) => {
    try {
        const { tid } = req.params;

        const trackRes = await pool.query('SELECT tra_campanha_id FROM campanhas_tracking WHERE tra_id = $1', [tid]);
        if (trackRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Log não encontrado.' });
        }
        const campId = trackRes.rows[0].tra_campanha_id;

        await pool.query('DELETE FROM campanhas_tracking WHERE tra_id = $1', [tid]);

        const latestRes = await pool.query(`
            SELECT tra_vlr_acumulado, tra_qtd_acumulada 
            FROM campanhas_tracking 
            WHERE tra_campanha_id = $1 
            ORDER BY tra_data DESC, tra_id DESC 
            LIMIT 1
        `, [campId]);

        const latestVal = latestRes.rows.length > 0 ? latestRes.rows[0].tra_vlr_acumulado : 0;
        const latestQtd = latestRes.rows.length > 0 ? latestRes.rows[0].tra_qtd_acumulada : 0;

        await pool.query(`
            UPDATE campanhas_promocionais SET
                cmp_real_valor_total = $1,
                cmp_real_qtd_total = $2,
                cmp_data_atualizacao = NOW()
            WHERE cmp_codigo = $3
        `, [latestVal, latestQtd, campId]);

        res.json({ success: true, message: "Log removido com sucesso!" });
    } catch (error) {
        console.error('❌ [DELETE TRACKING] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List Campaigns
app.get('/api/v2/campaigns', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                cli.cli_nome, cli.cli_fantasia, cli.cli_nomred,
                f.for_nome as industria_nome
            FROM campanhas_promocionais c
            LEFT JOIN clientes cli ON c.cmp_cliente_id = cli.cli_codigo
            LEFT JOIN fornecedores f ON c.cmp_industria_id = f.for_codigo
            ORDER BY c.cmp_codigo DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- GEOLOCALIZAÇÃO & ROTEIRIZAÇÃO ---

// Helper: Haversine Formula (Calcular distância em Metros)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// POST - Check-in Visita (Com validação de Raio)
app.post('/api/visitas/checkin', async (req, res) => {
    try {
        const { promotor_id, cliente_id, itinerario_id, latitude, longitude } = req.body;

        // 1. Get Client Coordinates
        const clientRes = await pool.query('SELECT cli_latitude, cli_longitude, cli_raio_permitido FROM clientes WHERE cli_codigo = $1', [cliente_id]);

        if (clientRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        const client = clientRes.rows[0];
        let distancia = null;
        let valido = true; // Default true if client has no coords yet (first visit sets it?)
        let obs = '';

        // 2. Calculate Distance (if client has coords)
        if (client.cli_latitude && client.cli_longitude) {
            distancia = calculateDistance(latitude, longitude, parseFloat(client.cli_latitude), parseFloat(client.cli_longitude));
            const raio = client.cli_raio_permitido || 300;

            if (distancia > raio) {
                valido = false;
                obs = `Check-in fora do raio permitido. Distância: ${Math.round(distancia)}m (Limite: ${raio}m)`;
            } else {
                obs = `Check-in válido. Distância: ${Math.round(distancia)}m`;
            }
        } else {
            obs = 'Primeira visita geo-referenciada. Coordenadas do cliente atualizadas.';
            // Configurable: Update client coords on first visit? Let's assume YES for now to build base
            // await pool.query('UPDATE clientes SET cli_latitude = $1, cli_longitude = $2 WHERE cli_codigo = $3', [latitude, longitude, cliente_id]);
        }

        // 3. Register Visit
        await pool.query(`
            INSERT INTO registro_visitas 
            (vis_promotor_id, vis_cliente_id, vis_itinerario_id, vis_latitude_checkin, vis_longitude_checkin, vis_distancia_metros, vis_valido, vis_observacao)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [promotor_id, cliente_id, itinerario_id, latitude, longitude, distancia ? Math.round(distancia) : 0, valido, obs]);

        res.json({
            success: true,
            valido,
            distancia: distancia ? Math.round(distancia) : 0,
            message: valido ? 'Check-in realizado com sucesso!' : 'ALERTA: Você está longe do local cadastrado.'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Sugestão de Rota (Nearest Neighbor das Cidades)
app.get('/api/roteirizacao/sugestao', async (req, res) => {
    try {
        const { origem_cidade_id } = req.query;

        // 1. Get "Center of Gravity" for all cities with active clients
        // We calculate the AVG lat/long of clients in each city to find where the city "is"
        const citiesRes = await pool.query(`
            SELECT 
                c.cid_codigo, 
                c.cid_nome, 
                c.cid_uf,
                AVG(cli.cli_latitude) as lat,
                AVG(cli.cli_longitude) as long,
                COUNT(cli.cli_codigo) as total_clientes
            FROM clientes cli
            JOIN cidades c ON cli.cli_idcidade = c.cid_codigo
            WHERE cli.cli_tipopes = 'A' 
              AND cli.cli_latitude IS NOT NULL
            GROUP BY c.cid_codigo, c.cid_nome, c.cid_uf
            HAVING AVG(cli.cli_latitude) IS NOT NULL
        `);

        let cities = citiesRes.rows.map(c => ({
            ...c,
            lat: parseFloat(c.lat),
            long: parseFloat(c.long),
            total_clientes: parseInt(c.total_clientes)
        }));

        // 2. Find Origin
        const origin = cities.find(c => c.cid_codigo === parseInt(origem_cidade_id));

        if (!origin) {
            // Se a cidade de origem não tem geolocalização ainda, retornamos lista simples
            return res.json({ success: false, message: 'Cidade de origem sem coordenadas suficientes para cálculo.' });
        }

        // 3. Simple Nearest Sort (Greedy)
        // Sort other cities by distance from Origin
        const suggestions = cities
            .filter(c => c.cid_codigo !== origin.cid_codigo)
            .map(c => ({
                ...c,
                distancia_estimada: calculateDistance(origin.lat, origin.long, c.lat, c.long) / 1000 // Km
            }))
            .sort((a, b) => a.distancia_estimada - b.distancia_estimada)
            .slice(0, 10); // Top 10 nearest cities

        res.json({
            success: true,
            origem: origin,
            sugestoes: suggestions
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- ACTIVITY AREAS (V2) ---

// GET - List all activity areas
app.get('/api/v2/activity-areas', async (req, res) => {
    try {
        const query = 'SELECT * FROM area_atu ORDER BY atu_descricao';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get activity area by ID
app.get('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM area_atu WHERE atu_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new activity area
app.post('/api/v2/activity-areas', async (req, res) => {
    try {
        const { atu_descricao, atu_sel, gid } = req.body;
        if (!atu_descricao) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO area_atu (atu_descricao, atu_sel, gid) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [atu_descricao, atu_sel || '', gid || '']);
        res.json({ success: true, data: result.rows[0], message: 'Área de atuação criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update activity area
app.put('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { atu_descricao, atu_sel, gid } = req.body;
        const result = await pool.query(
            'UPDATE area_atu SET atu_descricao = $1, atu_sel = $2, gid = $3 WHERE atu_id = $4 RETURNING *',
            [atu_descricao, atu_sel, gid, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, data: result.rows[0], message: 'Área de atuação atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete activity area
app.delete('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM area_atu WHERE atu_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, message: 'Área de atuação excluída!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Área de atuação em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- CARRIERS (TRANSPORTADORAS) (V2) ---
// Adicionar estas linhas ANTES de "// Test Firebird Connection" (linha 522)

// GET - List all carriers
app.get('/api/v2/carriers', async (req, res) => {
    try {
        const { pesquisa, limit = 100 } = req.query;
        const numLimit = parseInt(limit) || 100;

        let query = 'SELECT tra_codigo, tra_nome, tra_cgc, tra_cidade, tra_uf, tra_fone FROM transportadora WHERE 1=1';
        const params = [numLimit];

        if (pesquisa && pesquisa.trim() !== '') {
            params.push(`%${pesquisa}%`);
            query += ` AND (tra_nome ILIKE $2 OR tra_codigo::text ILIKE $2 OR tra_cgc ILIKE $2)`;
            query += ` ORDER BY tra_nome LIMIT $1`;
        } else {
            query += ` ORDER BY tra_nome LIMIT $1`;
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ [CARRIERS] ERRO:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get carrier by ID
app.get('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM transportadora WHERE tra_codigo = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Fetch carrier data from CNPJ (ReceitaWS)
app.get('/api/v2/carriers/cnpj/:cnpj', async (req, res) => {
    try {
        const { cnpj } = req.params;
        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
        const data = await response.json();

        if (data.status === 'ERROR') {
            return res.status(404).json({ success: false, message: data.message || 'CNPJ não encontrado' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new carrier
app.post('/api/v2/carriers', async (req, res) => {
    try {
        const {
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists
        if (tra_cgc) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cgc = $1';
            const checkResult = await pool.query(checkQuery, [tra_cgc]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
            }
        }

        const query = `
            INSERT INTO transportadora (
                tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
                tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
                tra_inscricao, tra_obs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        ]);

        res.json({ success: true, message: 'Transportadora criada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// CATEGORIAS DE PRODUTOS (categoria_prod)
// ==========================================

// GET - Listar todas as categorias
app.get('/api/v2/product-categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categoria_prod ORDER BY cat_id');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Buscar categoria por ID
app.get('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categoria_prod WHERE cat_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar nova categoria
app.post('/api/v2/product-categories', async (req, res) => {
    try {
        const { cat_descricao } = req.body;

        if (!cat_descricao) {
            return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
        }

        const result = await pool.query(
            'INSERT INTO categoria_prod (cat_descricao) VALUES ($1) RETURNING *',
            [cat_descricao]
        );
        res.json({ success: true, data: result.rows[0], message: 'Categoria criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Atualizar categoria
app.put('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cat_descricao } = req.body;

        const result = await pool.query(
            'UPDATE categoria_prod SET cat_descricao = $1 WHERE cat_id = $2 RETURNING *',
            [cat_descricao, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, data: result.rows[0], message: 'Categoria atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Excluir categoria
app.delete('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM categoria_prod WHERE cat_id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, message: 'Categoria excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update carrier
app.put('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists for another carrier
        if (tra_cgc) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cgc = $1 AND tra_codigo != $2';
            const checkResult = await pool.query(checkQuery, [tra_cgc, id]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado para outra transportadora' });
            }
        }

        const query = `
            UPDATE transportadora SET
                tra_nome = $1, tra_cgc = $2, tra_endereco = $3, tra_bairro = $4,
                tra_cidade = $5, tra_uf = $6, tra_cep = $7, tra_fone = $8,
                tra_contato = $9, tra_email = $10,
                tra_inscricao = $11, tra_obs = $12
            WHERE tra_codigo = $13
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora atualizada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete carrier
app.delete('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transportadora WHERE tra_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora excluída!' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Transportadora em uso, não pode ser excluída' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== ORDER PRINTING ENDPOINTS ====================
require('./order_print_endpoints')(app, pool);

// ==================== PRICE TABLES ENDPOINTS ====================

// Endpoints are registered at the end of the file starting from line 4790

// ==================== USERS ENDPOINTS ====================
// Import users routes for user management
const usersRouter = require('./users_endpoints')(pool);
app.use('/api/users', usersRouter);

// ==================== AUXILIARY DATA ENDPOINTS ====================
// (Consolidated into aux_endpoints.js)


// ==================== DATABASE CONFIGURATION ENDPOINTS ====================

// GET current database configuration
app.get('/api/config/database', (req, res) => {
    res.json({
        success: true,
        config: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'basesales',
            user: process.env.DB_USER || 'postgres',
            ssl: process.env.DB_SSL === 'true'
        }
    });
});

// POST test database connection
app.post('/api/config/database/test', async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    const testPool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
    });

    try {
        const client = await testPool.connect();
        await client.query('SELECT 1');
        client.release();
        await testPool.end();

        res.json({
            success: true,
            message: '✅ Conexão testada com sucesso!'
        });
    } catch (error) {
        await testPool.end();
        res.json({
            success: false,
            message: `❌ Erro ao conectar: ${error.message}`
        });
    }
});

// POST save database configuration
app.post('/api/config/database/save', async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    try {
        // Ler arquivo .env atual
        const envPath = path.join(__dirname, '.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Atualizar variáveis
        const updateEnv = (key, value) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        };

        updateEnv('DB_HOST', host);
        updateEnv('DB_PORT', port);
        updateEnv('DB_NAME', database);
        updateEnv('DB_USER', user);
        updateEnv('DB_PASSWORD', password);
        updateEnv('DB_SSL', ssl);

        // Salvar arquivo
        fs.writeFileSync(envPath, envContent.trim() + '\n');

        res.json({
            success: true,
            message: '✅ Configuração salva com sucesso! Reinicie o servidor para aplicar as mudanças.'
        });
    } catch (error) {
        res.json({
            success: false,
            message: `❌ Erro ao salvar configuração: ${error.message}`
        });
    }
});

// ==================== COMPANY CONFIGURATION ENDPOINTS ====================

// GET current company configuration from PostgreSQL
app.get('/api/config/company', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresa_status WHERE emp_id = 1');

        if (result.rows.length > 0) {
            const row = result.rows[0];
            res.json({
                success: true,
                config: {
                    situacao: row.emp_situacao?.trim() || 'A',
                    nome: row.emp_nome || '',
                    endereco: row.emp_endereco || '',
                    bairro: row.emp_bairro || '',
                    cidade: row.emp_cidade || '',
                    uf: row.emp_uf?.trim() || '',
                    cep: row.emp_cep || '',
                    cnpj: row.emp_cnpj || '',
                    inscricao: row.emp_inscricao || '',
                    fones: row.emp_fones || '',
                    logotipo: row.emp_logotipo || '',
                    baseDadosLocal: row.emp_basedadoslocal || '',
                    host: row.emp_host || 'localhost',
                    porta: row.emp_porta || 3070,
                    username: row.emp_username || 'SYSDBA',
                    password: row.emp_password || '',
                    pastaBasica: row.emp_pastabasica || ''
                }
            });
        } else {
            // Retornar configuração padrão se não existir
            res.json({
                success: true,
                config: {
                    situacao: 'A',
                    nome: 'SOFTHAM SISTEMAS - LOCAL',
                    endereco: 'R. SANTIAGO PERES UBINHA, 150',
                    bairro: 'JARDIM DOM NERY',
                    cidade: 'CAMPINAS',
                    uf: 'SP',
                    cep: '13.031-730',
                    cnpj: '17.504.829/0001-24',
                    inscricao: '',
                    fones: '(19) 3203-8600',
                    logotipo: 'C:\\SalesMasters\\Imagens\\Softham1.png',
                    baseDadosLocal: 'C:\\SalesMasters\\Dados50\\Nova\\BASESALES.FDB',
                    host: 'localhost',
                    porta: 3070,
                    username: 'SYSDBA',
                    password: '',
                    pastaBasica: 'C:\\SalesMasters\\'
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar configuração da empresa:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao carregar configuração: ${error.message}`
        });
    }
});

// POST save company configuration to PostgreSQL
app.post('/api/config/company/save', async (req, res) => {
    const config = req.body;

    try {
        // Garantir que a coluna emp_logotipo é TEXT para suportar Base64
        await pool.query(`ALTER TABLE empresa_status ALTER COLUMN emp_logotipo TYPE TEXT`).catch(() => { });

        // Verificar se existe registro
        const checkResult = await pool.query('SELECT emp_id FROM empresa_status WHERE emp_id = 1');

        if (checkResult.rows.length > 0) {
            // Update existing record
            await pool.query(`
                UPDATE empresa_status SET
                    emp_situacao = $1,
                    emp_nome = $2,
                    emp_endereco = $3,
                    emp_bairro = $4,
                    emp_cidade = $5,
                    emp_uf = $6,
                    emp_cep = $7,
                    emp_cnpj = $8,
                    emp_inscricao = $9,
                    emp_fones = $10,
                    emp_logotipo = $11,
                    emp_basedadoslocal = $12,
                    emp_host = $13,
                    emp_porta = $14,
                    emp_username = $15,
                    emp_password = $16,
                    emp_pastabasica = $17,
                    emp_dataatualizacao = CURRENT_TIMESTAMP
                WHERE emp_id = 1
            `, [
                config.situacao || 'A',
                config.nome,
                config.endereco,
                config.bairro,
                config.cidade,
                config.uf,
                config.cep,
                config.cnpj,
                config.inscricao,
                config.fones,
                config.logotipo,
                config.baseDadosLocal,
                config.host,
                config.porta,
                config.username,
                config.password,
                config.pastaBasica
            ]);
        } else {
            // Insert new record
            await pool.query(`
                INSERT INTO empresa_status (
                    emp_id, emp_situacao, emp_nome, emp_endereco, emp_bairro, emp_cidade,
                    emp_uf, emp_cep, emp_cnpj, emp_inscricao, emp_fones,
                    emp_logotipo, emp_basedadoslocal, emp_host, emp_porta,
                    emp_username, emp_password, emp_pastabasica
                ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
                config.situacao || 'A',
                config.nome,
                config.endereco,
                config.bairro,
                config.cidade,
                config.uf,
                config.cep,
                config.cnpj,
                config.inscricao,
                config.fones,
                config.logotipo,
                config.baseDadosLocal,
                config.host,
                config.porta,
                config.username,
                config.password,
                config.pastaBasica
            ]);
        }

        console.log('✅ Configuração da empresa salva no PostgreSQL:', config.nome);

        res.json({
            success: true,
            message: '✅ Configuração da empresa salva com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao salvar configuração da empresa:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao salvar configuração: ${error.message}`
        });
    }
});

// POST upload logo image
app.post('/api/config/company/upload-logo', uploadLogo.single('logo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        // Retorna o caminho onde foi realmente salvo
        const fullPath = path.join(req.file.destination, req.file.originalname);

        console.log('✅ Logo uploaded:', fullPath);

        res.json({
            success: true,
            path: fullPath,
            filename: req.file.originalname,
            message: '✅ Logo enviado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao fazer upload do logo:', error);
        res.status(500).json({
            success: false,
            message: `Erro no upload: ${error.message}`
        });
    }
});

// ==================== DASHBOARD ENDPOINTS ====================
// GET /api/dashboard/sales-comparison - Comparação de vendas mensais
app.get('/api/dashboard/sales-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;

        console.log(`📊 [DASHBOARD] Buscando comparação de vendas: ${anoAtual || 2025} vs ${anoAnterior || 2024}`);

        const result = await pool.query(
            'SELECT * FROM fn_comparacao_vendas_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} meses`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar comparação:', error);
        if (error.code === '42883') { // Undefined function
            console.warn('⚠️ Função fn_comparacao_vendas_mensais não existe. Retornando dados vazios.');
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            message: `Erro ao buscar comparação de vendas: ${error.message}`
        });
    }
});

// GET /api/dashboard/quantities-comparison - Comparação de quantidades mensais
app.get('/api/dashboard/quantities-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;

        console.log(`📊 [DASHBOARD] Buscando comparação de quantidades: ${anoAtual || 2025} vs ${anoAnterior || 2024}`);

        const result = await pool.query(
            'SELECT * FROM fn_comparacao_quantidades_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} meses`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar comparação de quantidades:', error);
        if (error.code === '42883') {
            console.warn('⚠️ Função fn_comparacao_quantidades_mensais não existe. Retornando dados vazios.');
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            message: `Erro ao buscar comparação de quantidades: ${error.message}`
        });
    }
});

// GET /api/dashboard/top-clients - Top 10 clientes por vendas
app.get('/api/dashboard/top-clients', async (req, res) => {
    try {
        const { ano, mes, limit = 10 } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando top ${limit} clientes: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_top_clients($1, $2, $3)',
            [parseInt(ano), mes ? parseInt(mes) : null, parseInt(limit)]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} clientes`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching top clients:', error);
        if (error.code === '42883') {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            message: `Erro ao buscar top clientes: ${error.message}`
        });
    }
});

// GET /api/dashboard/industry-revenue - Faturamento por indústria
app.get('/api/dashboard/industry-revenue', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando faturamento por indústria: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_industry_revenue($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} indústrias`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching industry revenue:', error);
        if (error.code === '42883') {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            message: `Erro ao buscar faturamento por indústria: ${error.message}`
        });
    }
});

// GET - Sales Performance by Seller
app.get('/api/dashboard/sales-performance', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando performance de vendedores: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_sales_performance($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} vendedores`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching sales performance:', error);
        if (error.code === '42883') {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            message: `Erro ao buscar performance de vendedores: ${error.message}`
        });
    }
});

// GET /api/dashboard/metrics - General dashboard metrics (total sales, quantity, clients, orders)
app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando métricas gerais: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : 0]
        );

        if (!result.rows || result.rows.length === 0) {
            console.log('⚠️ [DASHBOARD] Nenhum dado retornado pela função SQL');
            return res.json({
                success: true,
                data: {
                    total_vendido_current: 0,
                    vendas_percent_change: 0,
                    quantidade_vendida_current: 0,
                    quantidade_percent_change: 0,
                    clientes_atendidos_current: 0,
                    clientes_percent_change: 0,
                    total_pedidos_current: 0,
                    pedidos_percent_change: 0
                }
            });
        }

        console.log(`📊 [DASHBOARD] Métricas retornadas com sucesso`);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching dashboard metrics:', error);

        // Retorna objeto zerado padronizado em caso de erro para não quebrar o layout
        res.json({
            success: true,
            data: {
                total_vendido_current: 0,
                vendas_percent_change: 0,
                quantidade_vendida_current: 0,
                quantidade_percent_change: 0,
                clientes_atendidos_current: 0,
                clientes_percent_change: 0,
                total_pedidos_current: 0,
                pedidos_percent_change: 0
            }
        });
    }
});


// (Redundant products registration removed to avoid route hijacking)

// --- GESTÃO DE USUÁRIOS E PERMISSÕES ---
const userManagementRouter = require('./user_management_endpoints')(pool);
app.use('/api/v2/system', userManagementRouter);

// ==================== AUXILIARY ENDPOINTS ====================
// These endpoints provide data for form dropdowns



// (Redundant inline vendors route removed)

// (Redundant inline aux routes removed)

// Test Firebird Connection
app.post('/api/firebird/test', async (req, res) => {
    const { host, port, database, username, password, type } = req.body;

    if (!database || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Campos obrigatórios: database, username, password'
        });
    }

    const connectionString = `${type === 'remote' ? (host || 'localhost') : 'localhost'}/${port || 3050}:${database}`;

    const options = {
        user: username,
        password: password,
        lowercase_keys: false,
        role: null,
        pageSize: 4096
    };

    console.log('Tentando conectar ao Firebird:', {
        connectionString: connectionString,
        user: options.user
    });

    Firebird.attach(connectionString, options, (err, db) => {
        if (err) {
            console.error('Erro ao conectar:', err.message);

            if (err.message.includes('wire encryption')) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro de criptografia. Configure o Firebird para aceitar conexões sem criptografia. No firebird.conf, defina: WireCrypt = Enabled (não Required)'
                });
            }

            return res.status(500).json({
                success: false,
                message: `Erro ao conectar: ${err.message}`
            });
        }

        console.log('Conexão estabelecida com sucesso!');

        db.detach((detachErr) => {
            if (detachErr) {
                console.error('Erro ao desconectar:', detachErr.message);
            }
        });

        res.json({
            success: true,
            message: 'Conexão estabelecida com sucesso!'
        });
    });
});

// Test PostgreSQL Connection
app.post('/api/postgres/test', async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        res.json({
            success: true,
            message: 'Conexão com PostgreSQL estabelecida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao conectar: ${error.message}`
        });
    }
});

// Import Suppliers from CSV
app.post('/api/import/suppliers', async (req, res) => {
    const csvPath = path.join(__dirname, '../data/fornecedores.csv');

    if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
            success: false,
            message: 'Arquivo fornecedores.csv não encontrado em data/'
        });
    }

    const suppliers = [];
    let totalProcessed = 0;
    let totalInserted = 0;
    let errors = [];

    // Ler CSV
    fs.createReadStream(csvPath)
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
            suppliers.push(row);
        })
        .on('end', async () => {
            console.log(`Total de fornecedores no CSV: ${suppliers.length}`);

            // Processar cada fornecedor
            for (const supplier of suppliers) {
                totalProcessed++;

                try {
                    // Inserir diretamente na tabela fornecedores com estrutura original
                    const query = `
            INSERT INTO fornecedores (
              for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
              for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
              for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
              for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
              for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
            ON CONFLICT (for_codigo) DO UPDATE SET
              for_nome = EXCLUDED.for_nome,
              for_endereco = EXCLUDED.for_endereco,
              for_bairro = EXCLUDED.for_bairro,
              for_cidade = EXCLUDED.for_cidade,
              for_uf = EXCLUDED.for_uf,
              for_cep = EXCLUDED.for_cep,
              for_fone = EXCLUDED.for_fone,
              for_fone2 = EXCLUDED.for_fone2,
              for_fax = EXCLUDED.for_fax,
              for_cgc = EXCLUDED.for_cgc,
              for_inscricao = EXCLUDED.for_inscricao,
              for_email = EXCLUDED.for_email,
              for_tipo2 = EXCLUDED.for_tipo2
          `;

                    const values = [
                        parseInt(supplier.FOR_CODIGO) || null,
                        supplier.FOR_NOME || '',
                        supplier.FOR_ENDERECO || '',
                        supplier.FOR_BAIRRO || '',
                        supplier.FOR_CIDADE || '',
                        supplier.FOR_UF || '',
                        supplier.FOR_CEP || '',
                        supplier.FOR_FONE || '',
                        supplier.FOR_FONE2 || '',
                        supplier.FOR_FAX || '',
                        supplier.FOR_CGC || '',
                        supplier.FOR_INSCRICAO || '',
                        supplier.FOR_EMAIL || '',
                        parseInt(supplier.FOR_CODREP) || null,
                        parseFloat(supplier.FOR_PERCOM) || 0,
                        parseFloat(supplier.FOR_DES1) || 0,
                        parseFloat(supplier.FOR_DES2) || 0,
                        parseFloat(supplier.FOR_DES3) || 0,
                        parseFloat(supplier.FOR_DES4) || 0,
                        parseFloat(supplier.FOR_DES5) || 0,
                        parseFloat(supplier.FOR_DES6) || 0,
                        parseFloat(supplier.FOR_DES7) || 0,
                        parseFloat(supplier.FOR_DES8) || 0,
                        parseFloat(supplier.FOR_DES9) || 0,
                        parseFloat(supplier.FOR_DES10) || 0,
                        supplier.FOR_HOMEPAGE || '',
                        supplier.FOR_CONTATOREP || '',
                        supplier.FOR_NOMERED || '',
                        supplier.FOR_TIPO2 || 'A',
                        supplier.FOR_LOCIMAGEM || '',
                        supplier.GID || '',
                        supplier.FOR_TIPOFRETE || ''
                    ];

                    await pool.query(query, values);
                    totalInserted++;

                    console.log(`✓ Importado: ${supplier.FOR_NOME}`);
                } catch (error) {
                    errors.push({
                        supplier: supplier.FOR_NOME,
                        error: error.message
                    });
                    console.error(`✗ Erro ao importar ${supplier.FOR_NOME}:`, error.message);
                }
            }

            // Retornar resultado
            res.json({
                success: true,
                message: 'Importação concluída!',
                stats: {
                    total: suppliers.length,
                    processed: totalProcessed,
                    inserted: totalInserted,
                    errors: errors.length
                },
                errors: errors
            });
        })
        .on('error', (error) => {
            res.status(500).json({
                success: false,
                message: `Erro ao ler CSV: ${error.message}`
            });
        });
});

// Import suppliers from XLSX (melhor para preservar CNPJ)
app.post('/api/import/suppliers-xlsx', async (req, res) => {
    try {
        const xlsxPath = path.join(__dirname, '..', 'data', 'fornecedores.xlsx');

        if (!fs.existsSync(xlsxPath)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo fornecedores.xlsx não encontrado em data/'
            });
        }

        // Ler arquivo Excel
        const workbook = XLSX.readFile(xlsxPath, { cellText: false, cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converter para JSON mantendo strings
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Importante: mantém como string
            defval: ''
        });

        console.log(`Total de fornecedores no XLSX: ${data.length}`);

        let totalProcessed = 0;
        let totalInserted = 0;
        const errors = [];

        for (const row of data) {
            totalProcessed++;

            try {
                const query = `
                    INSERT INTO fornecedores (
                        for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
                        for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
                        for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
                        for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
                        for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
                    ON CONFLICT (for_codigo) DO UPDATE SET
                        for_nome = EXCLUDED.for_nome,
                        for_cgc = EXCLUDED.for_cgc,
                        for_nomered = EXCLUDED.for_nomered,
                        for_tipo2 = EXCLUDED.for_tipo2
                `;

                const values = [
                    parseInt(row.FOR_CODIGO) || 0,
                    row.FOR_NOME || '',
                    row.FOR_ENDERECO || '',
                    row.FOR_BAIRRO || '',
                    row.FOR_CIDADE || '',
                    row.FOR_UF || '',
                    row.FOR_CEP || '',
                    row.FOR_FONE || '',
                    row.FOR_FONE2 || '',
                    row.FOR_FAX || '',
                    String(row.FOR_CGC || ''), // IMPORTANTE: Forçar string
                    row.FOR_INSCRICAO || '',
                    row.FOR_EMAIL || '',
                    parseInt(row.FOR_CODREP) || null,
                    parseFloat(row.FOR_PERCOM) || 0,
                    parseFloat(row.FOR_DES1) || 0,
                    parseFloat(row.FOR_DES2) || 0,
                    parseFloat(row.FOR_DES3) || 0,
                    parseFloat(row.FOR_DES4) || 0,
                    parseFloat(row.FOR_DES5) || 0,
                    parseFloat(row.FOR_DES6) || 0,
                    parseFloat(row.FOR_DES7) || 0,
                    parseFloat(row.FOR_DES8) || 0,
                    parseFloat(row.FOR_DES9) || 0,
                    parseFloat(row.FOR_DES10) || 0,
                    row.FOR_HOMEPAGE || '',
                    row.FOR_CONTATOREP || '',
                    row.FOR_NOMERED || '',
                    row.FOR_TIPO2 || 'A',
                    row.FOR_LOCIMAGEM || '',
                    row.GID || '',
                    row.FOR_TIPOFRETE || ''
                ];

                await pool.query(query, values);
                totalInserted++;
                console.log(`✓ Importado: ${row.FOR_NOME}`);

            } catch (error) {
                console.error(`✗ Erro ao importar ${row.FOR_NOME}:`, error.message);
                errors.push({
                    row: totalProcessed,
                    name: row.FOR_NOME,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Importação concluída!',
            stats: {
                total: data.length,
                processed: totalProcessed,
                inserted: totalInserted,
                errors: errors.length
            },
            errors: errors
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao ler XLSX: ${error.message}`
        });
    }
});


// GET - Buscar fornecedor por ID
app.get('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM fornecedores WHERE for_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar fornecedor: ${error.message}`
        });
    }
});

// POST - Criar novo fornecedor
app.post('/api/suppliers', async (req, res) => {
    try {
        const supplier = req.body;

        // Se não vier código, buscar o próximo
        if (!supplier.for_codigo) {
            const maxRes = await pool.query('SELECT MAX(for_codigo) as max_id FROM fornecedores');
            supplier.for_codigo = (maxRes.rows[0].max_id || 0) + 1;
        }

        const query = `
            INSERT INTO fornecedores (
                for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
                for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
                for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
                for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
                for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete,
                for_logotipo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
            RETURNING *
        `;

        const values = [
            supplier.for_codigo,
            supplier.for_nome,
            supplier.for_endereco || '',
            supplier.for_bairro || '',
            supplier.for_cidade || '',
            supplier.for_uf || '',
            supplier.for_cep || '',
            supplier.for_fone || '',
            supplier.for_fone2 || '',
            supplier.for_fax || '',
            supplier.for_cgc,
            supplier.for_inscricao || '',
            supplier.for_email || '',
            supplier.for_codrep || null,
            supplier.for_percom || 0,
            supplier.for_des1 || 0,
            supplier.for_des2 || 0,
            supplier.for_des3 || 0,
            supplier.for_des4 || 0,
            supplier.for_des5 || 0,
            supplier.for_des6 || 0,
            supplier.for_des7 || 0,
            supplier.for_des8 || 0,
            supplier.for_des9 || 0,
            supplier.for_des10 || 0,
            supplier.for_homepage || '',
            supplier.for_contatorep || '',
            supplier.for_nomered,
            supplier.for_tipo2 || 'A',
            supplier.for_locimagem || '',
            supplier.gid || '',
            supplier.for_tipofrete || '',
            supplier.for_logotipo || ''
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Fornecedor criado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Erro CREATE Fornecedor:", error);
        res.status(500).json({
            success: false,
            message: `Erro ao criar fornecedor: ${error.message}`
        });
    }
});

// PUT - Atualizar fornecedor (Chave: CNPJ)
// PUT - Atualizar fornecedor (Chave: Código ID)
app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'ID é obrigatório para atualização' });
        }

        const query = `
            UPDATE fornecedores SET
                for_nome = $1, for_endereco = $2, for_bairro = $3, for_cidade = $4,
                for_uf = $5, for_cep = $6, for_fone = $7, for_fone2 = $8,
                for_fax = $9, for_inscricao = $10, for_email = $11,
                for_tipo2 = $12, for_nomered = $13, for_obs2 = $14,
                for_homepage = $15, for_locimagem = $16, for_logotipo = $17,
                for_cgc = $18
            WHERE for_codigo = $19
            RETURNING *
        `;

        const values = [
            supplier.for_nome,
            supplier.for_endereco || '',
            supplier.for_bairro || '',
            supplier.for_cidade || '',
            supplier.for_uf || '',
            supplier.for_cep || '',
            supplier.for_fone || '',
            supplier.for_fone2 || '',
            supplier.for_fax || '',
            supplier.for_inscricao || '',
            supplier.for_email || '',
            supplier.for_tipo2 || 'A',
            supplier.for_nomered,
            supplier.for_obs2 || '',
            supplier.for_homepage || '',
            supplier.for_locimagem || '',
            supplier.for_logotipo || '',
            supplier.for_cgc, // Now part of SET, not WHERE
            id // The ID is the key
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado com este ID'
            });
        }

        res.json({
            success: true,
            message: 'Fornecedor atualizado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Erro UPDATE Fornecedor:", error);
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar fornecedor: ${error.message}`
        });
    }
});

// DELETE - Excluir fornecedor
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM fornecedores WHERE for_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Fornecedor excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir fornecedor: ${error.message}`
        });
    }
});

// PATCH - Alternar status ativo/inativo
app.patch('/api/suppliers/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE fornecedores 
            SET for_tipo2 = CASE WHEN for_tipo2 = 'A' THEN 'I' ELSE 'A' END
            WHERE for_codigo = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Status alterado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao alternar status: ${error.message}`
        });
    }
});

// ==================== CONTACTS ENDPOINTS ====================

// GET - Listar contatos de um fornecedor
app.get('/api/suppliers/:supplierId/contacts', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const result = await pool.query(
            'SELECT * FROM contato_for WHERE con_fornec = $1 ORDER BY con_codigo',
            [supplierId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar contatos: ${error.message}`
        });
    }
});

// POST - Criar novo contato
app.post('/api/suppliers/:supplierId/contacts', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const contact = req.body;

        // Get next con_codigo for this supplier
        const maxCodeResult = await pool.query(
            'SELECT COALESCE(MAX(con_codigo), 0) + 1 as next_code FROM contato_for WHERE con_fornec = $1',
            [supplierId]
        );
        const nextCode = maxCodeResult.rows[0].next_code;

        const query = `
            INSERT INTO contato_for (
                con_codigo, con_fornec, con_nome, con_cargo, 
                con_telefone, con_celular, con_email, con_dtnasc, con_obs,
                con_timequetorce, con_esportepreferido, con_hobby
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            nextCode,
            supplierId,
            contact.con_nome,
            contact.con_cargo || '',
            contact.con_telefone || '',
            contact.con_celular || '',
            contact.con_email || '',
            contact.con_dtnasc || null,
            contact.con_obs || '',
            contact.con_timequetorce || '',
            contact.con_esportepreferido || '',
            contact.con_hobby || ''
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Contato criado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar contato: ${error.message}`
        });
    }
});

// PUT - Atualizar contato (usando con_codigo como identificador único)
app.put('/api/suppliers/:supplierId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const contact = req.body;

        const query = `
            UPDATE contato_for SET
                con_telefone = $1, con_celular = $2,
                con_email = $3, con_dtnasc = $4, con_obs = $5,
                con_timequetorce = $6, con_esportepreferido = $7, con_hobby = $8
            WHERE con_codigo = $9
            RETURNING *
        `;

        const values = [
            contact.con_telefone || '',
            contact.con_celular || '',
            contact.con_email || '',
            contact.con_dtnasc || null,
            contact.con_obs || '',
            contact.con_timequetorce || '',
            contact.con_esportepreferido || '',
            contact.con_hobby || '',
            contactId
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contato atualizado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar contato: ${error.message}`
        });
    }
});

// DELETE - Excluir contato (usando con_codigo como identificador único)
app.delete('/api/suppliers/:supplierId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const result = await pool.query(
            'DELETE FROM contato_for WHERE con_codigo = $1 RETURNING *',
            [contactId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contato excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir contato: ${error.message}`
        });
    }
});

// ==================== CLIENT CONTACTS ENDPOINTS (cli_aniv) ====================

// GET - Listar contatos de um cliente
app.get('/api/clients/:clientId/contacts', async (req, res) => {
    try {
        const { clientId } = req.params;
        const result = await pool.query(
            'SELECT * FROM cli_aniv WHERE ani_cliente = $1 ORDER BY ani_nome',
            [clientId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar contatos do cliente: ${error.message}`
        });
    }
});

// POST - Criar novo contato de cliente
app.post('/api/clients/:clientId/contacts', async (req, res) => {
    try {
        const { clientId } = req.params;
        const contact = req.body;

        // Hyper-Fallback Mapping (Sync with cli_aniv_endpoints.js V3.1)
        const final_nome = (contact.ani_nome || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        const final_funcao = (contact.ani_funcao || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

        const raw_time = contact.ani_timequetorce || contact.ani_time || contact.timequetorce || contact.time || contact.time_torce || '';
        const raw_esporte = contact.ani_esportepreferido || contact.ani_esporte || contact.esportepreferido || contact.esporte || contact.esporte_preferido || '';
        const raw_hobby = contact.ani_hobby || contact.hobby || '';

        const final_time = String(raw_time).trim();
        const final_esporte = String(raw_esporte).trim();
        const final_hobby = String(raw_hobby).trim();
        const final_obs = (contact.ani_obs || contact.obs || '').trim();
        const final_gid = (contact.gid || contact.gid || '').trim();

        console.log(`💾 [SERVER-POST] Client:${clientId} | Name:${final_nome} | Time:${final_time}`);

        // Generate next ani_lancto manually
        const maxResult = await pool.query('SELECT MAX(ani_lancto) as max_id FROM cli_aniv');
        const nextId = (maxResult.rows[0].max_id || 0) + 1;

        const query = `
            INSERT INTO cli_aniv (
                ani_lancto, ani_cliente, ani_nome, ani_funcao, 
                ani_fone, ani_email, ani_diaaniv, ani_mes, 
                ani_niver, ani_obs, gid,
                ani_timequetorce, ani_esportepreferido, ani_hobby
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (ani_cliente, ani_nome, ani_funcao) 
            DO UPDATE SET
                ani_email = EXCLUDED.ani_email,
                ani_fone = EXCLUDED.ani_fone,
                ani_diaaniv = EXCLUDED.ani_diaaniv,
                ani_mes = EXCLUDED.ani_mes,
                ani_niver = EXCLUDED.ani_niver,
                ani_obs = EXCLUDED.ani_obs,
                gid = EXCLUDED.gid,
                ani_timequetorce = EXCLUDED.ani_timequetorce,
                ani_esportepreferido = EXCLUDED.ani_esportepreferido,
                ani_hobby = EXCLUDED.ani_hobby
            RETURNING *
        `;

        // Birthday logic
        let niverDate = contact.ani_niver || null;
        if (contact.ani_diaaniv && contact.ani_mes) {
            const day = String(contact.ani_diaaniv).padStart(2, '0');
            const month = String(contact.ani_mes).padStart(2, '0');
            niverDate = `2001-${month}-${day}`;
        }

        const values = [
            nextId,
            parseInt(clientId),
            final_nome,
            final_funcao,
            contact.ani_fone || '',
            contact.ani_email || '',
            contact.ani_diaaniv || null,
            contact.ani_mes || null,
            niverDate,
            final_obs,
            final_gid,
            final_time,
            final_esporte,
            final_hobby
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Contato criado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar contato: ${error.message}`
        });
    }
});

// PUT - Atualizar contato de cliente
app.put('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
    try {
        const { clientId, contactId } = req.params;
        const contact = req.body;

        // Hyper-Fallback Mapping (Sync with cli_aniv_endpoints.js V3.1)
        const final_nome = (contact.ani_nome || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        const final_funcao = (contact.ani_funcao || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

        const raw_time = contact.ani_timequetorce || contact.ani_time || contact.timequetorce || contact.time || contact.time_torce || '';
        const raw_esporte = contact.ani_esportepreferido || contact.ani_esporte || contact.esportepreferido || contact.esporte || contact.esporte_preferido || '';
        const raw_hobby = contact.ani_hobby || contact.hobby || '';

        const final_time = String(raw_time).trim();
        const final_esporte = String(raw_esporte).trim();
        const final_hobby = String(raw_hobby).trim();
        const final_obs = (contact.ani_obs || contact.obs || '').trim();
        const final_gid = (contact.gid || contact.gid || '').trim();

        console.log(`📱 [SERVER-PUT] Client:${clientId} | Name:${final_nome} | Time:${final_time}`);

        // Birthday logic
        let niverDate = contact.ani_niver || null;
        if (contact.ani_diaaniv && contact.ani_mes) {
            const day = String(contact.ani_diaaniv).padStart(2, '0');
            const month = String(contact.ani_mes).padStart(2, '0');
            niverDate = `2001-${month}-${day}`;
        }

        console.log(`📱 [MOBILE-PUT] Client:${clientId} | Contact:${final_nome} | Time:${final_time}`);

        // Strategy: Try update by ID first, if 0 rows, use UPSERT by composite key
        const updateQuery = `
            UPDATE cli_aniv SET
                ani_nome = $1, ani_funcao = $2,
                ani_fone = $3, ani_email = $4,
                ani_diaaniv = $5, ani_mes = $6,
                ani_niver = $7, ani_obs = $8,
                ani_timequetorce = $9, ani_esportepreferido = $10, ani_hobby = $11,
                gid = $12
            WHERE ani_lancto = $13 OR (ani_cliente = $14 AND ani_nome = $1 AND ani_funcao = $2)
            RETURNING *
        `;

        const values = [
            final_nome,
            final_funcao,
            contact.ani_fone || '',
            contact.ani_email || '',
            contact.ani_diaaniv || null,
            contact.ani_mes || null,
            niverDate,
            final_obs,
            final_time,
            final_esporte,
            final_hobby,
            final_gid,
            contactId,
            parseInt(clientId)
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            // If still not found, it might be a new record that the app thought was an edit
            // or a naming change that broke the key. Let's do a hard UPSERT.
            const upsertQuery = `
                INSERT INTO cli_aniv (
                    ani_cliente, ani_nome, ani_funcao, ani_email, 
                    ani_fone, ani_diaaniv, ani_mes, ani_niver,
                    ani_timequetorce, ani_esportepreferido, ani_hobby,
                    ani_obs, gid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (ani_cliente, ani_nome, ani_funcao) 
                DO UPDATE SET
                    ani_email = EXCLUDED.ani_email,
                    ani_fone = EXCLUDED.ani_fone,
                    ani_diaaniv = EXCLUDED.ani_diaaniv,
                    ani_mes = EXCLUDED.ani_mes,
                    ani_niver = EXCLUDED.ani_niver,
                    ani_obs = EXCLUDED.ani_obs,
                    gid = EXCLUDED.gid,
                    ani_timequetorce = EXCLUDED.ani_timequetorce,
                    ani_esportepreferido = EXCLUDED.ani_esportepreferido,
                    ani_hobby = EXCLUDED.ani_hobby
                RETURNING *
            `;

            const upsertValues = [
                parseInt(clientId), final_nome, final_funcao,
                contact.ani_email || '', contact.ani_fone || '',
                contact.ani_diaaniv || null, contact.ani_mes || null,
                niverDate, final_time, final_esporte, final_hobby,
                final_obs, final_gid
            ];

            const upsertResult = await pool.query(upsertQuery, upsertValues);

            return res.json({
                success: true,
                message: 'Contato sincronizado com sucesso!',
                data: upsertResult.rows[0]
            });
        }

        res.json({
            success: true,
            message: 'Contato atualizado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [MOBILE-PUT] Erro:', error.message);
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar contato: ${error.message}`
        });
    }
});

// DELETE - Excluir contato de cliente
app.delete('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const result = await pool.query(
            'DELETE FROM cli_aniv WHERE ani_lancto = $1 RETURNING *',
            [contactId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contato excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir contato: ${error.message}`
        });
    }
});

// GET - Listar todos os clientes
app.get('/api/clients', async (req, res) => {
    try {
        const { search, active, page = 1, limit = 10 } = req.query;

        let query = `
            SELECT 
                c.cli_codigo,
                c.cli_cnpj,
                c.cli_nomred,
                c.cli_nome,
                c.cli_fantasia,
                COALESCE(cid.cid_nome, c.cli_cidade) as cli_cidade,
                COALESCE(cid.cid_uf, c.cli_uf) as cli_uf,
                c.cli_fone1 as cli_fone,
                c.cli_email,
                c.cli_redeloja,
                c.cli_vendedor,
                c.cli_tipopes,
                CASE WHEN c.cli_tipopes = 'A' THEN true ELSE false END as cli_status
            FROM clientes c
            LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        // Filtro de busca
        if (search) {
            query += ` AND (
                c.cli_nome ILIKE $${paramCount} OR 
                c.cli_fantasia ILIKE $${paramCount} OR 
                c.cli_nomred ILIKE $${paramCount} OR 
                c.cli_cnpj ILIKE $${paramCount} OR
                c.cli_redeloja ILIKE $${paramCount} OR
                CAST(c.cli_codigo AS TEXT) ILIKE $${paramCount} OR
                COALESCE(cid.cid_nome, c.cli_cidade) ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Filtro ativo/inativo
        if (active === 'true') {
            query += ` AND c.cli_tipopes = 'A'`;
        } else if (active === 'false') {
            query += ` AND c.cli_tipopes = 'I'`;
        }
        // active === 'all' não filtra

        // Ordenação
        query += ' ORDER BY c.cli_nomred';

        // Paginação
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = `
            SELECT COUNT(*) FROM clientes c 
            LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 1;

        if (search) {
            countQuery += ` AND (
                c.cli_nome ILIKE $${countParamCount} OR 
                c.cli_fantasia ILIKE $${countParamCount} OR 
                c.cli_nomred ILIKE $${countParamCount} OR 
                c.cli_cnpj ILIKE $${countParamCount} OR
                c.cli_redeloja ILIKE $${countParamCount} OR
                COALESCE(cid.cid_nome, c.cli_cidade) ILIKE $${countParamCount}
            )`;
            countParams.push(`%${search}%`);
            countParamCount++;
        }

        if (active === 'true') {
            countQuery += ` AND c.cli_tipopes = 'A'`;
        } else if (active === 'false') {
            countQuery += ` AND c.cli_tipopes = 'I'`;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar clientes: ${error.message}`
        });
    }
});

// GET - Buscar cliente por ID
app.get('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM clientes WHERE cli_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar novo cliente
app.post('/api/clients', async (req, res) => {
    try {
        const client = req.body;
        // Basic fields for now, can expand
        const query = `
            INSERT INTO clientes (
                cli_cnpj, cli_inscricao, cli_tipopes, cli_atuacaoprincipal,
                cli_nome, cli_fantasia, cli_dtabertura,
                cli_endereco, cli_complemento, cli_bairro, cli_idcidade, cli_cidade, cli_uf, cli_cep,
                cli_fone1, cli_fone3, cli_fone2,
                cli_email, cli_nomred, cli_redeloja,
                cli_vendedor, cli_skype, cli_regiao2, cli_regimeemp,
                cli_emailnfe, cli_cxpostal, cli_emailfinanc, cli_suframa, cli_vencsuf,
                cli_obspedido, cli_obs, cli_refcom,
                cli_endcob, cli_baicob, cli_cidcob, cli_cepcob, cli_ufcob,
                cli_datacad, cli_usuario
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
            ) RETURNING *
        `;
        const values = [
            client.cli_cnpj, client.cli_inscricao, client.cli_tipopes, client.cli_atuacaoprincipal,
            client.cli_nome, client.cli_fantasia, client.cli_dtabertura || null,
            client.cli_endereco, client.cli_complemento, client.cli_bairro, client.cli_idcidade || null, client.cli_cidade, client.cli_uf, client.cli_cep,
            client.cli_fone1, client.cli_fone3, client.cli_fone2,
            client.cli_email, client.cli_nomred, client.cli_redeloja,
            client.cli_vendedor || null, client.cli_skype, client.cli_regiao2 || null, client.cli_regimeemp,
            client.cli_emailnfe, client.cli_cxpostal, client.cli_emailfinanc, client.cli_suframa, client.cli_vencsuf || null,
            client.cli_obspedido, client.cli_obs, client.cli_refcom,
            client.cli_endcob, client.cli_baicob, client.cli_cidcob, client.cli_cepcob, client.cli_ufcob,
            client.cli_datacad || new Date(), client.cli_usuario
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Cliente criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Atualizar cliente
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = req.body;

        const query = `
            UPDATE clientes SET
                cli_cnpj=$1, cli_inscricao=$2, cli_tipopes=$3, cli_atuacaoprincipal=$4,
                cli_nome=$5, cli_fantasia=$6, cli_dtabertura=$7,
                cli_endereco=$8, cli_complemento=$9, cli_bairro=$10, cli_idcidade=$11, cli_cidade=$12, cli_uf=$13, cli_cep=$14,
                cli_fone1=$15, cli_fone3=$16, cli_fone2=$17,
                cli_email=$18, cli_nomred=$19, cli_redeloja=$20,
                cli_vendedor=$21, cli_skype=$22, cli_regiao2=$23, cli_regimeemp=$24,
                cli_emailnfe=$25, cli_cxpostal=$26, cli_emailfinanc=$27, cli_suframa=$28, cli_vencsuf=$29,
                cli_obspedido=$30, cli_obs=$31, cli_refcom=$32,
                cli_endcob=$33, cli_baicob=$34, cli_cidcob=$35, cli_cepcob=$36, cli_ufcob=$37,
                cli_dataalt=NOW()
            WHERE cli_codigo = $38
            RETURNING *
        `;
        const values = [
            client.cli_cnpj, client.cli_inscricao, client.cli_tipopes, client.cli_atuacaoprincipal,
            client.cli_nome, client.cli_fantasia, client.cli_dtabertura || null,
            client.cli_endereco, client.cli_complemento, client.cli_bairro, client.cli_idcidade || null, client.cli_cidade, client.cli_uf, client.cli_cep,
            client.cli_fone1, client.cli_fone3, client.cli_fone2,
            client.cli_email, client.cli_nomred, client.cli_redeloja,
            client.cli_vendedor || null, client.cli_skype, client.cli_regiao2 || null, client.cli_regimeemp,
            client.cli_emailnfe, client.cli_cxpostal, client.cli_emailfinanc, client.cli_suframa, client.cli_vencsuf || null,
            client.cli_obspedido, client.cli_obs, client.cli_refcom,
            client.cli_endcob, client.cli_baicob, client.cli_cidcob, client.cli_cepcob, client.cli_ufcob,
            id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });

        res.json({ success: true, data: result.rows[0], message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Excluir cliente
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM clientes WHERE cli_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        res.json({ success: true, message: 'Cliente excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// (Redundant inline aux routes removed)

// ==================== ANNUAL GOALS ENDPOINTS ====================

// GET - Buscar metas de um fornecedor por ano
app.get('/api/suppliers/:supplierId/goals/:year', async (req, res) => {
    try {
        const { supplierId, year } = req.params;
        const result = await pool.query(
            'SELECT * FROM ind_metas WHERE met_industria = $1 AND met_ano = $2',
            [supplierId, year]
        );

        if (result.rows.length === 0) {
            // Return empty goals if not found
            return res.json({
                success: true,
                data: {
                    met_ano: parseInt(year),
                    met_industria: parseInt(supplierId),
                    met_jan: 0, met_fev: 0, met_mar: 0, met_abr: 0,
                    met_mai: 0, met_jun: 0, met_jul: 0, met_ago: 0,
                    met_set: 0, met_out: 0, met_nov: 0, met_dez: 0
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar metas: ${error.message}`
        });
    }
});

// PUT - Atualizar/Criar metas de um fornecedor para um ano
app.put('/api/suppliers/:supplierId/goals/:year', async (req, res) => {
    try {
        const { supplierId, year } = req.params;
        const goals = req.body;

        const query = `
            INSERT INTO ind_metas (
                met_ano, met_industria,
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (met_ano, met_industria) DO UPDATE SET
                met_jan = EXCLUDED.met_jan,
                met_fev = EXCLUDED.met_fev,
                met_mar = EXCLUDED.met_mar,
                met_abr = EXCLUDED.met_abr,
                met_mai = EXCLUDED.met_mai,
                met_jun = EXCLUDED.met_jun,
                met_jul = EXCLUDED.met_jul,
                met_ago = EXCLUDED.met_ago,
                met_set = EXCLUDED.met_set,
                met_out = EXCLUDED.met_out,
                met_nov = EXCLUDED.met_nov,
                met_dez = EXCLUDED.met_dez
            RETURNING *
        `;

        const values = [
            parseInt(year),
            parseInt(supplierId),
            goals.met_jan || 0,
            goals.met_fev || 0,
            goals.met_mar || 0,
            goals.met_abr || 0,
            goals.met_mai || 0,
            goals.met_jun || 0,
            goals.met_jul || 0,
            goals.met_ago || 0,
            goals.met_set || 0,
            goals.met_out || 0,
            goals.met_nov || 0,
            goals.met_dez || 0
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Metas salvas com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao salvar metas: ${error.message}`
        });
    }
});



// ============================================
// Listar todas as transportadoras (Legacy Endpoint for OrderForm)
app.get('/api/transportadoras', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transportadora ORDER BY tra_nome ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Adicionar indústria ao cliente
app.post('/api/clients/:clientId/industries', async (req, res) => {
    try {
        const { clientId } = req.params;
        const data = req.body;

        const query = `
            INSERT INTO cli_ind (
                cli_codigo, cli_forcodigo, 
                cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, 
                cli_desc6, cli_desc7, cli_desc8, cli_desc9, cli_desc10, 
                cli_transportadora, cli_prazopg, cli_ipi, cli_tabela, 
                cli_codcliind, cli_obsparticular, cli_comprador, 
                cli_frete, cli_emailcomprador, cli_desc11
            ) VALUES (
                $1, $2, 
                $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, 
                $13, $14, $15, $16, 
                $17, $18, $19, 
                $20, $21, $22
            ) RETURNING *
        `;

        const values = [
            clientId, data.cli_forcodigo,
            data.cli_desc1 || 0, data.cli_desc2 || 0, data.cli_desc3 || 0,
            data.cli_desc4 || 0, data.cli_desc5 || 0, data.cli_desc6 || 0,
            data.cli_desc7 || 0, data.cli_desc8 || 0, data.cli_desc9 || 0,
            data.cli_desc10 || 0,
            data.cli_transportadora || null,
            data.cli_prazopg || '',
            data.cli_ipi || '',
            data.cli_tabela || '',
            data.cli_codcliind || '',
            data.cli_obsparticular || '',
            data.cli_comprador || '',
            data.cli_frete || '',
            data.cli_emailcomprador || '',
            data.cli_desc11 || 0
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error("Erro ao salvar indústria:", error);
        res.status(500).json({ success: false, message: `Erro ao salvar: ${error.message}` });
    }
});

// Atualizar dados da indústria
app.put('/api/clients/:clientId/industries/:industryId', async (req, res) => {
    try {
        const { industryId } = req.params;
        const data = req.body;

        const query = `
            UPDATE cli_ind SET
                cli_desc1 = $1, cli_desc2 = $2, cli_desc3 = $3, 
                cli_desc4 = $4, cli_desc5 = $5, cli_desc6 = $6, 
                cli_desc7 = $7, cli_desc8 = $8, cli_desc9 = $9, 
                cli_desc10 = $10, cli_transportadora = $11, 
                cli_prazopg = $12, cli_ipi = $13, cli_tabela = $14, 
                cli_codcliind = $15, cli_obsparticular = $16, 
                cli_comprador = $17, cli_frete = $18, 
                cli_emailcomprador = $19, cli_desc11 = $20
            WHERE cli_lancamento = $21
            RETURNING *
        `;

        const values = [
            data.cli_desc1 || 0, data.cli_desc2 || 0, data.cli_desc3 || 0,
            data.cli_desc4 || 0, data.cli_desc5 || 0, data.cli_desc6 || 0,
            data.cli_desc7 || 0, data.cli_desc8 || 0, data.cli_desc9 || 0,
            data.cli_desc10 || 0, data.cli_transportadora || null,
            data.cli_prazopg || '', data.cli_ipi || '', data.cli_tabela || '',
            data.cli_codcliind || '', data.cli_obsparticular || '',
            data.cli_comprador || '', data.cli_frete || '',
            data.cli_emailcomprador || '', data.cli_desc11 || 0,
            industryId
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao atualizar: ${error.message}` });
    }
});

// Excluir indústria
app.delete('/api/clients/:clientId/industries/:industryId', async (req, res) => {
    try {
        const { industryId } = req.params;
        await pool.query('DELETE FROM cli_ind WHERE cli_lancamento = $1', [industryId]);
        res.json({ success: true, message: 'Registro excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao excluir: ${error.message}` });
    }
});


// AUX - Listar Vendedores (Combobox)
app.get('/api/aux/vendedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_nome');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend rodando!' });
});

// --- AREAS OF ACTIVITY ENDPOINTS ---

// Get all available areas (for combobox)
app.get('/api/areas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM area_atu ORDER BY atu_descricao');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar áreas de atuação' });
    }
});

// Get areas for a specific client
app.get('/api/clients/:id/areas', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                ac.atu_idcli, 
                ac.atu_atuaid, 
                aa.atu_descricao 
            FROM atua_cli ac
            JOIN area_atu aa ON ac.atu_atuaid = aa.atu_id
            WHERE ac.atu_idcli = $1
            ORDER BY aa.atu_descricao
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar áreas do cliente' });
    }
});

// Add area to client
app.post('/api/clients/:id/areas', async (req, res) => {
    try {
        const { id } = req.params;
        const { areaId } = req.body; // Expects atu_atuaid

        if (!areaId) return res.status(400).json({ error: 'Area ID is required' });

        // Check availability
        const check = await pool.query(
            'SELECT 1 FROM atua_cli WHERE atu_idcli = $1 AND atu_atuaid = $2',
            [id, areaId]
        );
        if (check.rowCount > 0) {
            return res.status(409).json({ error: 'Cliente já possui esta área vinculada' });
        }

        await pool.query(
            'INSERT INTO atua_cli (atu_idcli, atu_atuaid) VALUES ($1, $2)',
            [id, areaId]
        );
        res.status(201).json({ message: 'Área adicionada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar área' });
    }
});

// Remove area from client
app.delete('/api/clients/:id/areas/:areaId', async (req, res) => {
    try {
        const { id, areaId } = req.params;
        await pool.query(
            'DELETE FROM atua_cli WHERE atu_idcli = $1 AND atu_atuaid = $2',
            [id, areaId]
        );
        res.json({ message: 'Área removida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover área' });
    }
});


// GET - List all discount groups (for combobox) - MUST BE BEFORE PARAMETERIZED ROUTES
app.get('/api/discount-groups', async (req, res) => {
    try {
        console.log('📋 Fetching discount groups...');
        const result = await pool.query('SELECT gru_codigo, gru_nome FROM grupos ORDER BY gru_nome');
        console.log(`✅ Found ${result.rows.length} groups:`, result.rows.slice(0, 3));
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching groups:', err.message);
        res.status(500).json({ error: 'Erro ao buscar grupos de desconto' });
    }
});

// Get client discount groups
app.get('/api/clients/:id/discounts', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                cd.cli_codigo,
                cd.cli_forcodigo,
                cd.cli_grupo,
                f.for_nomered as industria,
                g.gru_nome as grupo_nome,
                cd.cli_desc1,
                cd.cli_desc2,
                cd.cli_desc3,
                cd.cli_desc4,
                cd.cli_desc5,
                cd.cli_desc6,
                cd.cli_desc7,
                cd.cli_desc8,
                cd.cli_desc9
            FROM cli_descpro cd
            LEFT JOIN fornecedores f ON f.for_codigo = cd.cli_forcodigo
            LEFT JOIN grupos g ON g.gru_codigo = cd.cli_grupo
            WHERE cd.cli_codigo = $1
            ORDER BY f.for_nomered, g.gru_nome
        `, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar grupos de desconto' });
    }
});

// POST - Create new discount group for client
app.post('/api/clients/:id/discounts', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const query = `
            INSERT INTO cli_descpro (
                cli_codigo, cli_forcodigo, cli_grupo,
                cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                cli_desc6, cli_desc7, cli_desc8, cli_desc9
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            id,
            data.cli_forcodigo,
            data.cli_grupo,
            data.cli_desc1 || 0,
            data.cli_desc2 || 0,
            data.cli_desc3 || 0,
            data.cli_desc4 || 0,
            data.cli_desc5 || 0,
            data.cli_desc6 || 0,
            data.cli_desc7 || 0,
            data.cli_desc8 || 0,
            data.cli_desc9 || 0
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar grupo de desconto' });
    }
});

// PUT - Update discount group
app.put('/api/clients/:clientId/discounts/:forcodigo/:grupo', async (req, res) => {
    try {
        const { clientId, forcodigo, grupo } = req.params;
        const data = req.body;

        const query = `
            UPDATE cli_descpro SET
                cli_desc1 = $1,
                cli_desc2 = $2,
                cli_desc3 = $3,
                cli_desc4 = $4,
                cli_desc5 = $5,
                cli_desc6 = $6,
                cli_desc7 = $7,
                cli_desc8 = $8,
                cli_desc9 = $9
            WHERE cli_codigo = $10 AND cli_forcodigo = $11 AND cli_grupo = $12
            RETURNING *
        `;

        const values = [
            data.cli_desc1 || 0,
            data.cli_desc2 || 0,
            data.cli_desc3 || 0,
            data.cli_desc4 || 0,
            data.cli_desc5 || 0,
            data.cli_desc6 || 0,
            data.cli_desc7 || 0,
            data.cli_desc8 || 0,
            data.cli_desc9 || 0,
            clientId,
            forcodigo,
            grupo
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo de desconto não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar grupo de desconto' });
    }
});

// DELETE - Remove discount group
app.delete('/api/clients/:clientId/discounts/:forcodigo/:grupo', async (req, res) => {
    try {
        const { clientId, forcodigo, grupo } = req.params;
        const result = await pool.query(
            'DELETE FROM cli_descpro WHERE cli_codigo = $1 AND cli_forcodigo = $2 AND cli_grupo = $3 RETURNING *',
            [clientId, forcodigo, grupo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo de desconto não encontrado' });
        }

        res.json({ success: true, message: 'Grupo de desconto excluído com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir grupo de desconto' });
    }
});



// ==================== CLIENT INDUSTRIES (PROSPECÇÃO) ====================

// GET - List industries for a client
app.get('/api/clients/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                ci.cli_lancamento,
                ci.cli_codigo,
                ci.cli_forcodigo,
                ci.cli_desc1,
                ci.cli_desc2,
                ci.cli_desc3,
                ci.cli_desc4,
                ci.cli_desc5,
                ci.cli_desc6,
                ci.cli_desc7,
                ci.cli_desc8,
                ci.cli_desc9,
                ci.cli_desc10,
                ci.cli_desc11,
                ci.cli_prazopg,
                ci.cli_transportadora,
                ci.cli_tabela,
                ci.cli_comprador,
                ci.cli_emailcomprador,
                ci.cli_frete,
                ci.cli_codcliind,
                ci.cli_obsparticular,
                ci.cli_ipi,
                f.for_nomered as fornecedor_nome,
                t.for_nomered as transportadora_nome
            FROM cli_ind ci
            LEFT JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
            LEFT JOIN fornecedores t ON t.for_codigo = ci.cli_transportadora
            WHERE ci.cli_codigo = $1
            ORDER BY f.for_nomered
        `, [id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erro ao buscar indústrias' });
    }
});

// POST - Add industry to client
app.post('/api/clients/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const { cli_forcodigo } = req.body;

        const result = await pool.query(`
            INSERT INTO cli_ind (cli_codigo, cli_forcodigo)
            VALUES ($1, $2)
            RETURNING *
        `, [id, cli_forcodigo]);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar indústria' });
    }
});

// DELETE - Remove industry from client
app.delete('/api/clients/:id/industries/:forcodigo', async (req, res) => {
    try {
        const { id, forcodigo } = req.params;
        await pool.query(
            'DELETE FROM cli_ind WHERE cli_codigo = $1 AND cli_forcodigo = $2',
            [id, forcodigo]
        );
        res.json({ success: true, message: 'Indústria removida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover indústria' });
    }
});

// ==================== CRUD VENDEDORES (SELLERS) ====================

// GET - Listar todos os vendedores
app.get('/api/sellers', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        let query = 'SELECT * FROM vendedores WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtro de busca
        if (search) {
            query += ` AND (ven_nome ILIKE $${paramCount} OR ven_cpf ILIKE $${paramCount} OR ven_email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Ordenação
        query += ' ORDER BY ven_nome';

        // Paginação
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM vendedores WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (search) {
            countQuery += ` AND (ven_nome ILIKE $${countParamCount} OR ven_cpf ILIKE $${countParamCount} OR ven_email ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar vendedores: ${error.message}`
        });
    }
});

// GET - Buscar vendedor por ID
app.get('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM vendedores WHERE ven_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendedor não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar novo vendedor
app.post('/api/sellers', async (req, res) => {
    try {
        const seller = req.body;

        // Validação: nome é obrigatório
        if (!seller.ven_nome || seller.ven_nome.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'O nome do vendedor é obrigatório'
            });
        }

        const query = `
            INSERT INTO vendedores (
                ven_nome, ven_endereco, ven_bairro, ven_cidade, ven_cep, ven_uf,
                ven_fone1, ven_fone2, ven_obs, ven_cpf, ven_comissao, ven_email,
                ven_nomeusu, ven_aniversario, ven_rg, ven_ctps, ven_filiacao,
                ven_pis, ven_filhos, ven_codusu, ven_imagem, gid,
                ven_dtadmissao, ven_dtdemissao, ven_status, ven_cumpremetas
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            ) RETURNING *
        `;

        const values = [
            seller.ven_nome,
            seller.ven_endereco || '',
            seller.ven_bairro || '',
            seller.ven_cidade || '',
            seller.ven_cep || '',
            seller.ven_uf || '',
            seller.ven_fone1 || '',
            seller.ven_fone2 || '',
            seller.ven_obs || '',
            seller.ven_cpf || '',
            seller.ven_comissao || null,
            seller.ven_email || '',
            seller.ven_nomeusu || '',
            seller.ven_aniversario || '',
            seller.ven_rg || '',
            seller.ven_ctps || '',
            seller.ven_filiacao || '',
            seller.ven_pis || '',
            seller.ven_filhos || null,
            seller.ven_codusu || null,
            seller.ven_imagem || '',
            seller.gid || '',
            seller.ven_dtadmissao || null,
            seller.ven_dtdemissao || null,
            seller.ven_status || 'A',
            seller.ven_cumpremetas || 'S'
        ];

        const result = await pool.query(query, values);
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Vendedor criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar vendedor: ${error.message}`
        });
    }
});

// PUT - Atualizar vendedor
app.put('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const seller = req.body;

        // Validação: nome é obrigatório
        if (!seller.ven_nome || seller.ven_nome.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'O nome do vendedor é obrigatório'
            });
        }

        const query = `
            UPDATE vendedores SET
                ven_nome = $1, ven_endereco = $2, ven_bairro = $3, ven_cidade = $4,
                ven_cep = $5, ven_uf = $6, ven_fone1 = $7, ven_fone2 = $8,
                ven_obs = $9, ven_cpf = $10, ven_comissao = $11, ven_email = $12,
                ven_nomeusu = $13, ven_aniversario = $14, ven_rg = $15, ven_ctps = $16,
                ven_filiacao = $17, ven_pis = $18, ven_filhos = $19, ven_codusu = $20,
                ven_imagem = $21, ven_dtadmissao = $22, ven_dtdemissao = $23,
                ven_status = $24, ven_cumpremetas = $25
            WHERE ven_codigo = $26
            RETURNING *
        `;

        const values = [
            seller.ven_nome,
            seller.ven_endereco || '',
            seller.ven_bairro || '',
            seller.ven_cidade || '',
            seller.ven_cep || '',
            seller.ven_uf || '',
            seller.ven_fone1 || '',
            seller.ven_fone2 || '',
            seller.ven_obs || '',
            seller.ven_cpf || '',
            seller.ven_comissao || null,
            seller.ven_email || '',
            seller.ven_nomeusu || '',
            seller.ven_aniversario || '',
            seller.ven_rg || '',
            seller.ven_ctps || '',
            seller.ven_filiacao || '',
            seller.ven_pis || '',
            seller.ven_filhos || null,
            seller.ven_codusu || null,
            seller.ven_imagem || '',
            seller.ven_dtadmissao || null,
            seller.ven_dtdemissao || null,
            seller.ven_status || 'A',
            seller.ven_cumpremetas || 'S',
            id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendedor não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vendedor atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar vendedor: ${error.message}`
        });
    }
});

// DELETE - Excluir vendedor
app.delete('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM vendedores WHERE ven_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Vendedor excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir vendedor: ${error.message}`
        });
    }
});

// ==================== SELLER INDUSTRIES/COMMISSIONS ENDPOINTS ====================

// GET - Listar indústrias e comissões de um vendedor
app.get('/api/sellers/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                vi.vin_industria,
                vi.vin_codigo,
                vi.vin_percom,
                f.for_nomered,
                f.for_nome
            FROM vendedor_ind vi
            INNER JOIN fornecedores f ON vi.vin_industria = f.for_codigo
            WHERE vi.vin_codigo = $1
            ORDER BY f.for_nomered
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar indústrias do vendedor: ${error.message}`
        });
    }
});

// POST - Adicionar indústria/comissão ao vendedor
app.post('/api/sellers/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const { vin_industria, vin_percom } = req.body;

        const query = `
            INSERT INTO vendedor_ind (vin_codigo, vin_industria, vin_percom)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [id, vin_industria, vin_percom || 0];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Indústria adicionada com sucesso!'
        });
    } catch (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Esta indústria já está cadastrada para este vendedor'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao adicionar indústria: ${error.message}`
        });
    }
});

// PUT - Atualizar comissão de uma indústria
app.put('/api/sellers/:id/industries/:industryId', async (req, res) => {
    try {
        const { id, industryId } = req.params;
        const { vin_percom } = req.body;

        const query = `
            UPDATE vendedor_ind
            SET vin_percom = $1
            WHERE vin_codigo = $2 AND vin_industria = $3
            RETURNING *
        `;

        const result = await pool.query(query, [vin_percom || 0, id, industryId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Indústria não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Comissão atualizada com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar comissão: ${error.message}`
        });
    }
});

// DELETE - Remover indústria do vendedor
app.delete('/api/sellers/:id/industries/:industryId', async (req, res) => {
    try {
        const { id, industryId } = req.params;

        const result = await pool.query(
            'DELETE FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2 RETURNING *',
            [id, industryId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Indústria não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            message: 'Indústria removida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao remover indústria: ${error.message}`
        });
    }
});

// GET customers who have purchased from a specific supplier
app.get('/api/suppliers/:id/customers', async (req, res) => {
    try {
        const supplierId = req.params.id;

        const query = `
            SELECT 
                c.cli_codigo,
                c.cli_nomred,
                MAX(p.ped_data) as ultima_compra,
                SUM(p.ped_totliq) as total_compras,
                COUNT(p.ped_pedido) as qtd_pedidos
            FROM clientes c
            INNER JOIN pedidos p ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_industria = $1
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY c.cli_codigo, c.cli_nomred
            ORDER BY total_compras DESC
        `;

        const result = await pool.query(query, [supplierId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching supplier customers:', error);
        res.status(500).json({ error: error.message });
    }
});


// GET industries purchased by a specific client
app.get('/api/clients/:id/purchased-industries', async (req, res) => {
    try {
        const clientId = req.params.id;

        const query = `
            SELECT 
                p.ped_pedido,
                p.ped_data,
                p.ped_totliq,
                f.for_nomered,
                p.ped_cliente,
                p.ped_industria
            FROM pedidos p
            LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_cliente = $1 
              AND p.ped_situacao IN ('P', 'F')
            ORDER BY p.ped_data DESC, f.for_nomered
        `;

        const result = await pool.query(query, [clientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching client purchased industries:', error);
        res.status(500).json({ error: error.message });
    }
});


// ==================== SELLER REGIONS ENDPOINTS ====================

// GET - Listar regiões do vendedor
app.get('/api/sellers/:id/regions', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                vr.vin_codigo,
                vr.vin_regiao,
                r.reg_descricao,
                r.reg_codigo
            FROM vendedor_reg vr
            INNER JOIN regioes r ON r.reg_codigo = vr.vin_regiao
            WHERE vr.vin_codigo = $1
            ORDER BY r.reg_descricao
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar regiões: ${error.message}`
        });
    }
});

// POST - Adicionar região ao vendedor
app.post('/api/sellers/:id/regions', async (req, res) => {
    try {
        const { id } = req.params;
        const { vin_regiao } = req.body;

        if (!vin_regiao) {
            return res.status(400).json({
                success: false,
                message: 'Região é obrigatória'
            });
        }

        const query = `
            INSERT INTO vendedor_reg (vin_codigo, vin_regiao, gid)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(query, [id, vin_regiao, null]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Região adicionada com sucesso!'
        });
    } catch (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Esta região já está cadastrada para este vendedor'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao adicionar região: ${error.message}`
        });
    }
});

// DELETE - Remover região do vendedor
app.delete('/api/sellers/:id/regions/:regionId', async (req, res) => {
    try {
        const { id, regionId } = req.params;

        const result = await pool.query(
            'DELETE FROM vendedor_reg WHERE vin_codigo = $1 AND vin_regiao = $2 RETURNING *',
            [id, regionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Região não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            message: 'Região removida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao remover região: ${error.message}`
        });
    }
});

// ==================== REGIONS ENDPOINTS ====================

// GET - Listar todas as regiões disponíveis
app.get('/api/regions', async (req, res) => {
    console.log('📍 Endpoint /api/regions chamado!');
    try {
        const query = `
            SELECT 
                reg_codigo,
                reg_descricao
            FROM regioes
            ORDER BY reg_descricao
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar regiões: ${error.message}`
        });
    }
});

// ==================== SELLER GOALS/METAS ENDPOINTS ====================

// GET - Listar metas de um vendedor (por ano ou todos)
app.get('/api/sellers/:id/metas', async (req, res) => {
    try {
        const { id } = req.params;
        const { ano } = req.query;

        let query = `
            SELECT 
                vm.met_id,
                vm.met_ano,
                vm.met_industria,
                vm.met_vendedor,
                vm.met_jan, vm.met_fev, vm.met_mar, vm.met_abr,
                vm.met_mai, vm.met_jun, vm.met_jul, vm.met_ago,
                vm.met_set, vm.met_out, vm.met_nov, vm.met_dez,
                f.for_nomered as industria_nome
            FROM vend_metas vm
            LEFT JOIN fornecedores f ON f.for_codigo = vm.met_industria
            WHERE vm.met_vendedor = $1
        `;
        const params = [id];

        if (ano) {
            query += ` AND vm.met_ano = $2`;
            params.push(ano);
        }

        query += ` ORDER BY vm.met_ano DESC, f.for_nomered`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar metas: ${error.message}`
        });
    }
});

// POST - Criar nova meta
app.post('/api/sellers/:id/metas', async (req, res) => {
    try {
        const { id } = req.params;
        const meta = req.body;

        // Verificar se já existe meta para este vendedor/ano/indústria
        const existCheck = await pool.query(
            'SELECT met_id FROM vend_metas WHERE met_vendedor = $1 AND met_ano = $2 AND met_industria = $3',
            [id, meta.met_ano, meta.met_industria]
        );

        if (existCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma meta para este vendedor/ano/indústria'
            });
        }

        const query = `
            INSERT INTO vend_metas (
                met_vendedor, met_ano, met_industria,
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            ) RETURNING *
        `;

        const values = [
            id,
            meta.met_ano,
            meta.met_industria,
            meta.met_jan || 0, meta.met_fev || 0, meta.met_mar || 0, meta.met_abr || 0,
            meta.met_mai || 0, meta.met_jun || 0, meta.met_jul || 0, meta.met_ago || 0,
            meta.met_set || 0, meta.met_out || 0, meta.met_nov || 0, meta.met_dez || 0
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Meta criada com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar meta: ${error.message}`
        });
    }
});

// PUT - Atualizar meta existente
app.put('/api/sellers/:id/metas/:metaId', async (req, res) => {
    try {
        const { id, metaId } = req.params;
        const meta = req.body;

        const query = `
            UPDATE vend_metas SET
                met_ano = $1, met_industria = $2,
                met_jan = $3, met_fev = $4, met_mar = $5, met_abr = $6,
                met_mai = $7, met_jun = $8, met_jul = $9, met_ago = $10,
                met_set = $11, met_out = $12, met_nov = $13, met_dez = $14
            WHERE met_id = $15 AND met_vendedor = $16
            RETURNING *
        `;

        const values = [
            meta.met_ano, meta.met_industria,
            meta.met_jan || 0, meta.met_fev || 0, meta.met_mar || 0, meta.met_abr || 0,
            meta.met_mai || 0, meta.met_jun || 0, meta.met_jul || 0, meta.met_ago || 0,
            meta.met_set || 0, meta.met_out || 0, meta.met_nov || 0, meta.met_dez || 0,
            metaId, id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Meta não encontrada' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Meta atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao atualizar meta: ${error.message}` });
    }
});

// DELETE - Remover meta
app.delete('/api/sellers/:id/metas/:metaId', async (req, res) => {
    try {
        const { id, metaId } = req.params;

        const result = await pool.query(
            'DELETE FROM vend_metas WHERE met_id = $1 AND met_vendedor = $2 RETURNING *',
            [metaId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Meta não encontrada' });
        }

        res.json({ success: true, message: 'Meta excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao excluir meta: ${error.message}` });
    }
});

// ==================== PRODUCT GROUPS ENDPOINTS ====================

// GET - Listar todos os grupos de produtos
app.get('/api/product-groups', async (req, res) => {
    try {
        const query = `
            SELECT 
                gru_codigo,
                gru_descricao,
                gru_compreposto
            FROM grupos
            ORDER BY gru_descricao
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupos: ${error.message}`
        });
    }
});

// GET - Buscar grupo por ID
app.get('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM grupos WHERE gru_codigo = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupo: ${error.message}`
        });
    }
});

// POST - Criar novo grupo
app.post('/api/product-groups', async (req, res) => {
    try {
        const { gru_descricao, gru_compreposto } = req.body;

        if (!gru_descricao) {
            return res.status(400).json({
                success: false,
                message: 'Descrição é obrigatória'
            });
        }

        const query = `
            INSERT INTO grupos (gru_descricao, gru_compreposto)
            VALUES ($1, $2)
            RETURNING *
        `;

        const result = await pool.query(query, [
            gru_descricao,
            gru_compreposto || 0
        ]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar grupo: ${error.message}`
        });
    }
});

// PUT - Atualizar grupo
app.put('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { gru_descricao, gru_compreposto } = req.body;

        if (!gru_descricao) {
            return res.status(400).json({
                success: false,
                message: 'Descrição é obrigatória'
            });
        }

        const query = `
            UPDATE grupos
            SET gru_descricao = $1,
                gru_compreposto = $2
            WHERE gru_codigo = $3
            RETURNING *
        `;

        const result = await pool.query(query, [
            gru_descricao,
            gru_compreposto || 0,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar grupo: ${error.message}`
        });
    }
});

// DELETE - Excluir grupo
app.delete('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM grupos WHERE gru_codigo = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Grupo excluído com sucesso!'
        });
    } catch (error) {
        // Check for foreign key constraint
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir este grupo pois ele está sendo utilizado'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao excluir grupo: ${error.message}`
        });
    }
});


// ==================== ORDERS MODULE ENDPOINTS ====================

// GET - List active industries for orders with order count
app.get('/api/orders/industries', async (req, res) => {
    const tenantCnpj = req.headers['x-tenant-cnpj'];
    const db = getCurrentPool();
    console.log(`🚀 [ORDERS_INDUSTRIES] REACHED | Tenant: ${tenantCnpj} | Pool: ${db ? 'Tenant' : 'Master'}`);

    try {
        // Query com filtro de indústrias ativas (for_tipo2 = 'A')
        const query = `
            SELECT 
                f.for_codigo, 
                f.for_nomered,
                (SELECT COUNT(*) FROM pedidos p WHERE p.ped_industria = f.for_codigo) as total_pedidos
            FROM fornecedores f
            WHERE f.for_nomered IS NOT NULL
              AND f.for_tipo2 = 'A'
            ORDER BY f.for_nomered ASC
            LIMIT 200
        `;
        const result = await pool.query(query);
        console.log(`✅ [ORDERS_INDUSTRIES] Found ${result.rows.length} active industries`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ [ORDERS_INDUSTRIES] Error:', error);

        // Fallback: tenta sem o filtro for_tipo2 caso a coluna não exista
        try {
            const fallbackResult = await pool.query('SELECT for_codigo, for_nomered, 0 as total_pedidos FROM fornecedores WHERE for_nomered IS NOT NULL ORDER BY for_nomered LIMIT 200');
            return res.json({ success: true, data: fallbackResult.rows });
        } catch (fError) {
            res.status(500).json({
                success: false,
                message: `Erro fatal ao buscar indústrias: ${error.message}`,
                poolSource: db ? 'Tenant' : 'Master'
            });
        }
    }
});

// GET - List active clients for orders (for combobox)
app.get('/api/orders/clients', async (req, res) => {
    try {
        const query = `
            SELECT cli_codigo, cli_nomred, cli_cnpj
            FROM clientes
            WHERE cli_tipopes = 'A'
            ORDER BY cli_nomred ASC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



// GET - List orders with filters
app.get('/api/orders', async (req, res) => {
    try {
        const {
            industria,
            cliente,
            ignorarIndustria,
            pesquisa,
            situacao,
            dataInicio,
            dataFim,
            limit
        } = req.query;

        console.log('📦 [ORDERS] Fetching orders with filters:', {
            industria,
            cliente,
            ignorarIndustria,
            pesquisa,
            situacao,
            dataInicio,
            dataFim,
            limit
        });

        // Build dynamic query
        let query = `
            SELECT
                p.*,
                c.cli_nomred,
                c.cli_nome,
                f.for_nomered,
                v.ven_nome,
                t.tra_nome,
                (SELECT COALESCE(SUM(i.ite_quant), 0) FROM itens_ped i WHERE i.ite_pedido = p.ped_pedido) as ped_total_quant
            FROM pedidos p
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
            LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
            LEFT JOIN transportadora t ON p.ped_transp = t.tra_codigo
            WHERE 1 = 1
    `;

        const params = [];
        let paramIndex = 1;

        // Filter by industry (if not ignoring and not 'all')
        if (industria && industria !== 'all' && ignorarIndustria !== 'true') {
            query += ` AND p.ped_industria = $${paramIndex} `;
            params.push(parseInt(industria));
            paramIndex++;
        }

        // Filter by client (if provided)
        if (cliente) {
            query += ` AND p.ped_cliente = $${paramIndex} `;
            params.push(parseInt(cliente));
            paramIndex++;
        }

        // Filter by search term (order number or client name)
        if (pesquisa) {
            query += ` AND(
        p.ped_pedido ILIKE $${paramIndex} OR
                c.cli_nomred ILIKE $${paramIndex}
    )`;
            params.push(`%${pesquisa}%`);
            paramIndex++;
        }

        // Filter by situation (if not 'Z' = All)
        if (situacao && situacao !== 'Z') {
            query += ` AND p.ped_situacao = $${paramIndex} `;
            params.push(situacao);
            paramIndex++;
        }

        // Filter by date range
        if (dataInicio) {
            query += ` AND p.ped_data >= $${paramIndex} `;
            params.push(dataInicio);
            paramIndex++;
        }

        if (dataFim) {
            query += ` AND p.ped_data <= $${paramIndex} `;
            params.push(dataFim);
            paramIndex++;
        }

        // Order by date descending
        query += ` ORDER BY p.ped_data DESC`;

        // Limit results (default 700)
        const limitValue = limit || 700;
        query += ` LIMIT $${paramIndex} `;
        params.push(parseInt(limitValue));

        console.log('📦 [ORDERS] Executing query with params:', params);

        const result = await pool.query(query, params);

        console.log(`📦[ORDERS] Found ${result.rows.length} orders`);

        res.json({
            success: true,
            pedidos: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar pedidos: ${error.message} `
        });
    }
});

// GET - Estatísticas dos pedidos usando função do PostgreSQL
app.get('/api/orders/stats', async (req, res) => {
    try {
        const { dataInicio, dataFim, industria } = req.query;

        console.log('📊 [STATS] Fetching order stats:', { dataInicio, dataFim, industria });

        const query = `SELECT * FROM get_orders_stats($1, $2, $3)`;
        const params = [
            dataInicio || null,
            dataFim || null,
            industria && industria !== 'all' ? parseInt(industria) : null
        ];

        const result = await pool.query(query, params);

        if (result.rows.length > 0) {
            const stats = result.rows[0];
            res.json({
                success: true,
                data: {
                    total_vendido: parseFloat(stats.total_vendido),
                    total_quantidade: parseFloat(stats.total_quantidade),
                    total_clientes: parseInt(stats.total_clientes),
                    ticket_medio: parseFloat(stats.ticket_medio)
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    total_vendido: 0,
                    total_quantidade: 0,
                    total_clientes: 0,
                    ticket_medio: 0
                }
            });
        }
    } catch (error) {
        console.error('❌ [STATS] Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar estatísticas: ${error.message} `
        });
    }
});

// POST - Criar novo pedido
app.post('/api/orders', async (req, res) => {
    try {
        const {
            ped_data,
            ped_situacao,
            ped_cliente,
            ped_transp,
            ped_vendedor,
            ped_condpag,
            ped_comprador,
            ped_nffat,
            ped_tipofrete,
            ped_tabela,
            ped_industria,
            ped_cliind,
            ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
            ped_sex, ped_set, ped_oit, ped_nov,
            ped_obs,
            ped_totbruto,
            ped_totliq,
            ped_totalipi
        } = req.body;

        console.log('📝 [ORDERS] Creating new order:', {
            cliente: ped_cliente,
            industria: ped_industria,
            total: ped_totliq
        });

        // Validações obrigatórias
        if (!ped_cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente é obrigatório'
            });
        }

        if (!ped_vendedor) {
            return res.status(400).json({
                success: false,
                message: 'Vendedor é obrigatório'
            });
        }

        if (!ped_industria) {
            return res.status(400).json({
                success: false,
                message: 'Indústria é obrigatória'
            });
        }

        if (!ped_tabela) {
            return res.status(400).json({
                success: false,
                message: 'Tabela de preço é obrigatória'
            });
        }

        // Gerar número do pedido
        // Temporariamente usando "HS" (Hamilton Silva) - futuramente virá do login
        const userInitials = "HS";

        // Buscar próximo número sequencial
        const seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
        const pedNumero = seqResult.rows[0].next_num;

        // Formatar: HS + 000001 (6 dígitos com zeros à esquerda)
        const pedPedido = userInitials + pedNumero.toString().padStart(6, '0');

        console.log(`📝[ORDERS] Generated order number: ${pedPedido} (${userInitials} + ${pedNumero})`);

        // Inserir pedido
        const query = `
            INSERT INTO pedidos(
        ped_numero,
        ped_pedido,
        ped_data,
        ped_situacao,
        ped_cliente,
        ped_transp,
        ped_vendedor,
        ped_condpag,
        ped_comprador,
        ped_nffat,
        ped_tipofrete,
        ped_tabela,
        ped_industria,
        ped_cliind,
        ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
        ped_sex, ped_set, ped_oit, ped_nov,
        ped_totbruto,
        ped_totliq,
        ped_totalipi,
        ped_obs
    ) VALUES(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27
    ) RETURNING *
        `;

        const now = new Date();
        const values = [
            pedNumero,
            pedPedido,
            ped_data || now.toISOString().split('T')[0],
            ped_situacao || 'P',
            ped_cliente,
            ped_transp || 0,
            ped_vendedor,
            ped_condpag || '',
            ped_comprador || '',
            ped_nffat || '',
            ped_tipofrete || 'C',
            ped_tabela,
            ped_industria,
            ped_cliind || '',
            ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
            ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
            ped_totbruto || 0,
            ped_totliq || 0,
            ped_totalipi || 0,
            ped_obs || ''
        ];

        const result = await pool.query(query, values);

        console.log(`✅[ORDERS] Order created successfully: ${pedPedido} `);

        res.json({
            success: true,
            message: `Pedido ${pedPedido} criado com sucesso!`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error creating order:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao criar pedido: ${error.message} `
        });
    }
});


// PUT - Atualizar pedido existente
app.put('/api/orders/:pedPedido', async (req, res) => {
    try {
        const { pedPedido } = req.params;
        const {
            ped_data,
            ped_situacao,
            ped_cliente,
            ped_transp,
            ped_vendedor,
            ped_condpag,
            ped_comprador,
            ped_nffat,
            ped_tipofrete,
            ped_tabela,
            ped_industria,
            ped_cliind,
            ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
            ped_sex, ped_set, ped_oit, ped_nov,
            ped_obs,
            ped_totbruto,
            ped_totliq,
            ped_totalipi
        } = req.body;

        // Support for composite ID (pedido:industria)
        let finalId = pedPedido;
        let finalIndId = ped_industria;
        if (pedPedido.includes(':')) {
            const parts = pedPedido.split(':');
            finalId = parts[0];
            finalIndId = parseInt(parts[1], 10);
        }

        console.log(`📝 [ORDERS] Updating order: ${finalId} | Industry: ${finalIndId} | Client: ${ped_cliente}`);

        const query = `
            UPDATE pedidos SET
                ped_data = $1,
                ped_situacao = $2,
                ped_cliente = $3,
                ped_transp = $4,
                ped_vendedor = $5,
                ped_condpag = $6,
                ped_comprador = $7,
                ped_nffat = $8,
                ped_tipofrete = $9,
                ped_tabela = $10,
                ped_industria = $11,
                ped_cliind = $12,
                ped_pri = $13, ped_seg = $14, ped_ter = $15, ped_qua = $16, ped_qui = $17,
                ped_sex = $18, ped_set = $19, ped_oit = $20, ped_nov = $21,
                ped_obs = $22,
                ped_totbruto = $23,
                ped_totliq = $24,
                ped_totalipi = $25
            WHERE ped_pedido = $26 AND ped_industria = $27
            RETURNING *
        `;

        const values = [
            ped_data,
            ped_situacao || 'P',
            ped_cliente,
            ped_transp || 0,
            ped_vendedor,
            ped_condpag || '',
            ped_comprador || '',
            ped_nffat || '',
            ped_tipofrete || 'C',
            ped_tabela,
            finalIndId,
            ped_cliind || '',
            ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
            ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
            ped_obs || '',
            ped_totbruto || 0,
            ped_totliq || 0,
            ped_totalipi || 0,
            finalId,
            finalIndId
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado no banco de dados'
            });
        }

        console.log(`✅ [ORDERS] Order updated successfully: ${pedPedido}`);

        res.json({
            success: true,
            message: `Pedido ${pedPedido} atualizado com sucesso!`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error updating order:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar pedido: ${error.message}`
        });
    }
});



// DELETE - Excluir pedido
app.delete('/api/orders/:pedPedido', async (req, res) => {
    const client = await pool.connect();
    try {
        const { pedPedido } = req.params;

        console.log(`📝 [ORDERS] Deleting order: ${pedPedido}`);

        await client.query('BEGIN');

        // 1. Excluir itens do pedido
        await client.query('DELETE FROM itens_ped WHERE ite_pedido = $1', [pedPedido]);

        // 2. Excluir o pedido
        const deleteResult = await client.query('DELETE FROM pedidos WHERE ped_pedido = $1 RETURNING *', [pedPedido]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado para exclusão'
            });
        }

        await client.query('COMMIT');
        console.log(`✅ [ORDERS] Order deleted successfully: ${pedPedido}`);

        res.json({
            success: true,
            message: `Pedido ${pedPedido} excluído com sucesso!`,
            deletedOrder: deleteResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [ORDERS] Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao excluir pedido: ${error.message}`
        });
    } finally {
        client.release();
    }
});

// (Registrations moved to the top of the file)

// --- GLOBAL ERROR HANDLING (PREVENT CRASH) ---

process.on('uncaughtException', (err) => {
    console.error('🔴 [CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🟠 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Backend rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});

// Aumentar o timeout para 4 minutos para suportar processamento de IA longo
server.timeout = 240000;
