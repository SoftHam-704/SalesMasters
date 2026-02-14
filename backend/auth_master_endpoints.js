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
    const { cnpj, sobrenome, email, password } = req.body;
    const nome = req.body.nome || req.body.name; // Alias para compatibilidade

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

        // 1. BUSCAR EMPRESA NO MASTER (VIA CNPJ)
        const isDev = process.env.NODE_ENV !== 'production';

        const masterQuery = `
            SELECT id, cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                   COALESCE(limite_sessoes, 999) as limite_sessoes, 
                   COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo,
                   ramoatv, ios_enabled
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
        `;
        const masterResult = await masterPool.query(masterQuery, [rawCnpj]);

        if (masterResult.rows.length > 0) {
            empresa = masterResult.rows[0];
        } else if (rawCnpj === CNPJ_TESTE && isDev) {
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
                ios_enabled: 'S',
                ramoatv: 'Autopeças'
            };
        }

        if (!empresa) {
            return res.status(404).json({ success: false, message: 'Empresa não encontrada ou CNPJ não autorizado.' });
        }

        if (empresa.status !== 'ATIVO') {
            return res.status(403).json({ success: false, message: 'Empresa inativa. Entre em contato com o suporte.' });
        }

        // --- CONTROLE DE SESSÃO / BLOQUEIO DE EQUIPAMENTO ---
        const SESSION_TIMEOUT_MINUTES = 15;
        const countResult = await masterPool.query(`
            SELECT COUNT(*) as qtd FROM sessoes_ativas 
            WHERE empresa_id = $1 AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `, [empresa.id]);

        const activeSessions = parseInt(countResult.rows[0].qtd);

        if (empresa.bloqueio_ativo === 'S' && activeSessions >= empresa.limite_sessoes) {
            return res.status(403).json({
                success: false,
                message: `Limite de conexões simultâneas atingido (${empresa.limite_sessoes}).`
            });
        }

        // 2. VALIDAR USUÁRIO NO BANCO DO CLIENTE (TENANT)
        // O CNPJ foi validado no Master. Agora "encaminhamos" para o schema correto.
        const dbConfig = {
            host: empresa.db_host,
            database: empresa.db_nome,
            schema: empresa.db_schema || 'public',
            user: empresa.db_usuario,
            password: empresa.db_senha || '',
            port: empresa.db_porta || 5432
        };

        const tenantPool = getTenantPool(empresa.cnpj, dbConfig);
        if (!tenantPool) throw new Error('Falha ao conectar com a base do cliente.');

        // Força busca no schema da empresa (EXCLUSIVIDADE)
        const schema = dbConfig.schema.replace(/[^a-zA-Z0-9_]/g, '');
        await tenantPool.query(`SET search_path TO "${schema}"`);

        let tenantQuery;
        let tenantParams;

        if (email) {
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
                WHERE LOWER(nome) = LOWER($1) AND LOWER(sobrenome) = LOWER($2) AND senha = $3
            `;
            tenantParams = [nome, sobrenome, password];
        }

        const tenantResult = await tenantPool.query(tenantQuery, tenantParams);

        if (tenantResult.rows.length === 0) {
            console.warn(`❌ [AUTH] Credenciais inválidas no schema: ${schema}`);
            return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos para esta empresa.' });
        }

        const user = tenantResult.rows[0];
        const isHamilton = (user.usuario && user.usuario.toLowerCase().includes('hamilton')) ||
            (user.nome && user.nome.toLowerCase().includes('hamilton'));

        // --- CRIAR SESSÃO NO MASTER (Heartbeat) ---
        const sessionToken = crypto.randomUUID();
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Se o usuário veio do fallback do tenant, usamos tenant_user_id e deixamos usuario_id NULL
        // Mas como agora TODOS os logins vêm do tenant, a lógica muda:
        // Se este usuário existir na tabela 'usuarios' do Master (espelhamento), usamos o ID dele.
        // Se não, usamos tenant_user_id. 
        // Para simplificar e resolver o bloqueio AGORA: vamos salvar no tenant_user_id.

        await masterPool.query(`
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, tenant_user_id, token_sessao, ip, user_agent)
            VALUES ($1, NULL, $2, $3, $4, $5)
        `, [empresa.id, user.id, sessionToken, clientIp, req.headers['user-agent'] || 'Unknown']);

        console.log(`✅ [AUTH] Login realizado no schema "${schema}" para: ${user.nome}`);

        res.json({
            success: true,
            token: sessionToken,
            user: {
                id: user.id,
                empresa_id: empresa.id,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: email || user.usuario || '',
                role: isHamilton ? 'superadmin' : (user.e_admin === true || user.e_admin === 'S' ? 'admin' : 'user'),
                empresa: empresa.nome_fantasia || empresa.razao_social,
                cnpj: empresa.cnpj,
                biEnabled: empresa.bloqueio_ativo === 'S',
                ios_enabled: empresa.ios_enabled || 'N',
                ramoatv: empresa.ramoatv || 'PADRAO'
            },
            tenantConfig: {
                cnpj: empresa.cnpj,
                ramoatv: empresa.ramoatv || 'PADRAO',
                dbConfig: { ...dbConfig }
            }
        });

    } catch (error) {
        console.error('❌ [AUTH MASTER] Erro crítico no fluxo de login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao processar login.',
            detail: error.message
        });
    }
});

module.exports = router;
