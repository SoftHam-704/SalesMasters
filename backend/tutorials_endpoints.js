const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    /**
     * @route GET /api/tutorials/*
     * @desc Get tutorial video for a specific route
     */
    // List all tutorials
    router.get('/', async (req, res) => {
        const db = req.pool || pool;
        try {
            const query = 'SELECT * FROM config_tutoriais WHERE tut_ativo = TRUE ORDER BY tut_titulo ASC';
            const result = await db.query(query);
            res.json({
                success: true,
                data: result.rows
            });
        } catch (err) {
            console.error('Erro ao listar tutoriais:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Specific contextual route
    router.get(/\/(.*)/, async (req, res) => {
        let routePath = req.params[0];
        if (!routePath) return res.status(404).json({ success: false, message: 'Rota não fornecida' });

        // Ensure it starts with /
        if (!routePath.startsWith('/')) routePath = '/' + routePath;

        const db = req.pool || pool;

        try {
            const query = 'SELECT * FROM config_tutoriais WHERE tut_rota = $1 AND tut_ativo = TRUE';
            const result = await db.query(query, [routePath]);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    data: result.rows[0]
                });
            } else {
                res.json({
                    success: false,
                    message: 'Nenhum tutorial encontrado para esta rota.'
                });
            }
        } catch (err) {
            console.error('Erro ao buscar tutorial:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
