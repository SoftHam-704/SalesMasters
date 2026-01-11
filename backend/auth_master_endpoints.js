const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('./utils/db');
const crypto = require('crypto');

/**
 * LOGIN MASTER + TENANT (Centralizado no Master DB)
 * 1. Valida a empresa no Master pelo CNPJ
 * 2. Verifica Limite de Sessões (Bloqueio de Equipamento)
 * 3. Valida o usuário na tabela 'usuarios' do Master DB
 */
router.post('/master-login', async (req, res) => {
    const { cnpj, nome, sobrenome, email, password } = req.body;

    // Limpa CNPJ
    const rawCnpj = cnpj ? cnpj.replace(/\D/g, '') : '';

    // Identificador do usuário (pode ser email ou nome+sobrenome)
    const userIdentifier = email || `${nome} ${sobrenome}`.trim();

    if (!rawCnpj || !userIdentifier || !password) {
        return res.status(400).json({
            success: false,
            message: 'CNPJ, Identificação do Usuário e Senha são obrigatórios'
        });
    }

    try {
        const CNPJ_TESTE = '00000000000191';
        let empresa;
        let dbConfig;

        // 1. BUSCAR EMPRESA NO MASTER
        const isDev = process.env.NODE_ENV !== 'production';

        if (rawCnpj === CNPJ_TESTE && isDev) {
            console.log('🔧 [AUTH] MODO TESTE (Bypass): Empresa SoftHam Local');
            empresa = {
                id: 1, // Assumimos que SoftHam é ID 1
                cnpj: CNPJ_TESTE,
                razao_social: 'SOFTHAM SISTEMAS LTDA',
                status: 'ATIVO',
                db_host: 'localhost',
                db_nome: 'basesales',
                db_schema: 'public',
                db_usuario: 'postgres',
                db_senha: '@12Pilabo',
                db_porta: 5432,
                limite_sessoes: 999, // Sem limite no teste
                bloqueio_ativo: 'N'
            };
        } else {
            const masterQuery = `
                SELECT id, cnpj, razao_social, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                       COALESCE(limite_sessoes, 3) as limite_sessoes, 
                       COALESCE(bloqueio_ativo, 'S') as bloqueio_ativo
                FROM empresas 
                WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
            `;
            const masterResult = await masterPool.query(masterQuery, [rawCnpj]);

            if (masterResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Empresa não encontrada com este CNPJ no cadastro Master.' });
            }
            empresa = masterResult.rows[0];
        }

        if (empresa.status !== 'ATIVO') {
            return res.status(403).json({
                success: false,
                message: `Empresa bloqueada. Status: ${empresa.status}.`
            });
        }

        // --- CONTROLE DE SESSÃO / BLOQUEIO DE EQUIPAMENTO ---
        const SESSION_TIMEOUT_MINUTES = 15;

        const countQuery = `
            SELECT COUNT(*) as qtd 
            FROM sessoes_ativas 
            WHERE empresa_id = $1 
              AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `;
        const countResult = await masterPool.query(countQuery, [empresa.id]);
        const activeSessions = parseInt(countResult.rows[0].qtd);

        console.log(`🔒 [AUTH SESSION] Empresa ${empresa.razao_social}: ${activeSessions}/${empresa.limite_sessoes} sessões ativas.`);

        if (empresa.bloqueio_ativo === 'S' && activeSessions >= empresa.limite_sessoes) {
            const logQuery = `
                INSERT INTO log_tentativas_excedentes (empresa_id, ip, motivo)
                VALUES ($1, $2, $3)
            `;
            masterPool.query(logQuery, [
                empresa.id,
                req.ip || req.connection.remoteAddress,
                `Bloqueio: ${activeSessions} ativos >= limite ${empresa.limite_sessoes}`
            ]).catch(err => console.error('Erro ao logar bloqueio:', err));

            return res.status(403).json({
                success: false,
                message: `Limite de conexões simultâneas atingido (${empresa.limite_sessoes}). Encerre outros acessos ou aguarde 15 minutos.`
            });
        }
        // ----------------------------------------------------

        // 2. VALIDAR USUÁRIO NO MASTER DB
        let userQuery;
        let userParams;

        if (email) {
            userQuery = `SELECT * FROM usuarios WHERE email = $1 AND empresa_id = $2 AND senha = $3 AND ativo = true`;
            userParams = [email, empresa.id, password];
        } else {
            userQuery = `SELECT * FROM usuarios WHERE nome = $1 AND sobrenome = $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
            userParams = [nome, sobrenome, empresa.id, password];
        }

        const userResult = await masterPool.query(userQuery, userParams);

        // SE NÃO ENCONTRADO NO MASTER, tentamos o fallback no Tenant
        if (userResult.rows.length === 0) {
            console.log(`⚠️ [AUTH] Usuário não encontrado no Master DB. Tentando fallback no Tenant para: ${userIdentifier}`);

            dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                schema: empresa.db_schema || 'public',
                user: empresa.db_usuario,
                password: empresa.db_senha || '',
                port: empresa.db_porta || 5432
            };

            const tenantPool = getTenantPool(empresa.cnpj, dbConfig);
            const tenantQuery = `
                SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia
                FROM user_nomes
                WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND senha = $3
            `;
            const tenantResult = await tenantPool.query(tenantQuery, [nome, sobrenome, password]);

            if (tenantResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
            }

            const dbUser = tenantResult.rows[0];
            const isHamilton = dbUser.nome && dbUser.nome.toLowerCase() === 'hamilton' && empresa.cnpj === CNPJ_TESTE;

            return res.json({
                success: true,
                message: 'Login realizado (Fallback Tenant)',
                user: {
                    id: dbUser.id,
                    nome: dbUser.nome,
                    sobrenome: dbUser.sobrenome,
                    email: email || '',
                    role: isHamilton ? 'superadmin' : (dbUser.e_admin ? 'admin' : (dbUser.gerencia ? 'manager' : 'user')),
                    empresa: empresa.razao_social,
                    cnpj: empresa.cnpj
                },
                tenantConfig: { cnpj: empresa.cnpj, dbConfig }
            });
        }

        const masterUser = userResult.rows[0];
        const isHamilton = (masterUser.email && masterUser.email.toLowerCase() === 'hamilton@softham.com.br') ||
            (masterUser.nome && masterUser.nome.toLowerCase() === 'hamilton' && empresa.cnpj === CNPJ_TESTE);

        // --- CRIAR SESSÃO ATIVA ---
        const sessionToken = crypto.randomUUID();
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const insertSessionQuery = `
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, ip, user_agent)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await masterPool.query(insertSessionQuery, [empresa.id, masterUser.id, sessionToken, clientIp, userAgent]);
        // ---------------------------

        console.log('✅ [AUTH] Login Master realizado:', {
            nome: masterUser.nome,
            email: masterUser.email,
            isHamilton,
            role: isHamilton ? 'superadmin' : (masterUser.e_admin ? 'admin' : 'user'),
            session: sessionToken
        });

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token: sessionToken,
            user: {
                id: masterUser.id,
                nome: masterUser.nome,
                sobrenome: masterUser.sobrenome,
                email: masterUser.email,
                role: isHamilton ? 'superadmin' : (masterUser.e_admin ? 'admin' : 'user'),
                empresa: empresa.razao_social,
                cnpj: empresa.cnpj
            },
            tenantConfig: {
                cnpj: empresa.cnpj,
                dbConfig: {
                    host: empresa.db_host,
                    database: empresa.db_nome,
                    schema: empresa.db_schema || 'public',
                    user: empresa.db_usuario,
                    password: empresa.db_senha || '',
                    port: empresa.db_porta || 5432
                }
            }
        });

    } catch (error) {
        console.error('❌ [AUTH MASTER] Erro crítico no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao processar login.' });
    }
});

module.exports = router;
