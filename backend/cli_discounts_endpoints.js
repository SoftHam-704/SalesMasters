const express = require('express');

// CLI Discounts (cli_descpro) Endpoints
module.exports = (pool) => {
    const router = express.Router();

    // GET - List all discount groups (from grupo_desc)
    router.get('/discount-groups', async (req, res) => {
        try {
            const query = `
                SELECT gru_codigo as id, gru_nome as nome, gru_codigo || ' - ' || gru_nome as label
                FROM grupos 
                ORDER BY gru_nome
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CLI_DISCOUNTS] Error listing groups:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Listar todos os descontos de grupo (tabela grupo_desc)
    router.get('/group-discounts', async (req, res) => {
        try {
            const query = `
                SELECT gid, gde_desc1, gde_desc2, gde_desc3, gde_desc4, gde_desc5, gde_desc6, gde_desc7, gde_desc8, gde_desc9
                FROM grupo_desc
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CLI_DISCOUNTS] Error listing group discounts:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - List discounts for a specific client
    router.get('/clients/:id/discounts', async (req, res) => {
        try {
            const { id } = req.params;

            // Log for debugging (will show up in server console)
            console.log(`[GET_DISCOUNTS] Requested ID: "${id}"`);

            const query = `
                SELECT 
                    d.*, 
                    COALESCE(f_tenant.for_nomered, f_public.for_nomered, 'Cod: ' || d.cli_forcodigo) as industria_nome,
                    COALESCE(g.gru_nome, 'Grupo: ' || d.cli_grupo) as grupo_nome
                FROM cli_descpro d
                LEFT JOIN fornecedores f_tenant ON TRIM(d.cli_forcodigo::text) = TRIM(f_tenant.for_codigo::text)
                LEFT JOIN public.fornecedores f_public ON TRIM(d.cli_forcodigo::text) = TRIM(f_public.for_codigo::text)
                LEFT JOIN grupos g ON TRIM(d.cli_grupo::text) = TRIM(g.gru_codigo::text)
                WHERE TRIM(d.cli_codigo::text) = TRIM($1::text) OR d.cli_codigo::text::int = $1::text::int
                ORDER BY industria_nome, grupo_nome
            `;
            const result = await pool.query(query, [id]);

            console.log(`[GET_DISCOUNTS] Found ${result.rows.length} rows for client ${id}`);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CLI_DISCOUNTS] Error listing discounts:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Add or Update a discount
    router.post('/clients/:id/discounts', async (req, res) => {
        try {
            const { id } = req.params;
            const {
                cli_forcodigo, cli_grupo,
                cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                cli_desc6, cli_desc7, cli_desc8, cli_desc9
            } = req.body;

            const query = `
                INSERT INTO cli_descpro (
                    cli_codigo, cli_forcodigo, cli_grupo,
                    cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                    cli_desc6, cli_desc7, cli_desc8, cli_desc9
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (cli_codigo, cli_forcodigo, cli_grupo) DO UPDATE SET
                    cli_desc1 = EXCLUDED.cli_desc1,
                    cli_desc2 = EXCLUDED.cli_desc2,
                    cli_desc3 = EXCLUDED.cli_desc3,
                    cli_desc4 = EXCLUDED.cli_desc4,
                    cli_desc5 = EXCLUDED.cli_desc5,
                    cli_desc6 = EXCLUDED.cli_desc6,
                    cli_desc7 = EXCLUDED.cli_desc7,
                    cli_desc8 = EXCLUDED.cli_desc8,
                    cli_desc9 = EXCLUDED.cli_desc9
                RETURNING *
            `;

            const values = [
                id, cli_forcodigo, cli_grupo,
                cli_desc1 || 0, cli_desc2 || 0, cli_desc3 || 0, cli_desc4 || 0, cli_desc5 || 0,
                cli_desc6 || 0, cli_desc7 || 0, cli_desc8 || 0, cli_desc9 || 0
            ];

            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CLI_DISCOUNTS] Error saving discount:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Remove a discount
    router.delete('/clients/:id/discounts/:industryId/:groupId', async (req, res) => {
        try {
            const { id, industryId, groupId } = req.params;
            const query = `
                DELETE FROM cli_descpro 
                WHERE TRIM(cli_codigo::text) = TRIM($1::text) 
                AND TRIM(cli_forcodigo::text) = TRIM($2::text) 
                AND TRIM(cli_grupo::text) = TRIM($3::text)
            `;
            await pool.query(query, [id, industryId, groupId]);
            res.json({ success: true, message: 'Desconto excluído com sucesso' });
        } catch (error) {
            console.error('❌ [CLI_DISCOUNTS] Error deleting discount:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
