// ==================== SUPPLIERS (FORNECEDORES) ENDPOINTS ====================
const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all suppliers
    router.get('/', async (req, res) => {
        try {
            const query = `
                SELECT 
                    for_codigo as id,
                    for_cnpj as cnpj,
                    for_inscricao as inscricao,
                    for_razao as "razaoSocial",
                    for_nomered as nome,
                    for_nomered as "nomeReduzido",
                    for_situacao as situacao,
                    for_endereco as endereco,
                    for_bairro as bairro,
                    for_cidade as cidade,
                    for_uf as uf,
                    for_cep as cep,
                    for_telefone as telefone,
                    for_email as email,
                    for_obs2 as obs2
                FROM fornecedores
                ORDER BY for_nomered
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // ===== SPECIFIC ROUTES MUST COME BEFORE GENERIC /:id ROUTE =====

    // GET supplier contacts
    router.get('/:id/contacts', async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    con_codigo,
                    con_nome,
                    con_cargo,
                    con_telefone,
                    con_celular,
                    con_email,
                    con_dtnasc
                FROM contato_for
                WHERE con_fornecedor = $1
                ORDER BY con_nome
            `;
            const result = await pool.query(query, [id]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching supplier contacts:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // GET customers who have purchased from a specific supplier
    router.get('/:id/customers', async (req, res) => {
        console.log('🔍 CUSTOMERS ROUTE CALLED - ID:', req.params.id);
        try {
            const supplierId = req.params.id;

            const query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_nomred,
                    MAX(p.ped_data) as ultima_compra,
                    SUM(p.ped_totliq) as total_compras,
                    COUNT(p.ped_pedido) as qtd_pedidos
                FROM clientes c
                INNER JOIN pedidos p ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_industria = $1
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY c.cli_codigo, c.cli_nomred
                ORDER BY total_compras DESC
            `;

            const result = await pool.query(query, [supplierId]);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching supplier customers:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // GET supplier goals for a specific year
    router.get('/:id/goals/:year', async (req, res) => {
        try {
            const { id, year } = req.params;
            const query = `
                SELECT 
                    met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                    met_jul, met_ago, met_set, met_out, met_nov, met_dez
                FROM ind_metas
                WHERE met_industria = $1 AND met_ano = $2
            `;
            const result = await pool.query(query, [id, year]);

            if (result.rows.length === 0) {
                // Return empty goals if not found
                return res.json({
                    success: true,
                    data: {
                        met_jan: 0, met_fev: 0, met_mar: 0, met_abr: 0,
                        met_mai: 0, met_jun: 0, met_jul: 0, met_ago: 0,
                        met_set: 0, met_out: 0, met_nov: 0, met_dez: 0
                    }
                });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error fetching supplier goals:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== GENERIC /:id ROUTE MUST COME AFTER ALL SPECIFIC ROUTES =====

    // GET single supplier by ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    for_codigo as id,
                    for_cnpj as cnpj,
                    for_inscricao as inscricao,
                    for_razao as "razaoSocial",
                    for_nomered as nome,
                    for_nomered as "nomeReduzido",
                    for_situacao as situacao,
                    for_endereco as endereco,
                    for_bairro as bairro,
                    for_cidade as cidade,
                    for_uf as uf,
                    for_cep as cep,
                    for_telefone as telefone,
                    for_email as email,
                    for_obs2 as obs2
                FROM fornecedores
                WHERE for_codigo = $1
            `;
            const result = await pool.query(query, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching supplier:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // POST new supplier contact
    router.post('/:id/contacts', async (req, res) => {
        try {
            const { id } = req.params;
            const { con_nome, con_cargo, con_telefone, con_celular, con_email, con_dtnasc } = req.body;

            const query = `
                INSERT INTO contato_for (
                    con_fornecedor, con_nome, con_cargo, con_telefone, 
                    con_celular, con_email, con_dtnasc
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await pool.query(query, [
                id, con_nome, con_cargo, con_telefone,
                con_celular, con_email, con_dtnasc
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating supplier contact:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // DELETE supplier contact
    router.delete('/:id/contacts/:contactId', async (req, res) => {
        try {
            const { id, contactId } = req.params;
            const query = `
                DELETE FROM contato_for
                WHERE con_codigo = $1 AND con_fornecedor = $2
                RETURNING *
            `;
            const result = await pool.query(query, [contactId, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Contact not found' });
            }

            res.json({ success: true, message: 'Contact deleted successfully' });
        } catch (error) {
            console.error('Error deleting supplier contact:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // PUT update supplier goals
    router.put('/:id/goals/:year', async (req, res) => {
        try {
            const { id, year } = req.params;
            const goals = req.body;

            // Check if record exists
            const checkQuery = `SELECT * FROM ind_metas WHERE met_industria = $1 AND met_ano = $2`;
            const checkResult = await pool.query(checkQuery, [id, year]);

            let query, values;
            if (checkResult.rows.length === 0) {
                // INSERT
                query = `
                    INSERT INTO ind_metas (
                        met_industria, met_ano,
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_jul, met_ago, met_set, met_out, met_nov, met_dez
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;
                values = [
                    id, year,
                    goals.met_jan || 0, goals.met_fev || 0, goals.met_mar || 0,
                    goals.met_abr || 0, goals.met_mai || 0, goals.met_jun || 0,
                    goals.met_jul || 0, goals.met_ago || 0, goals.met_set || 0,
                    goals.met_out || 0, goals.met_nov || 0, goals.met_dez || 0
                ];
            } else {
                // UPDATE
                query = `
                    UPDATE ind_metas SET
                        met_jan = $3, met_fev = $4, met_mar = $5, met_abr = $6,
                        met_mai = $7, met_jun = $8, met_jul = $9, met_ago = $10,
                        met_set = $11, met_out = $12, met_nov = $13, met_dez = $14
                    WHERE met_industria = $1 AND met_ano = $2
                    RETURNING *
                `;
                values = [
                    id, year,
                    goals.met_jan || 0, goals.met_fev || 0, goals.met_mar || 0,
                    goals.met_abr || 0, goals.met_mai || 0, goals.met_jun || 0,
                    goals.met_jul || 0, goals.met_ago || 0, goals.met_set || 0,
                    goals.met_out || 0, goals.met_nov || 0, goals.met_dez || 0
                ];
            }

            const result = await pool.query(query, values);
            res.json({ success: true, message: 'Goals saved successfully', data: result.rows[0] });
        } catch (error) {
            console.error('Error saving supplier goals:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
