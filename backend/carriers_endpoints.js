// --- CARRIERS (TRANSPORTADORAS) (V2) ---
// Adicionar estas linhas ANTES de "// Test Firebird Connection" (linha 522)

// GET - List all carriers
app.get('/api/v2/carriers', async (req, res) => {
    try {
        const query = 'SELECT * FROM transportadora ORDER BY tra_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get carrier by ID
app.get('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM transportadora WHERE tra_codigo = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Fetch carrier data from CNPJ (ReceitaWS)
app.get('/api/v2/carriers/cnpj/:cnpj', async (req, res) => {
    try {
        const { cnpj } = req.params;
        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
        const data = await response.json();

        if (data.status === 'ERROR') {
            return res.status(404).json({ success: false, message: data.message || 'CNPJ não encontrado' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new carrier
app.post('/api/v2/carriers', async (req, res) => {
    try {
        const {
            tra_nome, tra_cnpj, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_cgc, tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists
        if (tra_cnpj) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cnpj = $1';
            const checkResult = await pool.query(checkQuery, [tra_cnpj]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
            }
        }

        const query = `
            INSERT INTO transportadora (
                tra_nome, tra_cnpj, tra_endereco, tra_bairro, tra_cidade,
                tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
                tra_cgc, tra_inscricao, tra_obs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cnpj, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_cgc, tra_inscricao, tra_obs
        ]);

        res.json({ success: true, message: 'Transportadora criada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update carrier
app.put('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tra_nome, tra_cnpj, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_cgc, tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists for another carrier
        if (tra_cnpj) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cnpj = $1 AND tra_codigo != $2';
            const checkResult = await pool.query(checkQuery, [tra_cnpj, id]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado para outra transportadora' });
            }
        }

        const query = `
            UPDATE transportadora SET
                tra_nome = $1, tra_cnpj = $2, tra_endereco = $3, tra_bairro = $4,
                tra_cidade = $5, tra_uf = $6, tra_cep = $7, tra_fone = $8,
                tra_contato = $9, tra_email = $10, tra_cgc = $11,
                tra_inscricao = $12, tra_obs = $13
            WHERE tra_codigo = $14
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cnpj, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_cgc, tra_inscricao, tra_obs, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora atualizada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete carrier
app.delete('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transportadora WHERE tra_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora excluída!' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Transportadora em uso, não pode ser excluída' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});
