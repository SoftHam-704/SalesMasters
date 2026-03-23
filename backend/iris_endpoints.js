const express = require('express');
const router = express.Router();

module.exports = function(app, pool) {
    // Middleware de Autenticação Iris (MVP)
    const irisAuthMiddleware = (req, res, next) => {
    // Busca o token em vários lugares para máxima compatibilidade
    const authHeader = req.headers.authorization;
    const irisHeader = req.headers['x-iris-token'];
    const token = irisHeader || (authHeader ? authHeader.split(' ')[1] : req.query.token);

    if (!token) {
        console.warn('⚠️ Tentativa de acesso Iris sem token');
        return res.status(401).json({ success: false, message: 'Acesso negado: Token ausente.' });
    }

        try {
            // Reforço: Aceitar Base64 seguro para URL e normalizar espaços
            const normalizedToken = token.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(Buffer.from(normalizedToken, 'base64').toString('utf8'));
            
            // Validação de expiração (ms)
            if (decoded.exp && decoded.exp < Date.now()) {
                return res.status(401).json({ success: false, message: 'Acesso expirado.' });
            }

            if (!decoded.cli_codigo || !decoded.empresa_id) {
                throw new Error('Token inválido');
            }

            req.irisUser = decoded;
            next();
        } catch (error) {
            console.error('❌ [IRIS AUTH] Erro ao decodificar token:', error.message);
            return res.status(401).json({ success: false, message: 'Token Iris inválido ou expirado.' });
        }
    };

    /**
     * GET /api/iris/auth/validate
     */
    router.get('/auth/validate', irisAuthMiddleware, async (req, res) => {
        const { cli_codigo, industrias } = req.irisUser;
        const currentPool = req.pool || pool;

        try {
            const clientRes = await currentPool.query(
                'SELECT cli_codigo, cli_nome, cli_nomred FROM clientes WHERE cli_codigo = $1',
                [cli_codigo]
            );

            if (clientRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Lojista não encontrado.' });
            }

            let industries = [];
            if (industrias && industrias.length > 0) {
                const indRes = await currentPool.query(
                    'SELECT for_codigo as id, for_nome as nome, for_nomered as nome_resumido FROM fornecedores WHERE for_codigo = ANY($1)',
                    [industrias]
                );
                industries = indRes.rows;
            }

            res.json({
                success: true,
                lojista: clientRes.rows[0],
                industrias: industries
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/iris/catalog/search
     */
    router.get('/catalog/search', irisAuthMiddleware, async (req, res) => {
        const { q, industria, tabela } = req.query;
        const currentPool = req.pool || pool;

        if (!q || !industria) {
            return res.status(400).json({ success: false, message: 'Termo (q) e indústria são obrigatórios.' });
        }

        try {
            const query = `
                SELECT 
                    p.pro_codprod,
                    p.pro_nome,
                    p.pro_conversao,
                    p.pro_embalagem,
                    t.itab_precobruto,
                    t.itab_ipi,
                    t.itab_st,
                    t.itab_idprod as pro_id
                FROM cad_tabelaspre t
                JOIN cad_prod p ON t.itab_idprod = p.pro_id
                WHERE t.itab_idindustria = $1
                  AND (t.itab_tabela = $2 OR $2 IS NULL OR $2 = '')
                  AND (
                      p.pro_conversao ILIKE '%' || $3 || '%'
                      OR p.pro_nome ILIKE '%' || $3 || '%'
                      OR p.pro_codprod ILIKE '%' || $3 || '%'
                  )
                ORDER BY 
                    CASE WHEN p.pro_conversao ILIKE $3 || '%' THEN 0
                         WHEN p.pro_conversao ILIKE '%' || $3 || '%' THEN 1
                         WHEN p.pro_nome ILIKE '%' || $3 || '%' THEN 2
                         ELSE 3
                    END
                LIMIT 20
            `;

            const result = await currentPool.query(query, [industria, tabela || null, q]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * POST /api/iris/quotation
     */
    router.post('/quotation', irisAuthMiddleware, async (req, res) => {
        const { cli_codigo } = req.irisUser;
        const { industria, tabela, observacao, itens } = req.body;
        const currentPool = req.pool || pool;

        try {
            await currentPool.query('BEGIN');

            const seqRes = await currentPool.query("SELECT nextval('gen_pedidos_id') as next_num");
            const nextNum = seqRes.rows[0].next_num;
            const ped_pedido = 'IR' + nextNum.toString().padStart(6, '0');

            const headerQuery = `
                INSERT INTO pedidos (
                    ped_pedido, ped_numero, ped_data, ped_cliente, ped_industria, 
                    ped_situacao, ped_origem, ped_obs, ped_tabela, ped_vendedor
                ) VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Q', 'IRIS', $5, $6, 0)
            `;
            await currentPool.query(headerQuery, [ped_pedido, nextNum, cli_codigo, industria, observacao || '', tabela || '']);

            const itemInsertQuery = `
                INSERT INTO itens_ped (
                    ite_pedido, ite_industria, ite_codprod, ite_idprod, 
                    ite_quant, ite_puni, ite_seq
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            let totalBruto = 0;
            for (let i = 0; i < itens.length; i++) {
                const item = itens[i];
                await currentPool.query(itemInsertQuery, [
                    ped_pedido, industria, item.pro_codprod, item.pro_id,
                    item.quantidade, item.preco_unitario, i + 1
                ]);
                totalBruto += item.quantidade * item.preco_unitario;
            }

            await currentPool.query(
                'UPDATE pedidos SET ped_totbruto = $1, ped_totliq = $1 WHERE ped_pedido = $2',
                [totalBruto, ped_pedido]
            );

            await currentPool.query('COMMIT');
            res.json({ success: true, data: { ped_pedido, total: totalBruto } });

        } catch (error) {
            await currentPool.query('ROLLBACK');
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/iris/orders
     */
    router.get('/orders', irisAuthMiddleware, async (req, res) => {
        const { cli_codigo } = req.irisUser;
        const currentPool = req.pool || pool;

        try {
            const query = `
                SELECT 
                    p.ped_pedido, p.ped_data, p.ped_situacao, p.ped_totliq, p.ped_totalipi,
                    p.ped_obs, p.ped_origem,
                    f.for_nomered as industria_nome,
                    (SELECT COUNT(*) FROM itens_ped i WHERE TRIM(i.ite_pedido) = TRIM(p.ped_pedido)) as total_itens
                FROM pedidos p
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_cliente = $1
                ORDER BY p.ped_data DESC, p.ped_pedido DESC
                LIMIT 50
            `;
            const result = await currentPool.query(query, [cli_codigo]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.use('/api/iris', router);
};
