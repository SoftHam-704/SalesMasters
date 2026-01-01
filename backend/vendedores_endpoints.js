const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET /api/sellers
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT 
                    ven_codigo as id,
                    ven_nome,
                    ven_nome as nome,
                    ven_email as email
                FROM vendedores
                WHERE ven_nome IS NOT NULL
                ORDER BY ven_nome
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching sellers:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar vendedores' });
        }
    });

    return router;
};
