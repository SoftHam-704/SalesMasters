// Order Print Endpoints Module

module.exports = function (app, pool) {

    // GET - Fetch full order data for printing
    app.get('/api/orders/:pedPedido/print-data', async (req, res) => {
        const startTime = Date.now();
        const currentPool = req.pool || pool; // Suporte Multi-tenant

        console.log(`🖨️ [PRINT_DATA] Request received for order: ${req.params.pedPedido}`);

        try {
            const { pedPedido } = req.params;
            const { sortBy, industria } = req.query;

            if (!industria) {
                return res.status(400).json({ success: false, message: 'ID da Indústria (industria) é obrigatório' });
            }

            // 1. Fetch Order Master Data
            // Usamos TRIM para garantir comparação exata e evitar problemas com espaços no banco
            const masterQuery = `
                SELECT 
                    p.*,
                    p.ped_condpag as order_payment_type,
                    c.cli_nome, c.cli_nomred, c.cli_endereco, c.cli_bairro, 
                    c.cli_cidade, c.cli_uf, c.cli_cep, c.cli_cnpj as client_cnpj, c.cli_inscricao, 
                    c.cli_fone1, c.cli_email, c.cli_emailnfe, c.cli_cxpostal, c.cli_suframa,
                    f.for_nome, f.for_nomered, f.for_fone, f.for_cidade, f.for_uf,
                    f.for_logotipo, f.for_locimagem,
                    v.ven_nome, v.ven_fone1,
                    t.tra_nome, t.tra_endereco, t.tra_bairro, t.tra_cidade, t.tra_uf, t.tra_cep, 
                    t.tra_cgc, t.tra_inscricao, t.tra_email,
                    i.cli_obsparticular,
                    (SELECT ani_email FROM cli_aniv ca WHERE ca.ani_cliente = p.ped_cliente AND ca.ani_nome = p.ped_comprador LIMIT 1) as ped_emailcomp
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
                LEFT JOIN transportadora t ON p.ped_transp = t.tra_codigo
                LEFT JOIN cli_ind i ON (p.ped_cliente = i.cli_codigo AND p.ped_industria = i.cli_forcodigo)
                WHERE TRIM(p.ped_pedido) = TRIM($1) AND p.ped_industria = $2
            `;
            const masterResult = await currentPool.query(masterQuery, [pedPedido, parseInt(industria)]);

            if (masterResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }

            const orderData = masterResult.rows[0];

            // 2. Tratamento de Logotipo das Indústrias
            // IMPORTANTE: for_logotipo = imagem base64 no banco; for_locimagem = path antigo do Delphi (IGNORAR)
            let industry_logotipo = null;
            const logoFonte = orderData.for_logotipo;

            if (logoFonte) {
                try {
                    // Limite alinhado com o frontend (150KB base64 ≈ 110KB de imagem)
                    const MAX_LOGO_SIZE = 150000;

                    // PROTEÇÃO: Detectar caminhos de arquivo (for_locimagem guarda path, não base64)
                    if (typeof logoFonte === 'string') {
                        const trimmed = logoFonte.trim();
                        const isPath = /^[A-Za-z]:[\\\/]/.test(trimmed) ||
                            trimmed.startsWith('\\\\') ||
                            (/^\/[a-z]/i.test(trimmed) && trimmed.includes('/')) ||
                            /\.(png|jpg|jpeg|gif|bmp|svg|webp)$/i.test(trimmed);
                        if (isPath) {
                            console.warn(`⚠️ [PRINT-DATA] Logo é um caminho de arquivo, não base64: "${trimmed.substring(0, 60)}" — ignorado.`);
                            // Não processa, mantém industry_logotipo = null
                        } else {
                            const cleanBase64 = trimmed.replace(/[\n\r\s]/g, '').replace(/^data:image\/[a-z+]+;base64,/, '');
                            if (cleanBase64.length <= MAX_LOGO_SIZE) {
                                // Validar que é realmente base64
                                if (/^[A-Za-z0-9+/=]+$/.test(cleanBase64) && cleanBase64.length >= 20) {
                                    let mime = 'image/png';
                                    const start = cleanBase64.substring(0, 10);
                                    if (start.match(/^\/9j\//)) mime = 'image/jpeg';
                                    else if (start.startsWith('iVBORw')) mime = 'image/png';
                                    industry_logotipo = `data:${mime};base64,${cleanBase64}`;
                                } else {
                                    console.warn(`⚠️ [PRINT-DATA] Logo não é base64 válido — ignorado.`);
                                }
                            } else {
                                console.warn(`⚠️ [PRINT-DATA] Logo da indústria ignorado: String Base64 muito longa (${(cleanBase64.length / 1024).toFixed(1)}KB)`);
                            }
                        }
                    } else if (Buffer.isBuffer(logoFonte)) {
                        const base64Str = logoFonte.toString('base64');
                        if (base64Str.length <= MAX_LOGO_SIZE) {
                            industry_logotipo = `data:image/png;base64,${base64Str}`;
                        } else {
                            console.warn(`⚠️ [PRINT-DATA] Logo da indústria ignorado: Buffer muito grande (${(base64Str.length / 1024).toFixed(1)}KB base64)`);
                        }
                    }
                    // Injeta de volta no objeto para o frontend achar fácil
                    orderData.for_logotipo = industry_logotipo;
                    orderData.industry_logotipo = industry_logotipo;
                } catch (e) {
                    console.error('⚠️ [PRINT-DATA] Erro logo indústria:', e.message);
                }
            }

            // 3. Fetch Items
            let itemsQuery;
            let itemsParams;

            const orderBy = sortBy === 'codigo' ? 'ite_produto' :
                sortBy === 'alfabetica' ? 'ite_nomeprod' : 'ite_seq'; // Changed 'ite_sequencia' to 'ite_seq' to match original column name

            itemsQuery = `
                SELECT 
                    ip.*, 
                    p.pro_aplicacao, 
                    p.pro_aplicacao2, 
                    p.pro_codigooriginal 
                FROM itens_ped ip
                LEFT JOIN LATERAL (
                    SELECT cp.pro_aplicacao, cp.pro_aplicacao2, cp.pro_codigooriginal, cp.pro_conversao
                    FROM cad_prod cp
                    WHERE cp.pro_codprod = ip.ite_produto AND cp.pro_industria = ip.ite_industria
                    LIMIT 1
                ) p ON true
                WHERE ip.ite_pedido = $1 AND ip.ite_industria = $2
                ORDER BY ${orderBy}
            `;
            itemsParams = [pedPedido, parseInt(industria)];

            const itemsResult = await currentPool.query(itemsQuery, itemsParams); // Use currentPool

            res.json({
                success: true,
                data: {
                    order: {
                        ...orderData,
                        industry_logotipo // Envia o logo já processado
                    },
                    items: itemsResult.rows
                }
            });

            console.log(`✅ [PRINT_DATA] Success! Order ${pedPedido} | ${itemsResult.rows.length} items | Duration: ${Date.now() - startTime}ms`);

        } catch (error) {
            console.error('❌ [PRINT_DATA] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};
