const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET all clients
    router.get('/', async (req, res) => {
        try {
            const { page = 1, limit = 10, search, active = 'true' } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_cnpj,
                    c.cli_nomred,
                    c.cli_nome,
                    c.cli_fantasia,
                    coalesce(cid.cid_nome, c.cli_cidade) as cli_cidade,
                    coalesce(cid.cid_uf, c.cli_uf) as cli_uf,
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
            let paramIndex = 1;

            if (search) {
                query += ` AND (
                    c.cli_nome ILIKE $${paramIndex} OR 
                    c.cli_fantasia ILIKE $${paramIndex} OR 
                    c.cli_nomred ILIKE $${paramIndex} OR 
                    c.cli_cnpj ILIKE $${paramIndex} OR
                    c.cli_redeloja ILIKE $${paramIndex} OR
                    cid.cid_nome ILIKE $${paramIndex} OR
                    CAST(c.cli_codigo AS TEXT) ILIKE $${paramIndex}
                )`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            if (active === 'true') {
                query += ` AND c.cli_tipopes = 'A'`;
            } else if (active === 'false') {
                query += ` AND c.cli_tipopes = 'I'`;
            }
            // active === 'all' (or anything else) will not filter by status

            // Count for pagination
            const countQuery = `SELECT count(*) FROM clientes c LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo WHERE ${query.split('WHERE')[1]}`;
            // Optimization: Re-using the WHERE clause logic might be tricky with param indexes if I'm not careful.
            // A safer way for count is to rebuild the WHERE part or ensure params match.
            // Actually, the simplest way for now is just repeating the WHERE conditions logic safely.

            // Let's actually rebuild the basics to be safe and clean or use a subquery for count on the full query before limit
            // But 'query' already has the WHERE clauses appended.
            const countRes = await pool.query(`SELECT count(*) FROM (${query}) as t`, params);
            const totalRecords = parseInt(countRes.rows[0].count);

            query += ` ORDER BY c.cli_nomred ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalRecords,
                    totalPages: Math.ceil(totalRecords / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create Client
    router.post('/', async (req, res) => {
        // Basic implementation for now - extend as needed
        res.status(501).json({ success: false, message: 'Create client not implemented yet' });
    });

    // PUT - Update Client
    router.put('/:id', async (req, res) => {
        // Basic implementation for now - extend as needed
        res.status(501).json({ success: false, message: 'Update client not implemented yet' });
    });

    // DELETE - Delete Client
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // Logical delete usually preferred, but for now matching interface
            await pool.query('UPDATE clientes SET cli_tipopes = \'I\' WHERE cli_codigo = $1', [id]);
            res.json({ success: true, message: 'Cliente inativado com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
