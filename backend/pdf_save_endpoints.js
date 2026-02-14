const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function (app, pool) {

    // POST - Save PDF to documents folder
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

            // 1. Detect standard Documents folder
            const homeDir = os.homedir();
            let pastaBasica = path.join(homeDir, 'Documents', 'SalesMasters');

            // Fallback for servers/environments without a 'Documents' folder
            const docsPath = path.join(homeDir, 'Documents');
            if (!fs.existsSync(docsPath)) {
                // If Documents doesn't exist, use a local 'uploads' directory
                pastaBasica = path.join(process.cwd(), 'uploads', 'pedidos');
            }

            // Build folder path: {pastaBasica}/Pedidos/{industryName}/
            const sanitizedIndustryName = industryName.replace(/[<>:"/\\|?*]/g, '_').trim().toUpperCase();
            const folderPath = path.join(pastaBasica, 'Pedidos', sanitizedIndustryName);

            // Create folder structure if it doesn't exist asynchronously
            if (!fs.existsSync(folderPath)) {
                await fs.promises.mkdir(folderPath, { recursive: true });
                console.log(`📁 [SAVE-PDF] Created folder: ${folderPath}`);
            }

            // Build filename: {orderNumber}-{clientName}.pdf
            const sanitizedClientName = clientName.replace(/[<>:"/\\|?*]/g, '_').trim().toUpperCase();
            const fileName = `${orderNumber}-${sanitizedClientName}.pdf`;
            const filePath = path.join(folderPath, fileName);

            // Decode base64 and save to file asynchronously
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            await fs.promises.writeFile(filePath, pdfBuffer);

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
