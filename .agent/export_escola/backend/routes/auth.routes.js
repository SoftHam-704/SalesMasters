const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('../utils/db');
const crypto = require('crypto');

const SESSION_TIMEOUT_MINUTES = 15;

router.post('/login', async (req, res) => {
    const { cnpj, nome, sobrenome, email, password } = req.body;
    const rawCnpj = cnpj ? cnpj.replace(/\D/g, '') : '';
    const userIdentifier = email || `${nome} ${sobrenome}`;

    if (!rawCnpj || !userIdentifier || !password) {
        return res.status(400).json({ success: false, message: 'CNPJ, Usuário e Senha são obrigatórios' });
    }

    try {
        // 1. Buscar escola no Master
        const empresaResult = await masterPool.query(`
            SELECT id, cnpj, razao_social, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta,
                   COALESCE(limite_sessoes, 3) as limite_sessoes, COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo
            FROM empresas WHERE cnpj = $1 AND status = 'ATIVO'
        `, [rawCnpj]);

        if (empresaResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Escola não encontrada ou inativa' });
        }

        const empresa = empresaResult.rows[0];

        // 2. Verificar limite de sessões
        const countResult = await masterPool.query(`
            SELECT COUNT(*) as qtd FROM sessoes_ativas 
            WHERE empresa_id = $1 AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `, [empresa.id]);

        if (empresa.bloqueio_ativo === 'S' && parseInt(countResult.rows[0].qtd) >= empresa.limite_sessoes) {
            return res.status(403).json({ success: false, message: `Limite de ${empresa.limite_sessoes} sessões atingido.` });
        }

        // 3. Validar usuário no Master
        let userQuery, userParams;
        if (email) {
            userQuery = `SELECT * FROM usuarios WHERE email = $1 AND empresa_id = $2 AND senha = $3 AND ativo = true`;
            userParams = [email, empresa.id, password];
        } else {
            userQuery = `SELECT * FROM usuarios WHERE nome = $1 AND sobrenome = $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
            userParams = [nome, sobrenome, empresa.id, password];
        }

        const userResult = await masterPool.query(userQuery, userParams);

        // 4. Fallback para Tenant (user_nomes)
        if (userResult.rows.length === 0) {
            const dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta || 5432
            };

            const tenantPool = getTenantPool(dbConfig);
            const tenantResult = await tenantPool.query(`
                SELECT codigo as id, nome, sobrenome, grupo, master, gerencia 
                FROM user_nomes 
                WHERE UPPER(nome) = UPPER($1) AND UPPER(sobrenome) = UPPER($2) AND senha = $3
            `, [nome, sobrenome, password]);

            if (tenantResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
            }

            const dbUser = tenantResult.rows[0];
            const sessionToken = crypto.randomBytes(32).toString('hex');

            await masterPool.query(`
                INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, tipo_usuario, ativo)
                VALUES ($1, $2, $3, 'tenant', true)
            `, [empresa.id, dbUser.id, sessionToken]);

            return res.json({
                success: true,
                token: sessionToken,
                user: {
                    id: dbUser.id,
                    nome: dbUser.nome,
                    sobrenome: dbUser.sobrenome,
                    role: dbUser.master ? 'admin' : 'user',
                    grupo: dbUser.grupo,
                    empresa: empresa.razao_social,
                    cnpj: empresa.cnpj
                },
                tenantConfig: dbConfig
            });
        }

        // 5. Login via Master
        const masterUser = userResult.rows[0];
        const sessionToken = crypto.randomBytes(32).toString('hex');

        await masterPool.query(`
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, tipo_usuario, ativo)
            VALUES ($1, $2, $3, 'master', true)
        `, [empresa.id, masterUser.id, sessionToken]);

        res.json({
            success: true,
            token: sessionToken,
            user: {
                id: masterUser.id,
                nome: masterUser.nome,
                email: masterUser.email,
                role: masterUser.e_admin ? 'admin' : 'user',
                empresa: empresa.razao_social,
                cnpj: empresa.cnpj
            },
            tenantConfig: {
                host: empresa.db_host,
                database: empresa.db_nome,
                schema: empresa.db_schema || 'public',
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta || 5432
            }
        });

    } catch (error) {
        console.error('❌ [AUTH] Erro:', error);
        res.status(500).json({ success: false, message: 'Erro interno' });
    }
});

router.post('/logout', async (req, res) => {
    const token = req.headers['x-session-token'];
    if (token) {
        await masterPool.query(`UPDATE sessoes_ativas SET ativo = false WHERE token_sessao = $1`, [token]);
    }
    res.json({ success: true, message: 'Logout realizado' });
});

module.exports = router;
