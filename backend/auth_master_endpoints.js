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
        const CNPJ_TESTE = '17504829000124';
        const CNPJ_SOMA = '23929353000176';
        let empresa;
        let dbConfig;

        // 1. BUSCAR EMPRESA NO MASTER
        const isDev = process.env.NODE_ENV !== 'production';

        // Usamos regexp_replace para comparar apenas os números do CNPJ no banco também
        const masterQuery = `
            SELECT id, cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                   COALESCE(limite_sessoes, 999) as limite_sessoes, 
                   COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo,
                   COALESCE(ios_enabled, 'N') as ios_enabled
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
        `;
        const masterResult = await masterPool.query(masterQuery, [rawCnpj]);

        if (masterResult.rows.length > 0) {
            empresa = masterResult.rows[0];
        } else if (rawCnpj === CNPJ_TESTE && isDev) {
            // Bypass apenas para desenvolvimento local se não estiver na tabela
            console.log('🔧 [AUTH] MODO TESTE (Bypass): Empresa SoftHam Local');
            empresa = {
                id: 1,
                cnpj: CNPJ_TESTE,
                razao_social: 'SOFTHAM SISTEMAS LTDA',
                nome_fantasia: 'SoftHam Sistemas',
                status: 'ATIVO',
                db_host: 'localhost',
                db_nome: 'basesales',
                db_schema: 'public',
                db_usuario: 'postgres',
                db_senha: '@12Pilabo',
                db_porta: 5432,
                limite_sessoes: 999,
                bloqueio_ativo: 'N',
                ios_enabled: 'S'
            };
        }

        if (!empresa) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada ou CNPJ não autorizado.' });
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
            userQuery = `SELECT * FROM usuarios WHERE email ILIKE $1 AND empresa_id = $2 AND senha = $3 AND ativo = true`;
            userParams = [email, empresa.id, password];
        } else {
            userQuery = `SELECT * FROM usuarios WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
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

            // Força o schema correto para a busca do usuário
            await tenantPool.query(`SET search_path TO "${dbConfig.schema}", public`);

            let tenantQuery;
            let tenantParams;

            if (email) {
                // Tenta buscar por email no tenant (alguns tenants podem ter coluna email em user_nomes ou similar)
                // Se não existir a coluna email, esse fallback pode falhar, mas vamos tentar o padrão.
                tenantQuery = `
                    SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia
                    FROM user_nomes
                    WHERE (usuario ILIKE $1 OR nome || ' ' || sobrenome ILIKE $1) AND senha = $2
                `;
                tenantParams = [email, password];
            } else {
                tenantQuery = `
                    SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia
                    FROM user_nomes
                    WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND senha = $3
                `;
                tenantParams = [nome, sobrenome, password];
            }

            const tenantResult = await tenantPool.query(tenantQuery, tenantParams);

            if (tenantResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
            }

            const dbUser = tenantResult.rows[0];

            // Hamilton Detection (Fallback Path)
            const isHamilton = (dbUser.usuario && dbUser.usuario.toLowerCase().includes('hamilton')) ||
                (dbUser.nome && dbUser.nome.toLowerCase().includes('hamilton')) ||
                (email && email.toLowerCase() === 'hamilton@softham.com.br');

            return res.json({
                success: true,
                message: 'Login realizado (Fallback Tenant)',
                user: {
                    id: dbUser.id,
                    empresa_id: empresa.id,
                    nome: dbUser.nome,
                    sobrenome: dbUser.sobrenome,
                    email: email || dbUser.usuario || '',
                    role: isHamilton ? 'superadmin' : (dbUser.e_admin ? 'admin' : (dbUser.gerencia ? 'manager' : 'user')),
                    empresa: empresa.nome_fantasia || empresa.razao_social,
                    cnpj: empresa.cnpj,
                    biEnabled: empresa.bloqueio_ativo === 'S',
                    ios_enabled: empresa.ios_enabled
                },
                tenantConfig: { cnpj: empresa.cnpj, dbConfig }
            });
        }

        const masterUser = userResult.rows[0];

        // Hamilton Detection (Master Path) - More robust
        const isHamilton = (masterUser.email && masterUser.email.toLowerCase() === 'hamilton@softham.com.br') ||
            (masterUser.nome && masterUser.nome.toLowerCase().includes('hamilton'));

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
                empresa_id: empresa.id,
                nome: masterUser.nome,
                sobrenome: masterUser.sobrenome,
                email: masterUser.email,
                role: isHamilton ? 'superadmin' : (masterUser.e_admin ? 'admin' : 'user'),
                empresa: empresa.nome_fantasia || empresa.razao_social,
                cnpj: empresa.cnpj,
                biEnabled: empresa.bloqueio_ativo === 'S',
                ios_enabled: empresa.ios_enabled
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
        res.status(500).json({
            success: false,
            message: 'Erro interno ao processar login.',
            debug: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
