const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool, tenantPools } = require('./utils/db');

// ============================================================
// PAINEL MASTER - Apenas para Administradores (Hamilton)
// ============================================================

// Middleware para verificar se é admin master (Hamilton exclusivamente)
const checkMasterAdmin = (req, res, next) => {
    const userRole = req.headers['x-user-role'];

    // Apenas Hamilton (superadmin) tem acesso ao Painel Master
    if (userRole !== 'superadmin') {
        console.warn(`🚫 [MASTER] Tentativa de acesso negado. Role: ${userRole}`);
        return res.status(403).json({
            success: false,
            message: 'Acesso restrito. Apenas o administrador Hamilton pode acessar o Painel Master.'
        });
    }
    next();
};

// GET /api/master/empresas - Lista todas as empresas do Master
router.get('/empresas', checkMasterAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                id, cnpj, razao_social, nome_fantasia,
                status, data_vencimento, valor_mensalidade,
                limite_usuarios, db_host, db_nome, db_porta,
                data_adesao, email_contato, telefone
            FROM empresas
            ORDER BY razao_social
        `;
        const result = await masterPool.query(query);

        // Calcular métricas
        const empresas = result.rows;
        const metricas = {
            total: empresas.length,
            ativas: empresas.filter(e => e.status === 'ATIVO').length,
            bloqueadas: empresas.filter(e => e.status === 'BLOQUEADO').length,
            inadimplentes: empresas.filter(e => e.status === 'INADIMPLENTE').length,
            degustacao: empresas.filter(e => e.status === 'DEGUSTAÇÃO').length
        };

        res.json({ success: true, data: empresas, metricas });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao listar empresas:', error);
        res.status(500).json({ success: false, message: 'Erro ao listar empresas.' });
    }
});

// GET /api/master/empresas/:id - Detalhes de uma empresa
router.get('/empresas/:id', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM empresas WHERE id = $1';
        const result = await masterPool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao buscar empresa:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar empresa.' });
    }
});

// GET /api/master/buscar-cnpj/:cnpj - Buscar dados de CNPJ (ReceitaWS ou banco local)
router.get('/buscar-cnpj/:cnpj', checkMasterAdmin, async (req, res) => {
    try {
        const { cnpj } = req.params;
        const cnpjLimpo = cnpj.replace(/\D/g, '');

        // Primeiro verifica se já existe no banco
        const existing = await masterPool.query('SELECT * FROM empresas WHERE cnpj = $1', [cnpjLimpo]);
        if (existing.rows.length > 0) {
            return res.json({
                success: true,
                source: 'database',
                exists: true,
                data: existing.rows[0],
                message: 'CNPJ já cadastrado no sistema.'
            });
        }

        // Tenta buscar na ReceitaWS (API gratuita)
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
            const data = await response.json();

            if (data.status === 'OK') {
                return res.json({
                    success: true,
                    source: 'receitaws',
                    exists: false,
                    data: {
                        cnpj: cnpjLimpo,
                        razao_social: data.nome,
                        nome_fantasia: data.fantasia,
                        email_contato: data.email,
                        telefone: data.telefone,
                        endereco: `${data.logradouro}, ${data.numero} - ${data.bairro}`,
                        cidade: data.municipio,
                        uf: data.uf
                    }
                });
            }
        } catch (apiError) {
            console.log('⚠️ ReceitaWS não disponível:', apiError.message);
        }

        // Se não encontrou em nenhum lugar
        res.json({ success: true, exists: false, data: { cnpj: cnpjLimpo } });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao buscar CNPJ:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar CNPJ.' });
    }
});

// POST /api/master/empresas - Criar nova empresa
router.post('/empresas', checkMasterAdmin, async (req, res) => {
    try {
        const {
            cnpj, razao_social, nome_fantasia, email_contato, telefone,
            status, data_vencimento, valor_mensalidade, limite_usuarios,
            db_host, db_nome, db_usuario, db_senha, db_porta
        } = req.body;

        // Remove máscara do CNPJ
        const cnpjLimpo = cnpj.replace(/\D/g, '');

        const query = `
            INSERT INTO empresas (
                cnpj, razao_social, nome_fantasia, email_contato, telefone,
                status, data_vencimento, valor_mensalidade, limite_usuarios,
                db_host, db_nome, db_usuario, db_senha, db_porta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            cnpjLimpo, razao_social, nome_fantasia, email_contato, telefone,
            status || 'ATIVO', data_vencimento, valor_mensalidade, limite_usuarios || 1,
            db_host, db_nome, db_usuario, db_senha, db_porta || 5432
        ];

        const result = await masterPool.query(query, values);
        res.json({ success: true, message: 'Empresa criada com sucesso!', data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao criar empresa:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao criar empresa.' });
    }
});

// PUT /api/master/empresas/:id - Atualizar empresa
router.put('/empresas/:id', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            razao_social, nome_fantasia, email_contato, telefone,
            status, data_vencimento, valor_mensalidade, limite_usuarios,
            db_host, db_nome, db_usuario, db_senha, db_porta
        } = req.body;

        const emptyToNull = (val) => (val === '' || val === undefined) ? null : val;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (razao_social) { updates.push(`razao_social = $${paramCount++}`); values.push(razao_social); }
        if (nome_fantasia !== undefined) { updates.push(`nome_fantasia = $${paramCount++}`); values.push(emptyToNull(nome_fantasia)); }
        if (email_contato !== undefined) { updates.push(`email_contato = $${paramCount++}`); values.push(emptyToNull(email_contato)); }
        if (telefone !== undefined) { updates.push(`telefone = $${paramCount++}`); values.push(emptyToNull(telefone)); }
        if (status) { updates.push(`status = $${paramCount++}`); values.push(status); }
        if (data_vencimento) { updates.push(`data_vencimento = $${paramCount++}`); values.push(data_vencimento); }
        if (valor_mensalidade && valor_mensalidade !== '') {
            updates.push(`valor_mensalidade = $${paramCount++}`);
            values.push(parseFloat(valor_mensalidade) || null);
        }
        if (limite_usuarios && limite_usuarios !== '') {
            updates.push(`limite_usuarios = $${paramCount++}`);
            values.push(parseInt(limite_usuarios) || 1);
        }
        if (db_host) { updates.push(`db_host = $${paramCount++}`); values.push(db_host); }
        if (db_nome) { updates.push(`db_nome = $${paramCount++}`); values.push(db_nome); }
        if (db_usuario) { updates.push(`db_usuario = $${paramCount++}`); values.push(db_usuario); }
        if (db_senha) { updates.push(`db_senha = $${paramCount++}`); values.push(db_senha); }
        if (db_porta) { updates.push(`db_porta = $${paramCount++}`); values.push(db_porta); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo para atualizar.' });
        }

        values.push(id);
        const query = `UPDATE empresas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await masterPool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada.' });
        }

        res.json({ success: true, message: 'Empresa atualizada com sucesso!', data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao atualizar empresa:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar empresa: ' + error.message });
    }
});

// PATCH /api/master/empresas/:id/status - Alterar apenas o status (Bloquear/Desbloquear)
router.patch('/empresas/:id/status', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ATIVO', 'BLOQUEADO', 'INADIMPLENTE', 'DEGUSTAÇÃO'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status inválido.' });
        }

        const query = 'UPDATE empresas SET status = $1 WHERE id = $2 RETURNING cnpj, razao_social, status';
        const result = await masterPool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada.' });
        }

        res.json({ success: true, message: `Status alterado para ${status}`, data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao alterar status:', error);
        res.status(500).json({ success: false, message: 'Erro ao alterar status.' });
    }
});

// DELETE /api/master/empresas/:id - Excluir empresa
router.delete('/empresas/:id', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM empresas WHERE id = $1 RETURNING cnpj, razao_social';
        const result = await masterPool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada.' });
        }

        res.json({ success: true, message: 'Empresa excluída com sucesso!', data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao excluir empresa:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir empresa.' });
    }
});

// POST /api/master/test-connection - Testar conexão
router.post('/test-connection', checkMasterAdmin, async (req, res) => {
    const { Pool } = require('pg');
    let testPool = null;
    try {
        const { db_host, db_nome, db_usuario, db_senha, db_porta } = req.body;
        if (!db_host || !db_nome || !db_usuario) {
            return res.status(400).json({ success: false, message: 'Dados de conexão incompletos.' });
        }
        testPool = new Pool({
            host: db_host,
            port: db_porta || 5432,
            database: db_nome,
            user: db_usuario,
            password: db_senha,
            connectionTimeoutMillis: 5000
        });
        await testPool.query('SELECT 1');
        res.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao testar conexão:', error);
        res.status(500).json({ success: false, message: 'Falha na conexão: ' + error.message });
    } finally {
        if (testPool) await testPool.end();
    }
});

// POST /api/master/switch-tenant - Alternar para outro schema/empresa
router.post('/switch-tenant', checkMasterAdmin, async (req, res) => {
    try {
        const { empresa_id } = req.body;
        const query = 'SELECT * FROM empresas WHERE id = $1';
        const result = await masterPool.query(query, [empresa_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada.' });
        }

        const empresa = result.rows[0];
        const dbConfig = {
            host: empresa.db_host,
            database: empresa.db_nome,
            user: empresa.db_usuario,
            password: empresa.db_senha || '',
            port: empresa.db_porta || 5432
        };

        getTenantPool(empresa.cnpj, dbConfig);
        res.json({
            success: true,
            message: `Conectado a: ${empresa.razao_social}`,
            tenantConfig: { cnpj: empresa.cnpj, dbConfig },
            empresa: { id: empresa.id, cnpj: empresa.cnpj, razao_social: empresa.razao_social, status: empresa.status }
        });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao alternar tenant:', error);
        res.status(500).json({ success: false, message: 'Erro ao alternar empresa.' });
    }
});

// ============================================================
// GESTÃO DE USUÁRIOS (MASTER DB)
// ============================================================

// GET /api/master/empresas/:id/usuarios - Lista usuários
router.get('/empresas/:id/usuarios', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await masterPool.query(`
            SELECT id, nome, sobrenome, email, e_admin, ativo, data_criacao
            FROM usuarios 
            WHERE empresa_id = $1
            ORDER BY nome
        `, [id]);

        const normalizedData = result.rows.map(u => ({
            codigo: u.id,
            nome: u.nome,
            sobrenome: u.sobrenome,
            usuario: u.email,
            master: u.e_admin,
            ativo: u.ativo
        }));

        res.json({ success: true, data: normalizedData });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao listar usuários no Master:', error);
        res.status(500).json({ success: false, message: 'Erro ao listar usuários: ' + error.message });
    }
});

// POST /api/master/empresas/:id/usuarios - Criar novo usuário
router.post('/empresas/:id/usuarios', checkMasterAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, sobrenome, senha, email, master, ativo } = req.body;
        if (!nome || !email) return res.status(400).json({ success: false, message: 'Nome e Email são obrigatórios.' });

        const result = await masterPool.query(`
            INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, nome, email
        `, [id, nome, sobrenome, email, senha || '123456', master || false, ativo !== undefined ? ativo : true]);

        res.json({ success: true, message: 'Usuário criado no Master!', data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao criar usuário no Master:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar usuário: ' + error.message });
    }
});

// PUT /api/master/empresas/:id/usuarios/:codigo - Editar usuário
router.put('/empresas/:id/usuarios/:codigo', checkMasterAdmin, async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nome, sobrenome, senha, email, master, ativo } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nome) { updates.push(`nome = $${paramCount++}`); values.push(nome); }
        if (sobrenome) { updates.push(`sobrenome = $${paramCount++}`); values.push(sobrenome); }
        if (senha) { updates.push(`senha = $${paramCount++}`); values.push(senha); }
        if (email) { updates.push(`email = $${paramCount++}`); values.push(email); }
        if (master !== undefined) { updates.push(`e_admin = $${paramCount++}`); values.push(master); }
        if (ativo !== undefined) { updates.push(`ativo = $${paramCount++}`); values.push(ativo); }

        if (updates.length === 0) return res.status(400).json({ success: false, message: 'Nenhum campo para atualizar.' });

        values.push(codigo);
        const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, nome, email`;
        const result = await masterPool.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        res.json({ success: true, message: 'Usuário atualizado no Master!', data: result.rows[0] });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao editar usuário no Master:', error);
        res.status(500).json({ success: false, message: 'Erro ao editar usuário: ' + error.message });
    }
});

// DELETE /api/master/empresas/:id/usuarios/:codigo - Excluir usuário
router.delete('/empresas/:id/usuarios/:codigo', checkMasterAdmin, async (req, res) => {
    try {
        const { codigo } = req.params;
        const result = await masterPool.query('DELETE FROM usuarios WHERE id = $1 RETURNING nome', [codigo]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        res.json({ success: true, message: `Usuário excluído do Master!` });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao excluir usuário no Master:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir usuário: ' + error.message });
    }
});

// PATCH /api/master/empresas/:id/usuarios/:codigo/reset-senha - Reset de senha
router.patch('/empresas/:id/usuarios/:codigo/reset-senha', checkMasterAdmin, async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nova_senha } = req.body;
        const result = await masterPool.query('UPDATE usuarios SET senha = $1 WHERE id = $2 RETURNING nome', [nova_senha || '123456', codigo]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        res.json({ success: true, message: `Senha de ${result.rows[0].nome} resetada no Master!` });
    } catch (error) {
        console.error('❌ [MASTER] Erro ao resetar senha no Master:', error);
        res.status(500).json({ success: false, message: 'Erro ao resetar senha: ' + error.message });
    }
});

module.exports = router;
