const multer = require('multer');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const { getWorkingProvider } = require('./utils/ai_providers');

console.log('✅ [IA MODULE] ia_order_endpoints.js LOADED!');

// Configure upload storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/smart';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = function (app, pool) {

    console.log('✅ [SMART MODULE] registering /api/smart-order/upload route...');

    app.post('/api/smart-order/upload', upload.single('file'), async (req, res) => {
        console.log('🔥 [SMART ORDER] ROUTE HIT! Request received.');
        try {
            if (!req.file) {
                console.error('❌ [IA ORDER] No file in request');
                return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
            }

            const filePath = req.file.path;
            const fileExt = path.extname(req.file.originalname).toLowerCase();
            const mimeType = req.file.mimetype;

            console.log(`🤖 [IA ORDER] Processing file: ${req.file.originalname} (${fileExt})`);

            // Get AI provider (with automatic fallback)
            let aiProvider;
            try {
                aiProvider = await getWorkingProvider();
                console.log(`🎯 [IA ORDER] Using provider: ${aiProvider.name}`);
            } catch (error) {
                throw new Error(`Nenhum provider de IA disponível. Verifique configuração de API keys: ${error.message}`);
            }

            let extractedItems = [];

            if (fileExt === '.xlsx' || fileExt === '.xls') {
                // EXCEL: Convert to string and process with AI
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

                console.log(`📊 [IA DEBUG] Excel extracted ${jsonData.length} rows.`);

                // Convert array of arrays to detailed string
                const dataString = jsonData.map(row => row.join(" | ")).join("\n");

                console.log(`📊 [IA DEBUG] Excel Data Preview:\n${dataString.substring(0, 200)}...`);

                // Process with AI provider
                console.log(`🤖 [IA ORDER] Sending Excel data to ${aiProvider.name}...`);
                extractedItems = await aiProvider.processExcel(dataString);

            } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(fileExt)) {
                // IMAGE: Process with AI vision
                console.log(`🤖 [IA ORDER] Sending image to ${aiProvider.name} Vision...`);
                extractedItems = await aiProvider.processImage(filePath, mimeType);

            } else {
                throw new Error("Formato de arquivo não suportado. Use Excel (.xlsx, .xls) ou Imagem (.png, .jpg, .jpeg, .webp)");
            }

            console.log(`🤖 [IA ORDER] ${aiProvider.name} extracted ${extractedItems.length} items`);

            // Clean up file
            try {
                fs.unlinkSync(filePath);
            } catch (err) { console.error('Error deleting temp file:', err); }

            // Post-process items: Normalize codes but DO NOT filter by DB (Frontend will validate against MemTable)
            const processedItems = extractedItems.map(item => {
                // Normalize function: remove special chars, spaces, uppercase
                const normalize = (str) => String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

                return {
                    codigo: normalize(item.codigo),
                    originalCode: item.codigo,
                    quantidade: parseFloat(item.quantidade) || 1,
                    descricao: item.descricao || 'Item importado via IA',
                };
            });

            res.json({
                success: true,
                message: `Arquivo processado! ${processedItems.length} itens sugeridos.`,
                data: processedItems
            });

        } catch (error) {
            console.error('❌ [SMART ORDER] Error processing file:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao processar arquivo: ${error.message}`
            });
        }
    });
};
