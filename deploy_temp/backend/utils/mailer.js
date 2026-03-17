const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter based on user parameters
 * @param {Object} config - SMTP configuration from parameters table
 */
const createTransporter = (config) => {
    const port = parseInt(config.par_emailporta) || 587;

    // SSL (Porta 465) vs TLS/STARTTLS (Porta 587)
    // No nodemailer, 'secure: true' é para porta 465 (Implicit SSL/TLS)
    // Para porta 587 o padrão é 'secure: false' e o nodemailer usa STARTTLS automaticamente.
    const isSecure = (port === 465 || config.par_emailssl === true);
    const requireTLS = config.par_emailtls === true;

    const smtpUser = (config.par_emailuser || config.par_email || '').toString().trim();
    const smtpPass = (config.par_emailpassword || '').toString().trim();
    const smtpHost = (config.par_emailserver || '').toString().trim();

    console.log(`📧 [MAILER] Configurando SMTP: host=${smtpHost}, port=${port}, secure=${isSecure}, tls=${requireTLS}, user=${smtpUser}`);

    return nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        requireTLS: requireTLS,
        tls: {
            // NUNCA rejeitar certificados não autorizados em ambientes de produção legados
            rejectUnauthorized: false,
            minVersion: 'TLSv1'
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        debug: process.env.NODE_ENV !== 'production',
        logger: process.env.NODE_ENV !== 'production'
    });
};

/**
 * Sends an email
 * @param {Object} transporter - Nodemailer transporter instance
 * @param {Object} options - Email options (from, to, subject, text, html, attachments)
 */
const sendMail = async (transporter, options) => {
    return await transporter.sendMail(options);
};

module.exports = {
    createTransporter,
    sendMail
};
