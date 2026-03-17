/**
 * CLI_IND Endpoints Module
 * Gerencia condições especiais por cliente/indústria
 */

module.exports = function (pool) {
    const express = require('express');
    const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');
    const router = express.Router();

    /**
     * GET /api/cli-ind/:clientCode/:supplierCode
     * Busca condições especiais de um cliente para uma indústria específica
     */
    router.get('/:clientCode/:supplierCode', async (req, res) => {
        try {
            const { clientCode, supplierCode } = req.params;
            const userId = req.headers['x-user-id'];

            console.log(`📋 [CLI_IND] Buscando condições para cliente ${clientCode} + indústria ${supplierCode}`);

            // Verificar permissões do usuário
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'cli_forcodigo');

            const query = `
                SELECT 
                    cli_transportadora,
                    COALESCE(cli_desc1, '0') as cli_desc1,
                    COALESCE(cli_desc2, '0') as cli_desc2,
                    COALESCE(cli_desc3, '0') as cli_desc3,
                    COALESCE(cli_desc4, '0') as cli_desc4,
                    COALESCE(cli_desc5, '0') as cli_desc5,
                    COALESCE(cli_desc6, '0') as cli_desc6,
                    COALESCE(cli_desc7, '0') as cli_desc7,
                    COALESCE(cli_desc8, '0') as cli_desc8,
                    COALESCE(cli_desc9, '0') as cli_desc9,
                    COALESCE(cli_desc10, '0') as cli_desc10,
                    cli_prazopg,
                    cli_tabela,
                    COALESCE(cli_ipi, '0') as cli_ipi,
                    cli_comprador,
                    cli_obsparticular,
                    cli_frete
                FROM cli_ind
                WHERE cli_forcodigo = $1 
                  AND cli_codigo = $2
                  ${filterClause}
                LIMIT 1
            `;

            const result = await pool.query(query, [supplierCode, clientCode]);

            if (result.rows.length === 0) {
                console.log(`ℹ️  [CLI_IND] Nenhuma condição especial encontrada para cliente ${clientCode}`);
                return res.json({
                    success: true,
                    data: null,
                    message: 'Nenhuma condição especial encontrada'
                });
            }

            const conditions = result.rows[0];

            console.log(`✅ [CLI_IND] Condições encontradas:`, {
                descontos: `${conditions.cli_desc1}% / ${conditions.cli_desc2}% / ${conditions.cli_desc3}%`,
                transportadora: conditions.cli_transportadora,
                prazo: conditions.cli_prazopg
            });

            res.json({
                success: true,
                data: conditions
            });

        } catch (error) {
            console.error('❌ [CLI_IND] Erro ao buscar condições:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar condições especiais: ${error.message}`
            });
        }
    });

    /**
     * POST /api/cli-ind
     * Cria ou atualiza condições especiais de um cliente para uma indústria
     */
    router.post('/', async (req, res) => {
        try {
            const {
                clientCode,
                supplierCode,
                discounts, // Array or object with desc1...desc9
                paymentTerm,
                priceTable,
                carrierCode,
                freightType,
                buyerName,
                buyerEmail
            } = req.body;

            if (!clientCode || !supplierCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente e Indústria são obrigatórios'
                });
            }

            console.log(`💾 [CLI_IND] Salvando condições para Cliente ${clientCode} + Indústria ${supplierCode}`);

            // Verificar se já existe
            const checkQuery = `
                SELECT cli_lancamento FROM cli_ind 
                WHERE cli_codigo = $1 AND cli_forcodigo = $2 
                LIMIT 1
            `;
            const checkResult = await pool.query(checkQuery, [clientCode, supplierCode]);
            const existingRecord = checkResult.rows && checkResult.rows.length > 0 ? checkResult.rows[0] : null;

            let query;
            let values;

            const d = discounts || {};

            if (existingRecord) {
                // UPDATE
                console.log(`🔄 [CLI_IND] Atualizando registro existente (ID: ${existingRecord.cli_lancamento})`);
                query = `
                    UPDATE cli_ind SET
                        cli_desc1 = $1, cli_desc2 = $2, cli_desc3 = $3, 
                        cli_desc4 = $4, cli_desc5 = $5, cli_desc6 = $6, 
                        cli_desc7 = $7, cli_desc8 = $8, cli_desc9 = $9,
                        cli_prazopg = $10,
                        cli_tabela = $11,
                        cli_transportadora = $12,
                        cli_frete = $13,
                        cli_comprador = $14,
                        cli_emailcomprador = $15
                    WHERE cli_codigo = $16 AND cli_forcodigo = $17
                    RETURNING cli_lancamento
                `;
                values = [
                    d.desc1 || 0, d.desc2 || 0, d.desc3 || 0,
                    d.desc4 || 0, d.desc5 || 0, d.desc6 || 0,
                    d.desc7 || 0, d.desc8 || 0, d.desc9 || 0,
                    paymentTerm || '',
                    priceTable || '',
                    carrierCode || null,
                    freightType || '',
                    buyerName || '',
                    buyerEmail || '',
                    clientCode,
                    supplierCode
                ];
            } else {
                // INSERT
                console.log(`➕ [CLI_IND] Criando novo registro`);

                // Get next ID
                const maxIdResult = await pool.query('SELECT COALESCE(MAX(cli_lancamento), 0) + 1 as next_id FROM cli_ind');
                const nextId = maxIdResult.rows[0].next_id;

                query = `
                    INSERT INTO cli_ind (
                        cli_lancamento, cli_codigo, cli_forcodigo,
                        cli_desc1, cli_desc2, cli_desc3, 
                        cli_desc4, cli_desc5, cli_desc6, 
                        cli_desc7, cli_desc8, cli_desc9,
                        cli_prazopg, cli_tabela, cli_transportadora, 
                        cli_frete, cli_comprador, cli_emailcomprador
                    ) VALUES (
                        $1, $2, $3,
                        $4, $5, $6, $7, $8, $9, $10, $11, $12,
                        $13, $14, $15, $16, $17, $18
                    )
                    RETURNING cli_lancamento
                `;
                values = [
                    nextId,
                    clientCode,
                    supplierCode,
                    d.desc1 || 0, d.desc2 || 0, d.desc3 || 0,
                    d.desc4 || 0, d.desc5 || 0, d.desc6 || 0,
                    d.desc7 || 0, d.desc8 || 0, d.desc9 || 0,
                    paymentTerm || '',
                    priceTable || '',
                    carrierCode || null,
                    freightType || '',
                    buyerName || '',
                    buyerEmail || ''
                ];
            }

            const result = await pool.query(query, values);

            res.json({
                success: true,
                message: 'Condições comerciais salvas com sucesso!',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('❌ [CLI_IND] Erro ao salvar condições:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao salvar condições: ${error.message}`
            });
        }
    });

    return router;
};
