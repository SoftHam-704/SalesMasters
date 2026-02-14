const express = require('express');
const { createTransporter, sendMail } = require('./utils/mailer');

module.exports = function (pool) {
    const router = express.Router();

    // 1. Get Atuacao Options
    router.get(['/atuacao-options', '/filter-options/atuacao'], async (req, res) => {
        try {
            const query = 'SELECT atu_id as atu_codigo, atu_descricao as atu_nome FROM area_atu ORDER BY atu_descricao';
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [MARKETING] Erro ao buscar áreas de atuação:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 1.1 Get Industria Options
    router.get('/filter-options/industrias', async (req, res) => {
        try {
            const query = `
                SELECT 
                    for_codigo as ind_codigo, 
                    COALESCE(NULLIF(for_nomered, ''), for_nome) as ind_nome 
                FROM fornecedores 
                ORDER BY ind_nome
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [MARKETING] Erro ao buscar indústrias:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 2. Filter: Unified Interface
    router.get('/filter-clients', async (req, res) => {
        const { filterType, search, atuacao_ids, dt_start, dt_end, industria_id } = req.query;

        try {
            let result;
            switch (filterType) {
                case 'contatos':
                    result = await getClientsAll(pool, search);
                    break;
                case 'atuacao':
                    const ids = atuacao_ids ? atuacao_ids.split(',').map(id => parseInt(id)) : [];
                    result = await getClientsByAtuacao(pool, ids);
                    break;
                case 'aniversariantes':
                    result = await getClientsByBirthdays(pool, dt_start, dt_end);
                    break;
                case 'industria':
                    result = await getClientsByIndustria(pool, industria_id, search);
                    break;
                case 'prospeccao':
                    result = await getClientsByProspecting(pool, industria_id, search);
                    break;
                default:
                    return res.status(400).json({ success: false, message: 'Tipo de filtro inválido' });
            }
            res.json({ success: true, data: result });
        } catch (error) {
            console.error(`❌ [MARKETING] Erro ao filtrar (${filterType}):`, error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    async function getClientsAll(pool, search) {
        let query = `
            SELECT cli_codigo, cli_nome, cli_fantasia, cli_email, cli_cidade, cli_uf 
            FROM clientes 
            WHERE cli_tipopes = 'A' AND cli_email IS NOT NULL AND cli_email <> ''
        `;
        const params = [];
        if (search) {
            query += ` AND (cli_nome ILIKE $1 OR cli_fantasia ILIKE $1 OR cli_email ILIKE $1 OR cli_cidade ILIKE $1)`;
            params.push(`%${search}%`);
        }
        query += ' ORDER BY cli_nome LIMIT 500';
        const result = await pool.query(query, params);
        return result.rows;
    }

    async function getClientsByAtuacao(pool, atuacaoIds) {
        if (!atuacaoIds || atuacaoIds.length === 0) return [];
        const query = `
            SELECT DISTINCT c.cli_codigo, c.cli_nome, c.cli_fantasia, c.cli_email, c.cli_cidade, c.cli_uf 
            FROM clientes c 
            JOIN atua_cli ac ON c.cli_codigo = ac.atu_idcli
            WHERE c.cli_tipopes = 'A' AND c.cli_email IS NOT NULL AND c.cli_email <> ''
            AND ac.atu_atuaid = ANY($1)
            ORDER BY c.cli_nome
        `;
        const result = await pool.query(query, [atuacaoIds]);
        return result.rows;
    }

    async function getClientsByBirthdays(pool, start, end) {
        if (!start || !end) return [];

        try {
            const startM = parseInt(start.substring(5, 7));
            const startD = parseInt(start.substring(8, 10));
            const endM = parseInt(end.substring(5, 7));
            const endD = parseInt(end.substring(8, 10));

            let query = `
                SELECT DISTINCT
                    a.ani_nome as cli_nome, 
                    a.ani_email as cli_email, 
                    a.ani_cliente as cli_codigo,
                    c.cli_fantasia, c.cli_cidade, c.cli_uf 
                FROM cli_aniv a
                JOIN clientes c ON a.ani_cliente = c.cli_codigo
                WHERE a.ani_email IS NOT NULL AND a.ani_email <> ''
            `;

            if (startM === endM) {
                query += ` AND a.ani_mes = $1 AND a.ani_diaaniv BETWEEN $2 AND $3`;
                const result = await pool.query(query, [startM, startD, endD]);
                return result.rows;
            } else {
                query += ` AND (
                    (a.ani_mes = $1 AND a.ani_diaaniv >= $2) OR
                    (a.ani_mes = $3 AND a.ani_diaaniv <= $4) OR
                    (a.ani_mes > $1 AND a.ani_mes < $3)
                )`;
                const result = await pool.query(query, [startM, startD, endM, endD]);
                return result.rows;
            }
        } catch (e) {
            console.error('❌ [BIRTHDAYS] Erro ao processar datas:', e);
            return [];
        }
    }

    async function getClientsByIndustria(pool, industriaId, search) {
        if (!industriaId) return [];
        let query = `
            SELECT DISTINCT 
                c.cli_codigo, c.cli_nome, c.cli_fantasia, c.cli_email, c.cli_cidade, c.cli_uf 
            FROM clientes c 
            JOIN pedidos p ON c.cli_codigo = p.ped_cliente 
            WHERE p.ped_industria = $1 
              AND p.ped_situacao IN ('P', 'F')
              AND c.cli_email IS NOT NULL AND c.cli_email <> ''
        `;
        const params = [industriaId];
        if (search) {
            query += ` AND (c.cli_nome ILIKE $2 OR c.cli_fantasia ILIKE $2 OR c.cli_email ILIKE $2 OR c.cli_cidade ILIKE $2 OR c.cli_uf ILIKE $2)`;
            params.push(`%${search}%`);
        }
        query += ' ORDER BY c.cli_nome';
        const result = await pool.query(query, params);
        return result.rows;
    }

    async function getClientsByProspecting(pool, industriaId, search) {
        if (!industriaId) return [];
        let query = `
            SELECT DISTINCT 
                c.cli_codigo, c.cli_nome, c.cli_fantasia, c.cli_email, c.cli_cidade, c.cli_uf 
            FROM clientes c 
            JOIN indclientes ic ON c.cli_codigo = ic.cli_id
            WHERE ic.cli_indid = $1 
              AND c.cli_email IS NOT NULL AND c.cli_email <> ''
        `;
        const params = [industriaId];
        if (search) {
            query += ` AND (c.cli_nome ILIKE $2 OR c.cli_fantasia ILIKE $2 OR c.cli_email ILIKE $2 OR c.cli_cidade ILIKE $2 OR c.cli_uf ILIKE $2)`;
            params.push(`%${search}%`);
        }
        query += ' ORDER BY c.cli_nome';
        const result = await pool.query(query, params);
        return result.rows;
    }

    // 3. Filter: All Active Contacts (Keep legacy for now)
    router.get('/clients/all', async (req, res) => {
        try {
            const data = await getClientsAll(pool, req.query.search);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 4. Filter: Area de Atuacao (Keep legacy for now)
    router.post('/clients/atuacao', async (req, res) => {
        try {
            const data = await getClientsByAtuacao(pool, req.body.atuacaoIds);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 5. Filter: Birthdays
    router.get('/clients/birthdays', async (req, res) => {
        try {
            const data = await getClientsByBirthdays(pool, req.query.start, req.query.end);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 6. Filter: Por Industria (History)
    router.get('/clients/industria', async (req, res) => {
        try {
            const data = await getClientsByIndustria(pool, req.query.industriaId);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 7. Filter: Prospeccao 
    router.get('/clients/prospect', async (req, res) => {
        try {
            const data = await getClientsByProspecting(pool, req.query.industriaId);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 7. Bulk Send
    router.post('/send-bulk', async (req, res) => {
        const { recipients, bccRecipients, subject, message, attachments, isMass, userId } = req.body;

        try {
            // Fetch SMTP settings
            const paramsResult = await pool.query('SELECT * FROM parametros WHERE par_usuario = $1', [userId || 1]);
            if (paramsResult.rows.length === 0) throw new Error('SMTP config not found');
            const config = paramsResult.rows[0];

            const transporter = createTransporter(config);

            const mailOptions = {
                from: `"${config.par_sisuser || 'SalesMasters'}" <${config.par_email}>`,
                to: (recipients || []).join(', '),
                bcc: (bccRecipients || []).join(', '),
                subject: subject,
                text: message, // Or HTML
                html: message.replace(/\n/g, '<br>'),
                attachments: (attachments || []).map(att => ({
                    filename: att.filename,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.contentType || 'application/octet-stream'
                }))
            };

            await sendMail(transporter, mailOptions);

            res.json({ success: true, message: `${recipients.length} e-mails processados.` });
        } catch (error) {
            console.error('❌ [BULK_SEND] Erro:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
