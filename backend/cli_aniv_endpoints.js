/**
 * CLI_ANIV Endpoints Module
 * Gerencia contatos/aniversariantes dos clientes
 */

module.exports = function (pool) {
    const express = require('express');
    const router = express.Router();

    /**
     * GET /api/cli-aniv/buyer/:clientCode
     * Busca comprador do cliente pela função que inicia com "COMPRA"
     * 
     * @param {string} clientCode - Código do cliente (ani_cliente)
     * @returns {object} Dados do comprador (nome e email) ou null se não encontrado
     */
    router.get('/cli-aniv/buyer/:clientCode', async (req, res) => {
        try {
            const { clientCode } = req.params;

            console.log(`🔍 [CLI_ANIV] Buscando comprador para cliente ${clientCode}`);

            const query = `
                SELECT 
                    ani_nome,
                    ani_email,
                    ani_funcao
                FROM cli_aniv
                WHERE ani_cliente = $1 
                  AND UPPER(ani_funcao) LIKE 'COMPRA%'
                LIMIT 1
            `;

            const result = await pool.query(query, [clientCode]);

            if (result.rows.length === 0) {
                console.log(`ℹ️  [CLI_ANIV] Nenhum comprador encontrado para cliente ${clientCode}`);
                return res.json({
                    success: true,
                    data: null,
                    message: 'Nenhum comprador encontrado'
                });
            }

            const buyer = result.rows[0];

            console.log(`✅ [CLI_ANIV] Comprador encontrado: ${buyer.ani_nome} (${buyer.ani_funcao})`);

            res.json({
                success: true,
                data: {
                    nome: buyer.ani_nome,
                    email: buyer.ani_email,
                    funcao: buyer.ani_funcao
                }
            });

        } catch (error) {
            console.error('❌ [CLI_ANIV] Erro ao buscar comprador:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar comprador: ${error.message}`
            });
        }
    });

    /**
     * POST /api/cli-aniv/buyer
     * Cria novo comprador na tabela CLI_ANIV
     * 
     * @body {number} clientCode - Código do cliente
     * @body {string} buyerName - Nome do comprador
     * @body {string} email - Email do comprador
     * @body {number} birthDay - Dia do aniversário (1-31)
     * @body {number} birthMonth - Mês do aniversário (1-12)
     * @body {string} phone - Telefone (opcional)
     * @returns {object} Comprador criado
     */
    router.post('/cli-aniv/buyer', async (req, res) => {
        try {
            const { clientCode, buyerName, email, birthDay, birthMonth, phone } = req.body;

            // Validação
            if (!clientCode || !buyerName) {
                return res.status(400).json({
                    success: false,
                    message: 'Código do cliente e nome do comprador são obrigatórios'
                });
            }

            console.log(`➕ [CLI_ANIV] Criando comprador: ${buyerName} para cliente ${clientCode}`);

            // Calcula data de aniversário (Ano fixo 2001)
            let niverDate = null;
            if (birthDay && birthMonth) {
                const day = birthDay.toString().padStart(2, '0');
                const month = birthMonth.toString().padStart(2, '0');
                niverDate = `2001-${month}-${day}`;
            }

            const query = `
                INSERT INTO cli_aniv (
                    ani_cliente, 
                    ani_nome, 
                    ani_funcao, 
                    ani_email, 
                    ani_diaaniv, 
                    ani_mes,
                    ani_fone,
                    ani_niver
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (ani_cliente, ani_nome, ani_funcao) 
                DO UPDATE SET
                    ani_email = EXCLUDED.ani_email,
                    ani_diaaniv = EXCLUDED.ani_diaaniv,
                    ani_mes = EXCLUDED.ani_mes,
                    ani_fone = EXCLUDED.ani_fone,
                    ani_niver = EXCLUDED.ani_niver
                RETURNING *
            `;

            const result = await pool.query(query, [
                clientCode,
                buyerName,
                'COMPRAS', // Função fixa
                email || null,
                birthDay || null,
                birthMonth || null,
                phone || null,
                niverDate
            ]);

            console.log(`✅ [CLI_ANIV] Comprador criado/atualizado: ${buyerName}`);

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Comprador cadastrado com sucesso!'
            });

        } catch (error) {
            console.error('❌ [CLI_ANIV] Erro ao criar comprador:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao criar comprador: ${error.message}`
            });
        }
    });

    return router;
};
