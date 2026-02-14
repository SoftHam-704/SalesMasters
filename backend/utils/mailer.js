const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter based on user parameters
 * @param {Object} config - SMTP configuration from parameters table
 */
const createTransporter = (config) => {
    const port = parseInt(config.par_emailporta) || 587;
    // Port 465 = implicit SSL (always secure), 587/25 = STARTTLS
    // par_emailssl is BOOLEAN in DB, not 'S'/'N'
    const isSecure = port === 465 || config.par_emailssl === true;

    const smtpUser = config.par_emailuser || config.par_email;
    const hasPassword = !!config.par_emailpassword;

    console.log(`📧 [MAILER] Configurando: host=${config.par_emailserver}, port=${port}, secure=${isSecure}, user=${smtpUser}, hasPass=${hasPassword}`);

    return nodemailer.createTransport({
        host: (config.par_emailserver || '').trim(),
        port: port,
        secure: isSecure,
        auth: {
            user: smtpUser.trim(),
            pass: (config.par_emailpassword || '').trim(),
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1'
        },
        connectionTimeout: 10000,  // 10s to connect
        greetingTimeout: 10000,    // 10s to receive greeting
        socketTimeout: 30000,      // 30s for socket inactivity
        debug: false,
        logger: false
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
