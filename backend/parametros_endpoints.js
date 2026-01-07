/**
 * Parametros Endpoints Module
 * Gerencia configurações do sistema por usuário
 */

module.exports = function (pool) {
    const express = require('express');
    const router = express.Router();

    /**
     * GET /api/parametros/:userId
     * Busca parâmetros de um usuário
     */
    router.get('/parametros/:userId', async (req, res) => {
        try {
            const { userId } = req.params;

            const query = 'SELECT * FROM parametros WHERE par_usuario = $1';
            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'Parâmetros não encontrados'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('❌ [PARAMETROS] Erro ao buscar:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    /**
     * POST /api/parametros
     * Cria ou atualiza parâmetros do usuário
     */
    router.post('/parametros', async (req, res) => {
        try {
            const params = req.body;

            // Verificar se já existe
            const checkQuery = 'SELECT par_id FROM parametros WHERE par_usuario = $1';
            const checkResult = await pool.query(checkQuery, [params.par_usuario]);

            let query, values;

            if (checkResult.rows.length > 0) {
                // UPDATE
                query = `
                    UPDATE parametros SET
                        par_ordemped = $1,
                        par_qtdenter = $2,
                        par_itemduplicado = $3,
                        par_ordemimpressao = $4,
                        par_descontogrupo = $5,
                        par_separalinhas = $6,
                        par_usadecimais = $7,
                        par_fmtpesquisa = $8,
                        par_zerapromo = $9,
                        par_tipopesquisa = $10,
                        par_validapromocao = $11,
                        par_salvapedidoauto = $12,
                        par_mostracodori = $13,
                        par_solicitarconfemail = $14,
                        par_mostrapednovos = $15,
                        par_mostraimpostos = $16,
                        par_qtddecimais = $17,
                        par_pedidopadrao = $18,
                        par_telemkttipo = $19,
                        par_iniciapedido = $20,
                        par_tipofretepadrao = $21,
                        par_emailserver = $22,
                        par_email = $23,
                        par_emailuser = $24,
                        par_emailporta = $25,
                        par_emailpassword = $26,
                        par_emailtls = $27,
                        par_emailssl = $28,
                        par_emailalternativo = $29,
                        par_obs_padrao = $31
                    WHERE par_usuario = $30
                    RETURNING *
                `;
                values = [
                    params.par_ordemped, params.par_qtdenter, params.par_itemduplicado,
                    params.par_ordemimpressao, params.par_descontogrupo, params.par_separalinhas,
                    params.par_usadecimais, params.par_fmtpesquisa, params.par_zerapromo,
                    params.par_tipopesquisa, params.par_validapromocao, params.par_salvapedidoauto,
                    params.par_mostracodori, params.par_solicitarconfemail, params.par_mostrapednovos,
                    params.par_mostraimpostos, params.par_qtddecimais, params.par_pedidopadrao,
                    params.par_telemkttipo, params.par_iniciapedido, params.par_tipofretepadrao,
                    params.par_emailserver, params.par_email, params.par_emailuser,
                    params.par_emailporta, params.par_emailpassword, params.par_emailtls,
                    params.par_emailssl, params.par_emailalternativo, params.par_usuario,
                    params.par_obs_padrao
                ];
            } else {
                // INSERT
                query = `
                    INSERT INTO parametros (
                        par_usuario, par_ordemped, par_qtdenter, par_itemduplicado,
                        par_ordemimpressao, par_descontogrupo, par_separalinhas, par_usadecimais,
                        par_fmtpesquisa, par_zerapromo, par_tipopesquisa, par_validapromocao,
                        par_salvapedidoauto, par_mostracodori, par_solicitarconfemail,
                        par_mostrapednovos, par_mostraimpostos, par_qtddecimais, par_pedidopadrao,
                        par_telemkttipo, par_iniciapedido, par_tipofretepadrao,
                        par_emailserver, par_email, par_emailuser, par_emailporta,
                        par_emailpassword, par_emailtls, par_emailssl, par_emailalternativo,
                        par_obs_padrao
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
                    ) RETURNING *
                `;
                values = [
                    params.par_usuario, params.par_ordemped, params.par_qtdenter,
                    params.par_itemduplicado, params.par_ordemimpressao, params.par_descontogrupo,
                    params.par_separalinhas, params.par_usadecimais, params.par_fmtpesquisa,
                    params.par_zerapromo, params.par_tipopesquisa, params.par_validapromocao,
                    params.par_salvapedidoauto, params.par_mostracodori, params.par_solicitarconfemail,
                    params.par_mostrapednovos, params.par_mostraimpostos, params.par_qtddecimais,
                    params.par_pedidopadrao, params.par_telemkttipo, params.par_iniciapedido,
                    params.par_tipofretepadrao, params.par_emailserver, params.par_email,
                    params.par_emailuser, params.par_emailporta, params.par_emailpassword,
                    params.par_emailtls, params.par_emailssl, params.par_emailalternativo,
                    params.par_obs_padrao
                ];
            }

            const result = await pool.query(query, values);

            res.json({
                success: true,
                data: result.rows[0],
                message: checkResult.rows.length > 0 ? 'Parâmetros atualizados' : 'Parâmetros criados'
            });

        } catch (error) {
            console.error('❌ [PARAMETROS] Erro ao salvar:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
};
