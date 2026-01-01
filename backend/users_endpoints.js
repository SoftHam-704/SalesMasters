module.exports = function (pool) {
    const express = require('express');
    const router = express.Router();

    // GET all users - simple list for combobox
    router.get('/', async (req, res) => {
        try {
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
                ORDER BY nome, sobrenome
            `;

            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar usuários',
                error: error.message
            });
        }
    });

    return router;
};
