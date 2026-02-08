const express = require('express');
const { analisarClienteIA } = require('./openai-clients');

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

    // GET single client by ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_nome,
                    c.cli_fantasia,
                    c.cli_nomred,
                    c.cli_cnpj,
                    c.cli_inscricao,
                    c.cli_endereco,
                    c.cli_endnum as cli_numero, -- Alias for frontend compatibility
                    c.cli_bairro,
                    c.cli_cep,
                    c.cli_idcidade,
                    c.cli_cidade,
                    c.cli_uf,
                    c.cli_fone1,
                    c.cli_fone2,
                    c.cli_email,
                    c.cli_emailnfe,
                    c.cli_emailfinanc, -- Updated column name
                    c.cli_vendedor as cli_vendedor_id, -- Alias for frontend
                    c.cli_regiao2 as cli_regiao_id, -- Alias for frontend (using correct DB column)
                    c.cli_atuacaoprincipal,
                    c.cli_obspedido,
                    c.cli_suframa,
                    c.cli_latitude,
                    c.cli_longitude,
                    c.cli_tipopes,
                    c.cli_redeloja,
                    c.cli_dtabertura,
                    c.cli_datacad
                FROM clientes c
                WHERE c.cli_codigo = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching client details:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar detalhes do cliente.' });
        }
    });

    // POST - Create Client
    router.post('/', async (req, res) => {
        try {
            console.log('POST /clients - Body:', req.body);
            const data = req.body;

            const query = `
                INSERT INTO clientes (
                    cli_nome, cli_fantasia, cli_nomred, cli_cnpj, cli_inscricao,
                    cli_endereco, cli_endnum, cli_bairro, cli_cep,
                    cli_idcidade, cli_cidade, cli_uf,
                    cli_fone1, cli_fone2, cli_email, cli_emailnfe, cli_emailfinanc,
                    cli_vendedor, cli_regiao2, cli_atuacaoprincipal,
                    cli_obspedido, cli_suframa,
                    cli_latitude, cli_longitude,
                    cli_tipopes, cli_redeloja, cli_dtabertura, cli_datacad
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    $10, $11, $12,
                    $13, $14, $15, $16, $17,
                    $18, $19, $20,
                    $21, $22,
                    $23, $24,
                    $25, $26, $27, $28
                ) RETURNING cli_codigo
            `;

            const params = [
                data.cli_nome,
                data.cli_fantasia,
                data.cli_nomred,
                data.cli_cnpj,
                data.cli_inscricao,
                data.cli_endereco,
                data.cli_numero || data.cli_endnum, // Map frontend 'cli_numero' to DB 'cli_endnum'
                data.cli_bairro,
                data.cli_cep,
                data.cli_idcidade || null,
                data.cli_cidade,
                data.cli_uf,
                data.cli_fone1,
                data.cli_fone2,
                data.cli_email,
                data.cli_emailnfe,
                data.cli_emailfinanc, // Corrected column name
                data.cli_vendedor_id || data.cli_vendedor || null,
                data.cli_regiao_id || data.cli_regiao || null,
                data.cli_atuacaoprincipal || null,
                data.cli_obspedido,
                data.cli_suframa,
                (data.cli_latitude && !isNaN(data.cli_latitude)) ? parseFloat(data.cli_latitude) : null,
                (data.cli_longitude && !isNaN(data.cli_longitude)) ? parseFloat(data.cli_longitude) : null,
                data.cli_tipopes || 'A',
                data.cli_redeloja,
                data.cli_dtabertura || null,
                data.cli_datacad || new Date()
            ];

            const result = await pool.query(query, params);
            res.json({ success: true, message: 'Cliente cadastrado com sucesso!', id: result.rows[0].cli_codigo });

        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ success: false, message: 'Erro ao criar cliente: ' + error.message });
        }
    });

    // PUT - Update Client
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            console.log(`PUT /clients/${id} - Data received:`, {
                nome: data.cli_nome,
                lat: data.cli_latitude,
                lng: data.cli_longitude
            });

            // DEBUG: Check DB Connetion Context
            const debugDb = await pool.query("SELECT current_database(), current_schema(), current_user, version()");
            const searchPath = await pool.query("SHOW search_path");
            console.log("🔍 [DB CONTEXT CHECK] PUT /clients");
            console.log("   -> Database:", debugDb.rows[0].current_database);
            console.log("   -> Schema (Current):", debugDb.rows[0].current_schema);
            console.log("   -> User:", debugDb.rows[0].current_user);
            console.log("   -> Search Path:", searchPath.rows[0].search_path);


            const query = `
                UPDATE clientes SET
                    cli_nome = $1,
                    cli_fantasia = $2,
                    cli_nomred = $3,
                    cli_cnpj = $4,
                    cli_inscricao = $5,
                    cli_endereco = $6,
                    cli_endnum = $7,
                    cli_bairro = $8,
                    cli_cep = $9,
                    cli_idcidade = $10,
                    cli_cidade = $11,
                    cli_uf = $12,
                    cli_fone1 = $13,
                    cli_fone2 = $14,
                    cli_email = $15,
                    cli_emailnfe = $16,
                    cli_emailfinanc = $17,
                    cli_vendedor = $18,
                    cli_regiao2 = $19,
                    cli_atuacaoprincipal = $20,
                    cli_obspedido = $21,
                    cli_suframa = $22,
                    cli_latitude = $23,
                    cli_longitude = $24,
                    cli_tipopes = $25,
                    cli_redeloja = $26,
                    cli_dtabertura = $27
                WHERE cli_codigo = $28
            `;

            const params = [
                data.cli_nome,
                data.cli_fantasia,
                data.cli_nomred,
                data.cli_cnpj,
                data.cli_inscricao,
                data.cli_endereco,
                data.cli_numero || data.cli_endnum, // Map frontend 'cli_numero' to DB 'cli_endnum'
                data.cli_bairro,
                data.cli_cep,
                data.cli_idcidade || null, // Integer
                data.cli_cidade,
                data.cli_uf,
                data.cli_fone1,
                data.cli_fone2,
                data.cli_email,
                data.cli_emailnfe,
                data.cli_emailfinanc, // Corrected column name
                data.cli_vendedor_id || data.cli_vendedor || null, // Integer
                data.cli_regiao_id || data.cli_regiao || null, // Integer
                data.cli_atuacaoprincipal || null, // Integer
                data.cli_obspedido,
                data.cli_suframa,
                (data.cli_latitude && !isNaN(data.cli_latitude)) ? parseFloat(data.cli_latitude) : null, // Numeric check
                (data.cli_longitude && !isNaN(data.cli_longitude)) ? parseFloat(data.cli_longitude) : null, // Numeric check
                data.cli_tipopes,
                data.cli_redeloja,
                data.cli_dtabertura || null,
                id
            ];

            const result = await pool.query(query, params);
            console.log("✅ Update Result RowCount:", result.rowCount);

            if (result.rowCount === 0) {
                console.warn(`⚠️ Warning: No rows updated for Client ID ${id}. It might not exist in this schema.`);
            }

            res.json({ success: true, message: 'Cliente atualizado com sucesso!' });
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar: ' + error.message });
        }
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

    // IA Insights for Client Profile
    router.get('/:id/insights', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await analisarClienteIA(id, pool);
            res.json(result);
        } catch (error) {
            console.error('Error generating client IA insights:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar inteligência do cliente.',
                error: error.message
            });
        }
    });

    return router;
};
