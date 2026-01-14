const express = require('express');
const router = express.Router();

module.exports = function (pool) {
    // ============== GRUPOS ==============

    router.get('/groups', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM user_grupos ORDER BY descricao');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao buscar grupos' });
        }
    });

    router.post('/groups', async (req, res) => {
        try {
            const { grupo, descricao } = req.body;
            if (!grupo || !descricao) return res.status(400).json({ success: false, message: 'Código e Descrição obrigatórios' });
            const result = await pool.query('INSERT INTO user_grupos (grupo, descricao) VALUES ($1, $2) RETURNING *', [grupo.substring(0, 4), descricao.substring(0, 20)]);
            res.json({ success: true, data: result.rows[0], message: 'Grupo criado!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao criar grupo' });
        }
    });

    router.put('/groups/:id', async (req, res) => {
        try {
            const { descricao } = req.body;
            const result = await pool.query('UPDATE user_grupos SET descricao = $1 WHERE grupo = $2 RETURNING *', [descricao.substring(0, 20), req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            res.json({ success: true, data: result.rows[0], message: 'Grupo atualizado!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao atualizar grupo' });
        }
    });

    router.delete('/groups/:id', async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM user_grupos WHERE grupo = $1 RETURNING *', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            res.json({ success: true, message: 'Grupo excluído!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao excluir grupo' });
        }
    });

    // ============== PERMISSÕES ==============

    const DEFAULT_MENUS = [
        { idx: 10, label: 'ACADÊMICO', isParent: true },
        { idx: 101, label: 'Alunos' },
        { idx: 102, label: 'Turmas' },
        { idx: 103, label: 'Professores' },
        { idx: 104, label: 'Disciplinas' },
        { idx: 20, label: 'AVALIAÇÕES', isParent: true },
        { idx: 201, label: 'Notas' },
        { idx: 202, label: 'Frequência' },
        { idx: 203, label: 'Boletins' },
        { idx: 30, label: 'FINANCEIRO', isParent: true },
        { idx: 301, label: 'Mensalidades' },
        { idx: 302, label: 'Boletos' },
        { idx: 303, label: 'Inadimplência' },
        { idx: 60, label: 'CONFIGURAÇÕES', isParent: true },
        { idx: 601, label: 'Usuários' },
        { idx: 602, label: 'Parâmetros' },
    ];

    router.get('/groups/:groupId/permissions', async (req, res) => {
        try {
            const { groupId } = req.params;
            let query = `SELECT opcao, grupo, indice, porsenha, invisivel, incluir, modificar, excluir, descricao FROM user_menu_superior WHERE grupo = $1 ORDER BY indice`;
            let result = await pool.query(query, [groupId]);

            // Auto-Seed se não houver permissões
            if (result.rows.length === 0) {
                console.log(`🌱 [SEED] Criando permissões para grupo: ${groupId}`);
                for (const menu of DEFAULT_MENUS) {
                    await pool.query(`
                        INSERT INTO user_menu_superior (grupo, indice, descricao, opcao, invisivel, incluir, modificar, excluir, porsenha)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [groupId, menu.idx, menu.label.toUpperCase(), menu.idx, false, true, true, true, false]);
                }
                result = await pool.query(query, [groupId]);
            }

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao buscar permissões' });
        }
    });

    router.put('/groups/:groupId/permissions', async (req, res) => {
        const client = await pool.connect();
        try {
            const { permissions } = req.body;
            await client.query('BEGIN');
            for (const perm of permissions) {
                await client.query(`
                    UPDATE user_menu_superior SET invisivel = $1, incluir = $2, modificar = $3, excluir = $4
                    WHERE grupo = $5 AND indice = $6
                `, [perm.invisivel, perm.incluir, perm.modificar, perm.excluir, req.params.groupId, perm.indice]);
            }
            await client.query('COMMIT');
            res.json({ success: true, message: 'Permissões atualizadas!' });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(500).json({ success: false, message: 'Erro ao salvar permissões' });
        } finally {
            client.release();
        }
    });

    // ============== USUÁRIOS ==============

    router.get('/users', async (req, res) => {
        try {
            const result = await pool.query(`SELECT codigo, nome, sobrenome, usuario, grupo, master, gerencia, ativo FROM user_nomes ORDER BY nome`);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
        }
    });

    router.post('/users', async (req, res) => {
        try {
            const { codigo, nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo } = req.body;
            if (codigo) {
                const params = [nome, sobrenome, usuario, grupo, master, gerencia, ativo];
                let query = `UPDATE user_nomes SET nome = $1, sobrenome = $2, usuario = $3, grupo = $4, master = $5, gerencia = $6, ativo = $7`;
                if (senha) { query += `, senha = $8 WHERE codigo = $9`; params.push(senha, codigo); }
                else { query += ` WHERE codigo = $8`; params.push(codigo); }
                const result = await pool.query(query + ' RETURNING *', params);
                return res.json({ success: true, data: result.rows[0], message: 'Usuário atualizado!' });
            } else {
                const result = await pool.query(`
                    INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
                `, [nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo]);
                return res.json({ success: true, data: result.rows[0], message: 'Usuário criado!' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Erro ao salvar usuário' });
        }
    });

    router.delete('/users/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM user_nomes WHERE codigo = $1', [req.params.id]);
            res.json({ success: true, message: 'Usuário excluído!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao excluir usuário' });
        }
    });

    // ============== MINHAS PERMISSÕES ==============

    router.get('/my-permissions', async (req, res) => {
        try {
            const userId = req.query.userId;
            if (!userId) return res.status(400).json({ success: false, message: 'ID do usuário não fornecido' });

            const userResult = await pool.query('SELECT grupo, master, gerencia FROM user_nomes WHERE codigo = $1', [userId]);
            if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

            const user = userResult.rows[0];
            if (user.master) return res.json({ success: true, master: true, isGerencia: true });

            const permResult = await pool.query(`SELECT indice, invisivel, incluir, modificar, excluir FROM user_menu_superior WHERE grupo = $1`, [user.grupo]);
            res.json({ success: true, master: false, isGerencia: user.gerencia || false, permissions: permResult.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao buscar permissões' });
        }
    });

    return router;
};
