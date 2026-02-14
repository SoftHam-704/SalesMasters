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
                from: `"${config.par_sisuser || 'SalesMasters'}" <${config.par_email}>`,
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

            if (!config.par_emailserver || !config.par_email) {
                return res.status(400).json({ success: false, message: 'Servidor e e-mail são obrigatórios para o teste' });
            }

            const transporter = createTransporter(config);
            await transporter.verify();

            res.json({
                success: true,
                message: 'Conexão SMTP estabelecida com sucesso! Credenciais aceitas.'
            });

        } catch (error) {
            console.error('❌ [EMAIL] SMTP Test failed:', error.message);
            res.status(500).json({
                success: false,
                message: `Falha na autenticação: ${error.message}`
            });
        }
    });

    app.use('/api/email', router);
};
