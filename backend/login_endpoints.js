module.exports = function (pool) {
    const express = require('express');
    const router = express.Router();

    // POST /api/login - Authenticate user
    router.post('/login', async (req, res) => {
        const { nome, sobrenome, password } = req.body;

        if (!nome || !sobrenome || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nome, sobrenome e senha são obrigatórios'
            });
        }

        try {
            // Consulta para verificar o usuário na tabela user_nomes
            // Note: O campo na tabela é 'senha', mas o frontend envia 'password'
            const query = `
                SELECT 
                    codigo,
                    nome,
                    sobrenome,
                    usuario,
                    grupo,
                    master,
                    gerencia
                FROM user_nomes
                WHERE nome ILIKE $1 
                  AND sobrenome ILIKE $2 
                  AND senha = $3
            `;

            const result = await pool.query(query, [nome, sobrenome, password]);

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas! Verifique nome, sobrenome e senha.'
                });
            }

            const user = result.rows[0];

            res.json({
                success: true,
                message: 'Login realizado com sucesso!',
                data: {
                    codigo: user.codigo,
                    nome: user.nome,
                    sobrenome: user.sobrenome,
                    usuario: user.usuario,
                    role: user.master ? 'admin' : (user.gerencia ? 'manager' : 'user')
                }
            });

        } catch (error) {
            console.error('❌ [AUTH] Error during login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao processar login',
                error: error.message
            });
        }
    });

    return router;
};
