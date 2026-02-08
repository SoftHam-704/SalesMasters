const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar contatos de um cliente específico
    router.get('/cli-aniv/list/:clientId', async (req, res) => {
        try {
            const { clientId } = req.params;
            const query = `
                SELECT * FROM cli_aniv 
                WHERE ani_cliente = $1 
                ORDER BY ani_nome
            `;
            const result = await pool.query(query, [clientId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CLI_ANIV] Erro ao listar contatos:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Listar aniversariantes do mês (Suporta /birthdays e /birthdays/month)
    const getBirthdays = async (req, res) => {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const query = `
                SELECT 
                    a.*,
                    c.cli_nome, c.cli_fantasia
                FROM cli_aniv a
                JOIN clientes c ON CAST(a.ani_cliente AS TEXT) = CAST(c.cli_codigo AS TEXT)
                WHERE a.ani_mes = $1
                ORDER BY a.ani_diaaniv ASC
            `;
            const result = await pool.query(query, [currentMonth]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CLI_ANIV] Erro ao buscar aniversariantes:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    router.get('/cli-aniv/birthdays', getBirthdays);
    router.get('/cli-aniv/birthdays/month', getBirthdays);

    // GET - Buscar comprador de um cliente (Usado no Mobile)
    router.get('/cli-aniv/buyer/:clientCode', async (req, res) => {
        try {
            const { clientCode } = req.params;
            const query = `
                SELECT * FROM cli_aniv 
                WHERE ani_cliente = $1 
                AND UPPER(ani_funcao) LIKE '%COMPRA%'
                LIMIT 1
            `;
            const result = await pool.query(query, [clientCode]);
            res.json({
                success: true,
                data: result.rows[0] || null
            });
        } catch (error) {
            console.error('❌ [CLI_ANIV] Erro ao buscar comprador:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * POST /api/cli-aniv/save
     * Salva ou atualiza um contato na tabela CLI_ANIV
     */
    router.post('/cli-aniv/save', async (req, res) => {
        try {
            const {
                ani_codigo, ani_cliente, ani_nome, ani_funcao,
                ani_email, ani_fone, ani_diaaniv, ani_mes,
                ani_time, ani_timequetorce,
                ani_esporte, ani_esportepreferido,
                ani_hobby, ani_obs, gid
            } = req.body;

            // 1. Business Logic Normalization (V3.2 - Regex Smart Parser)
            const final_nome = (ani_nome || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
            const final_funcao = (ani_funcao || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

            // Raw Observation to check for embedded lifestyle data
            const obs_content = ani_obs || req.body.obs || '';

            // Lifestyle fields mapping with Regex Parser (for Mobile compatibility)
            // Some mobile versions send everything inside ani_obs correctly formatted but not in separate keys
            let extracted_time = '';
            let extracted_esporte = '';
            let extracted_hobby = '';

            if (obs_content) {
                // Regex to find patterns like "Time: Flamengo", "Esporte: Tenis", etc.
                // Works even inside [Estilo de Vida: ...] blocks
                const timeMatch = obs_content.match(/(?:Time|Time que torce):\s*([^|\]\n]+)/i);
                const esporteMatch = obs_content.match(/(?:Esporte|Esporte Preferido):\s*([^|\]\n]+)/i);
                const hobbyMatch = obs_content.match(/(?:Hobby):\s*([^|\]\n]+)/i);

                if (timeMatch) extracted_time = timeMatch[1].trim();
                if (esporteMatch) extracted_esporte = esporteMatch[1].trim();
                if (hobbyMatch) extracted_hobby = hobbyMatch[1].trim();

                if (extracted_time || extracted_esporte || extracted_hobby) {
                    console.log(`🧠 [SMART_PARSER] Extracted from obs -> Time: ${extracted_time} | Esporte: ${extracted_esporte} | Hobby: ${extracted_hobby}`);
                }
            }

            // Diagnostic Log: Let's see EXACTLY what the mobile is sending
            console.log(`🔍 [DEBUG_PAYLOAD] Keys received: ${Object.keys(req.body).join(', ')}`);
            if (Object.keys(req.body).length > 0) {
                console.log(`📦 [FULL_BODY]:`, JSON.stringify(req.body));
            }

            // Lifestyle fields mapping with many possible keys
            const raw_time = ani_timequetorce || ani_time || req.body.timequetorce || req.body.time || extracted_time || '';
            const raw_esporte = ani_esportepreferido || ani_esporte || req.body.esportepreferido || req.body.esporte || extracted_esporte || '';
            const raw_hobby = ani_hobby || req.body.hobby || extracted_hobby || '';

            const final_time = String(raw_time).trim();
            const final_esporte = String(raw_esporte).trim();
            const final_hobby = String(raw_hobby).trim();
            const final_obs = obs_content.trim();
            const final_gid = (gid || req.body.gid || '').trim();

            if (!ani_cliente || !final_nome) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente e Nome são obrigatórios.'
                });
            }

            // 2. Birthday Logic
            let niverDate = null;
            const parsedDia = parseInt(ani_diaaniv || req.body.diaaniv);
            const parsedMes = parseInt(ani_mes || req.body.mesaniv);
            if (!isNaN(parsedDia) && !isNaN(parsedMes)) {
                const day = String(parsedDia).padStart(2, '0');
                const month = String(parsedMes).padStart(2, '0');
                niverDate = `2001-${month}-${day}`;
            }

            // 3. ID Generation (ani_lancto)
            const maxResult = await pool.query('SELECT MAX(ani_lancto) as max_id FROM cli_aniv');
            const nextId = (maxResult.rows[0].max_id || 0) + 1;

            console.log(`💾 [SAVE_V3.2] Cliente:${ani_cliente} | Nome:${final_nome} | Time:${final_time}`);

            // 4. Robust UPSERT Query
            const query = `
                INSERT INTO cli_aniv (
                    ani_lancto, ani_cliente, ani_nome, ani_funcao, 
                    ani_email, ani_fone, ani_diaaniv, ani_mes, 
                    ani_niver, ani_timequetorce, ani_esportepreferido, 
                    ani_hobby, ani_obs, gid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (ani_cliente, ani_nome, ani_funcao) 
                DO UPDATE SET
                    ani_email = COALESCE(EXCLUDED.ani_email, cli_aniv.ani_email),
                    ani_fone = COALESCE(EXCLUDED.ani_fone, cli_aniv.ani_fone),
                    ani_diaaniv = COALESCE(EXCLUDED.ani_diaaniv, cli_aniv.ani_diaaniv),
                    ani_mes = COALESCE(EXCLUDED.ani_mes, cli_aniv.ani_mes),
                    ani_niver = COALESCE(EXCLUDED.ani_niver, cli_aniv.ani_niver),
                    ani_timequetorce = COALESCE(NULLIF(EXCLUDED.ani_timequetorce, ''), cli_aniv.ani_timequetorce),
                    ani_esportepreferido = COALESCE(NULLIF(EXCLUDED.ani_esportepreferido, ''), cli_aniv.ani_esportepreferido),
                    ani_hobby = COALESCE(NULLIF(EXCLUDED.ani_hobby, ''), cli_aniv.ani_hobby),
                    ani_obs = COALESCE(NULLIF(EXCLUDED.ani_obs, ''), cli_aniv.ani_obs),
                    gid = COALESCE(NULLIF(EXCLUDED.gid, ''), cli_aniv.gid)
                RETURNING *
            `;

            const finalParams = [
                nextId,
                parseInt(ani_cliente),
                final_nome,
                final_funcao,
                ani_email || null,
                ani_fone || null,
                !isNaN(parsedDia) ? parsedDia : null,
                !isNaN(parsedMes) ? parsedMes : null,
                niverDate,
                final_time || null,
                final_esporte || null,
                final_hobby || null,
                final_obs || null,
                final_gid || null
            ];

            const result = await pool.query(query, finalParams);

            res.json({
                success: true,
                message: 'Contato salvo com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('❌ [SAVE_ERROR] Details:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
};
