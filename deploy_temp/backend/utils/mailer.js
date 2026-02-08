const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter based on user parameters
 * @param {Object} config - SMTP configuration from parameters table
 */
const createTransporter = (config) => {
    return nodemailer.createTransport({
        host: config.par_emailserver,
        port: config.par_emailporta || 587,
        secure: config.par_emailssl === 'S', // true for 465, false for other ports
        auth: {
            user: config.par_emailuser,
            pass: config.par_emailpassword,
        },
        tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: false
        }
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
