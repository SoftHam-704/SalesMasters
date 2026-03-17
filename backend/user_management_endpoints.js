const express = require('express');
const router = express.Router();

module.exports = function (pool) {
    // --- GRUPOS DE USUÁRIOS ---

    // Listar todos os grupos
    router.get('/groups', async (req, res) => {
        try {
            const query = 'SELECT * FROM user_grupos ORDER BY descricao';
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar grupos' });
        }
    });

    // Criar novo grupo
    router.post('/groups', async (req, res) => {
        try {
            const { grupo, descricao } = req.body;
            if (!grupo || !descricao) {
                return res.status(400).json({ success: false, message: 'Código e Descrição são obrigatórios' });
            }

            const query = 'INSERT INTO user_grupos (grupo, descricao) VALUES ($1, $2) RETURNING *';
            const result = await pool.query(query, [grupo.substring(0, 4), descricao.substring(0, 20)]);
            res.json({ success: true, data: result.rows[0], message: 'Grupo criado com sucesso!' });
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            res.status(500).json({ success: false, message: 'Erro ao criar grupo' });
        }
    });

    // Atualizar grupo (e cascade para tabelas relacionadas)
    router.put('/groups/:id', async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params; // antigo id/nome
            const { descricao } = req.body; // novo nome/descrição

            await client.query('BEGIN');

            // 1. Atualizar o grupo em si
            const queryGroup = 'UPDATE user_grupos SET descricao = $1 WHERE grupo = $2 RETURNING *';
            const resultGroup = await client.query(queryGroup, [descricao.substring(0, 20), id]);

            // Se o ID do grupo também mudasse seria necessário atualizar user_nomes e user_menu_superior aqui.
            // Como aqui 'grupo' parece ser a chave curta (ID), mantemos o cascade manual se necessário.

            await client.query('COMMIT');

            if (resultGroup.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            res.json({ success: true, data: resultGroup.rows[0], message: 'Grupo atualizado!' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar grupo:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar grupo' });
        } finally {
            client.release();
        }
    });

    // Excluir grupo
    router.delete('/groups/:id', async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            await client.query('BEGIN');

            // Remove permissões vinculadas antes do grupo
            await client.query('DELETE FROM user_menu_superior WHERE grupo = $1', [id]);

            const query = 'DELETE FROM user_grupos WHERE grupo = $1 RETURNING *';
            const result = await client.query(query, [id]);

            await client.query('COMMIT');

            if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            res.json({ success: true, message: 'Grupo e permissões removidos!' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao excluir grupo:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir grupo' });
        } finally {
            client.release();
        }
    });

    // --- PERMISSÕES DO GRUPO (user_menu_superior) ---

    // Listar permissões de um grupo com Auto-Seed
    router.get('/groups/:groupId/permissions', async (req, res) => {
        try {
            const { groupId } = req.params;

            // 1. Tentar buscar permissões existentes
            let query = `
                SELECT opcao, grupo, indice, porsenha, invisivel, incluir, modificar, excluir, descricao
                FROM user_menu_superior 
                WHERE grupo = $1
                ORDER BY indice
            `;
            let result = await pool.query(query, [groupId]);

            // 2. Se não houver nada, vamos semear (Seed) com o padrão do sistema
            if (result.rows.length === 0) {
                console.log(`🌱 [SEED] Populando permissões padrão para o grupo: ${groupId}`);

                const defaultMenus = [
                    { idx: 10, label: 'CADASTROS', isParent: true },
                    { idx: 100, label: 'Indústrias' },
                    { idx: 101, label: 'Clientes' },
                    { idx: 103, label: 'Vendedores' },
                    { idx: 105, label: 'Produtos' },
                    { idx: 117, label: 'Categorias' },
                    { idx: 104, label: 'Grupos de Produtos' },
                    { idx: 118, label: 'Grupos Descontos' },
                    { idx: 113, label: 'Regiões' },
                    { idx: 114, label: 'Área Atuação' },
                    { idx: 106, label: 'Transportadoras' },
                    { idx: 111, label: 'Tabelas Preços' },

                    { idx: 20, label: 'MOVIMENTAÇÕES', isParent: true },
                    { idx: 207, label: 'Pedidos de Venda' },
                    { idx: 205, label: 'Baixa via XML' },
                    { idx: 208, label: 'SELL-OUT' },
                    { idx: 206, label: 'CRM / Atendimentos' },

                    { idx: 30, label: 'FINANCEIRO', isParent: true },
                    { idx: 301, label: 'Contas a Receber' },
                    { idx: 302, label: 'Contas a Pagar' },
                    { idx: 303, label: 'Fluxo de Caixa' },
                    { idx: 304, label: 'DRE Gerencial' },
                    { idx: 109, label: 'Plano de Contas' },
                    { idx: 108, label: 'Centro de Custo' },
                    { idx: 305, label: 'Clientes Financeiros' },
                    { idx: 307, label: 'Fornecedores Fin.' },

                    { idx: 50, label: 'ESTATÍSTICAS', isParent: true },
                    { idx: 501, label: 'Mapa de Vendas' },
                    { idx: 502, label: 'Mapa Cli/Indústria' },
                    { idx: 503, label: 'Mapa Cli Mês a Mês' },
                    { idx: 504, label: 'Mapa por Vendedor' },
                    { idx: 505, label: 'Mapa Produtos' },
                    { idx: 506, label: 'Últimas Compras' },
                    { idx: 507, label: 'Mapa em Qtd' },
                    { idx: 508, label: 'Comparativo Clientes' },
                    { idx: 509, label: 'Grupo de Lojas' },

                    { idx: 60, label: 'UTILITÁRIOS', isParent: true },
                    { idx: 610, label: 'Catálogo Digital' },
                    { idx: 620, label: 'Assistente IA' },
                    { idx: 630, label: 'Tetris' },
                    { idx: 640, label: 'Jogo de Dados' },
                    { idx: 601, label: 'Usuários do sistema' },
                    { idx: 611, label: 'Parâmetros' },
                    { idx: 612, label: 'Configurações' },

                    { idx: 70, label: 'REPCRM SPECIALIST', isParent: true },
                    { idx: 701, label: 'Dashboard CRM' },
                    { idx: 702, label: 'Gestão de Comissões' },
                    { idx: 703, label: 'Relatórios de Visita' },
                    { idx: 704, label: 'Configurações CRM' }
                ];

                const insertQuery = `
                    INSERT INTO user_menu_superior 
                    (grupo, indice, descricao, opcao, invisivel, incluir, modificar, excluir, porsenha)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `;

                for (const menu of defaultMenus) {
                    await pool.query(insertQuery, [
                        groupId,
                        menu.idx,
                        menu.label.toUpperCase(),
                        menu.idx,
                        false, // visível por padrão
                        true,  // incluir
                        true,  // modificar
                        true,  // excluir
                        false  // sem senha
                    ]);
                }

                // Refazer a busca após o seed
                result = await pool.query(query, [groupId]);
            }

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Erro ao buscar permissões:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar permissões' });
        }
    });

    // Salvar/Atualizar permissões de um grupo
    router.put('/groups/:groupId/permissions', async (req, res) => {
        // Inicia uma transação para atualizar múltiplas permissões
        const client = await pool.connect();
        try {
            const { groupId } = req.params;
            const { permissions } = req.body; // Array de objetos de permissão

            await client.query('BEGIN');

            for (const perm of permissions) {
                const query = `
                    UPDATE user_menu_superior 
                    SET 
                        invisivel = $1, 
                        incluir = $2, 
                        modificar = $3, 
                        excluir = $4
                    WHERE grupo = $5 AND indice = $6
                `;
                await client.query(query, [
                    perm.invisivel,
                    perm.incluir,
                    perm.modificar,
                    perm.excluir,
                    groupId,
                    perm.indice
                ]);
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'Permissões atualizadas com sucesso!' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao salvar permissões:', error);
            res.status(500).json({ success: false, message: 'Erro ao salvar permissões' });
        } finally {
            client.release();
        }
    });

    // --- USUÁRIOS (user_nomes) ---

    // Listar todos os usuários com detalhes (Resiliente à falta da coluna 'ativo')
    router.get('/users', async (req, res) => {
        try {
            const query = `
                SELECT 
                    codigo, nome, sobrenome, usuario, grupo, master, gerencia, imagem, COALESCE(ativo, true) as ativo
                FROM user_nomes 
                ORDER BY nome
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.warn('⚠️ [USERS] Erro ao buscar usuários com coluna ativo, tentando fallback:', error.message);
            try {
                const fallbackQuery = 'SELECT codigo, nome, sobrenome, usuario, grupo, master, gerencia, imagem, true as ativo FROM user_nomes ORDER BY nome';
                const result = await pool.query(fallbackQuery);
                res.json({ success: true, data: result.rows });
            } catch (err2) {
                console.error('❌ [USERS] Erro fatal ao buscar usuários:', err2);
                res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
            }
        }
    });

    // Criar/Atualizar usuário (Resiliente à falta da coluna 'ativo')
    router.post('/users', async (req, res) => {
        try {
            const { codigo, nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo, imagem } = req.body;
            const tenantCnpj = req.headers['x-tenant-cnpj'];

            if (!codigo) {
                // INSERT - Verificar limite de usuários no Master
                if (tenantCnpj) {
                    try {
                        const { masterPool } = require('./utils/db');
                        const masterQuery = 'SELECT limite_usuarios FROM empresas WHERE cnpj = $1';
                        const masterRes = await masterPool.query(masterQuery, [tenantCnpj.replace(/\D/g, '')]);

                        if (masterRes.rows.length > 0) {
                            const limite = masterRes.rows[0].limite_usuarios || 999;
                            const countQuery = 'SELECT COUNT(*) as total FROM user_nomes';
                            const countRes = await pool.query(countQuery);
                            const totalAtual = parseInt(countRes.rows[0].total);

                            if (totalAtual >= limite) {
                                return res.status(403).json({
                                    success: false,
                                    message: `Limite de usuários atingido (${limite}). Entre em contato com o suporte.`
                                });
                            }
                        }
                    } catch (mErr) { console.warn('Falha ao checar limites no master, prosseguindo...'); }
                }

                // Prosseguir com INSERT resiliente
                try {
                    const query = `
                        INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo, imagem)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        RETURNING *
                    `;
                    const result = await pool.query(query, [nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo !== undefined ? ativo : true, imagem]);
                    return res.json({ success: true, data: result.rows[0], message: 'Usuário criado!' });
                } catch (insErr) {
                    if (insErr.message.includes('ativo')) {
                        const fallbackQuery = `
                            INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            RETURNING *
                        `;
                        const result = await pool.query(fallbackQuery, [nome, sobrenome, usuario, senha, grupo, master, gerencia]);
                        return res.json({ success: true, data: result.rows[0], message: 'Usuário criado!' });
                    }
                    throw insErr;
                }
            } else {
                // UPDATE resiliente
                try {
                    const query = `
                        UPDATE user_nomes 
                        SET nome = $1, sobrenome = $2, usuario = $3, grupo = $4, master = $5, gerencia = $6, ativo = $7, imagem = $8
                        ${senha ? ', senha = $9' : ''}
                        WHERE codigo = $${senha ? '10' : '9'}
                        RETURNING *
                    `;
                    const params = [nome, sobrenome, usuario, grupo, master, gerencia, ativo !== undefined ? ativo : true, imagem];
                    if (senha) params.push(senha);
                    params.push(codigo);

                    const result = await pool.query(query, params);
                    return res.json({ success: true, data: result.rows[0], message: 'Usuário atualizado!' });
                } catch (updErr) {
                    if (updErr.message.includes('ativo')) {
                        const fallbackQuery = `
                            UPDATE user_nomes 
                            SET nome = $1, sobrenome = $2, usuario = $3, grupo = $4, master = $5, gerencia = $6
                            ${senha ? ', senha = $7' : ''}
                            WHERE codigo = $${senha ? '8' : '7'}
                            RETURNING *
                        `;
                        const params = [nome, sobrenome, usuario, grupo, master, gerencia];
                        if (senha) params.push(senha);
                        params.push(codigo);

                        const result = await pool.query(fallbackQuery, params);
                        return res.json({ success: true, data: result.rows[0], message: 'Usuário atualizado!' });
                    }
                    throw updErr;
                }
            }
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            res.status(500).json({ success: false, message: 'Erro ao salvar usuário: ' + error.message });
        }
    });

    // Excluir usuário
    router.delete('/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const query = 'DELETE FROM user_nomes WHERE codigo = $1 RETURNING *';
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            res.json({ success: true, message: 'Operador removido com sucesso!' });
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir usuário' });
        }
    });

    // --- PERMISSÕES DO USUÁRIO LOGADO (Para o Sidebar) ---
    router.get('/my-permissions', async (req, res) => {
        try {
            // No SalesMasters, o usuário logado é identificado pelo middleware de autenticação
            // mas aqui vamos pegar o ID que o frontend deve enviar ou via token se implementado.
            // Como ainda estamos usando o modelo de bypass e session, vamos buscar pelo ID do usuário.
            const userId = req.query.userId;
            if (!userId) return res.status(400).json({ success: false, message: 'ID do usuário não fornecido' });

            const userQuery = 'SELECT grupo, master, gerencia FROM user_nomes WHERE codigo = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

            const user = userResult.rows[0];

            if (user.master) {
                return res.json({ success: true, master: true, isGerencia: true });
            }

            const permQuery = `
                SELECT indice, invisivel, incluir, modificar, excluir 
                FROM user_menu_superior 
                WHERE grupo = $1
            `;
            const permResult = await pool.query(permQuery, [user.grupo]);

            res.json({ success: true, master: false, isGerencia: user.gerencia || false, permissions: permResult.rows });
        } catch (error) {
            console.error('Erro ao buscar permissões do usuário:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar permissões' });
        }
    });

    return router;
};
