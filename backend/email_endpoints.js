const express = require('express');
const { createTransporter, sendMail } = require('./utils/mailer');

module.exports = function (app, pool) {
    const router = express.Router();

    /**
     * POST /api/email/send-order
     * Sends an order email with attachments
     */
    router.post('/send-order', async (req, res) => {
        console.log('📧 [EMAIL] Request to send order email received');
        try {
            const { recipients, subject, text, attachments, userId } = req.body;

            if (!recipients || recipients.length === 0) {
                return res.status(400).json({ success: false, message: 'Nenhum destinatário informado' });
            }

            // 1. Fetch SMTP params for the user
            const paramsQuery = 'SELECT * FROM parametros WHERE par_usuario = $1';
            const paramsResult = await pool.query(paramsQuery, [userId || 1]);

            if (paramsResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Configurações de e-mail não encontradas para este usuário' });
            }

            const config = paramsResult.rows[0];

            // 2. Create Transporter
            const hasPassword = !!config.par_emailpassword;
            const effectiveUser = config.par_emailuser || config.par_email;
            console.log(`📧 [EMAIL] SMTP Config: host=${config.par_emailserver}, port=${config.par_emailporta}, ssl=${config.par_emailssl}, user=${effectiveUser}, hasPass=${hasPassword}`);

            if (!hasPassword) {
                console.warn('⚠️ [EMAIL] Senha de e-mail não encontrada nos parâmetros do usuário!');
            }

            const transporter = createTransporter(config);

            // 2.2 Fetch Company Name for Branding
            let companyName = 'SalesMasters';
            try {
                const companyResult = await pool.query('SELECT emp_nome FROM empresa_status WHERE emp_id = 1');
                if (companyResult.rows.length > 0 && companyResult.rows[0].emp_nome) {
                    companyName = companyResult.rows[0].emp_nome.trim();
                }
            } catch (companyError) {
                console.warn('⚠️ [EMAIL] Erro ao buscar nome da empresa:', companyError.message);
            }

            const senderName = config.par_sisuser || companyName;

            // 2.5 Verify SMTP Connection before sending
            try {
                await transporter.verify();
                console.log('✅ [EMAIL] SMTP connection verified successfully');
            } catch (verifyError) {
                console.error('❌ [EMAIL] SMTP verification failed:', verifyError.message);
                return res.status(500).json({
                    success: false,
                    message: `Falha na conexão SMTP: ${verifyError.message}. Verifique as configurações de e-mail (servidor: ${config.par_emailserver}, porta: ${config.par_emailporta}).`
                });
            }

            // 3. Prepare Email Options
            const mailOptions = {
                from: `"${senderName}" <${config.par_email}>`,
                to: recipients.join(', '),
                subject: subject,
                text: text,
                attachments: (attachments || []).map(att => ({
                    filename: att.filename,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.contentType || 'application/octet-stream'
                }))
            };

            // Add CC or email alternativo if configured
            if (config.par_emailalternativo) {
                mailOptions.bcc = config.par_emailalternativo;
            }

            // 4. Send Email
            const info = await sendMail(transporter, mailOptions);
            console.log('✅ [EMAIL] Email sent successfully:', info.messageId);

            res.json({
                success: true,
                message: 'E-mail enviado com sucesso',
                messageId: info.messageId
            });

        } catch (error) {
            console.error('❌ [EMAIL] Error sending email:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao enviar e-mail: ${error.message}`
            });
        }
    });

    /**
     * POST /api/email/test-connection
     * Tests SMTP settings without sending an email
     */
    router.post('/test-connection', async (req, res) => {
        console.log('📧 [EMAIL] Request to test SMTP connection received');
        try {
            const config = req.body;

            if (!config || !config.par_emailserver || !config.par_email) {
                console.warn('⚠️ [EMAIL] Test Connection: Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'Servidor e e-mail são obrigatórios para o teste'
                });
            }

            console.log(`📡 [EMAIL] Testing connection to ${config.par_emailserver}:${config.par_emailporta || 587}`);

            const transporter = createTransporter(config);

            // Timeout safety
            const verifyPromise = transporter.verify();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout na conexão SMTP (15s)')), 15000)
            );

            await Promise.race([verifyPromise, timeoutPromise]);

            console.log('✅ [EMAIL] SMTP Test successful');
            return res.json({
                success: true,
                message: 'Conexão SMTP estabelecida com sucesso! Credenciais aceitas.'
            });

        } catch (error) {
            console.error('❌ [EMAIL] SMTP Test failed:', error);

            let userMessage = `Falha na conexão: ${error.message}`;

            if (error.code === 'EAUTH') {
                userMessage = 'Erro de Autenticação: Usuário ou senha do e-mail estão incorretos.';
            } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.message.includes('Timeout')) {
                userMessage = 'Erro de Conexão: Não foi possível alcançar o servidor SMTP ou o tempo expirou. Verifique o endereço, a porta e as opções de SSL/TLS.';
            } else if (error.code === 'EENVELOPE') {
                userMessage = 'Erro de Configuração: O e-mail informado parece inválido.';
            } else if (error.message.includes('ECONNREFUSED')) {
                userMessage = 'Erro de Conexão: O servidor recusou a conexão. Verifique se a porta está correta.';
            }

            return res.status(500).json({
                success: false,
                message: userMessage,
                details: error.message,
                code: error.code || 'UNKNOWN'
            });
        }
    });

    app.use('/api/email', router);
};
