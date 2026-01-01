// PDF Save Endpoints Module
const fs = require('fs');
const path = require('path');

module.exports = function (app, pool) {

    // POST - Save PDF to industry folder
    app.post('/api/orders/save-pdf', async (req, res) => {
        console.log('📄 [SAVE-PDF] Request received');
        try {
            const { pdfBase64, orderNumber, clientName, industryName } = req.body;

            if (!pdfBase64 || !orderNumber || !clientName || !industryName) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: pdfBase64, orderNumber, clientName, industryName'
                });
            }

            // Get pastaBasica from company config
            const companyResult = await pool.query('SELECT emp_pastabasica FROM empresa_status WHERE emp_id = 1');
            let pastaBasica = 'C:\\SalesMasters\\'; // Default

            if (companyResult.rows.length > 0 && companyResult.rows[0].emp_pastabasica) {
                pastaBasica = companyResult.rows[0].emp_pastabasica;
            }

            // Ensure pastaBasica ends with path separator
            if (!pastaBasica.endsWith('\\') && !pastaBasica.endsWith('/')) {
                pastaBasica += '\\';
            }

            // Build folder path: {pastaBasica}/Pedidos/{industryName}/
            const sanitizedIndustryName = industryName.replace(/[<>:"/\\|?*]/g, '_').trim().toUpperCase();
            const folderPath = path.join(pastaBasica, 'Pedidos', sanitizedIndustryName);

            // Create folder structure if it doesn't exist
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`📁 [SAVE-PDF] Created folder: ${folderPath}`);
            }

            // Build filename: {orderNumber}-{clientName}.pdf
            const sanitizedClientName = clientName.replace(/[<>:"/\\|?*]/g, '_').trim().toUpperCase();
            const fileName = `${orderNumber}-${sanitizedClientName}.pdf`;
            const filePath = path.join(folderPath, fileName);

            // Decode base64 and save to file
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            fs.writeFileSync(filePath, pdfBuffer);

            console.log(`✅ [SAVE-PDF] PDF saved: ${filePath}`);

            res.json({
                success: true,
                message: 'PDF salvo com sucesso',
                filePath: filePath,
                folderPath: folderPath
            });

        } catch (error) {
            console.error('❌ [SAVE-PDF] Error:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao salvar PDF: ${error.message}`
            });
        }
    });

};
