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
        res.setHeader('X-SM-Version', '1.2.2-VisionFallback');
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

            let extractedData = { cabecalho: {}, itens: [] };

            console.log(`🤖 [IA ORDER] ${aiProvider.name} extraction START...`);
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
                extractedData = await aiProvider.processExcel(dataString);

            } else if (fileExt === '.csv') {
                // CSV: Read as UTF-8 string directly
                const dataString = fs.readFileSync(filePath, 'utf8');
                console.log(`📊 [IA DEBUG] CSV extracted. Preview:\n${dataString.substring(0, 200)}...`);

                // Process with AI provider using the text endpoint
                console.log(`🤖 [IA ORDER] Sending CSV data to ${aiProvider.name}...`);
                extractedData = await aiProvider.processExcel(dataString);

            } else if (['.png', '.jpg', '.jpeg', '.webp', '.pdf'].includes(fileExt)) {
                if (fileExt === '.pdf') {
                    // PDF: Try text extraction first
                    try {
                        const pdfParse = require('pdf-parse');
                        const dataBuffer = fs.readFileSync(filePath);
                        const pdfData = await pdfParse(dataBuffer);

                        if (pdfData.text && pdfData.text.trim().length > 10) {
                            console.log(`🤖 [IA ORDER] PDF text extracted (${pdfData.text.length} chars). Sending to ${aiProvider.name}...`);
                            extractedData = await aiProvider.processExcel(pdfData.text); // processExcel accepts generic text
                        } else {
                            throw new Error("PDF sem texto extraível (pode ser uma imagem).");
                        }
                    } catch (pdfError) {
                        console.warn(`⚠️ [IA ORDER] PDF text extraction failed: ${pdfError.message}. Falling back to Vision.`);

                        // FALLBACK: Se falhar o parse do texto, tenta processar como IMAGEM (Vision)
                        // Gemini 2.0 suporta PDF no multimodal.
                        try {
                            console.log(`🤖 [IA ORDER] Attempting Vision fallback for PDF...`);
                            extractedData = await aiProvider.processImage(filePath, 'application/pdf');
                        } catch (visionError) {
                            console.error(`❌ [IA ORDER] Vision fallback also failed:`, visionError.message);
                            throw new Error("O PDF parece ser escaneado (imagem) ou está bloqueado e a Visão IA falhou. Por favor, converta para uma imagem (JPG/PNG) ou digite o código.");
                        }
                    }
                } else {
                    // IMAGE: Process with AI vision
                    console.log(`🤖 [IA ORDER] Sending ${fileExt} to ${aiProvider.name} Vision...`);
                    extractedData = await aiProvider.processImage(filePath, mimeType);
                }
            } else {
                throw new Error("Formato de arquivo não suportado. Use Excel/CSV (.xlsx, .xls, .csv), Imagem (.png, .jpg, .jpeg, .webp) ou PDF (.pdf)");
            }

            // Normalize extractedData items to array (sanity check)
            const itemsToProcess = Array.isArray(extractedData.itens) ? extractedData.itens : (Array.isArray(extractedData) ? extractedData : []);
            const cabecalho = extractedData.cabecalho || {};

            console.log(`🤖 [IA ORDER] ${aiProvider.name} extraction DONE. Items found: ${itemsToProcess.length}`);

            // Clean up file
            try {
                fs.unlinkSync(filePath);
            } catch (err) { console.error('Error deleting temp file:', err); }

            // Post-process items: Keep separators (/, |) for frontend to split and test each code
            const processedItems = itemsToProcess.map(item => {
                // Preserve slashes, pipes, spaces for splitting - only uppercase
                const preserveForSplit = (str) => String(str || '').toUpperCase();

                return {
                    codigo: preserveForSplit(item.codigo), // Keep "ABC-7829 / XPR-451 / 34-069"
                    originalCode: item.codigo,
                    quantidade: parseFloat(item.quantidade) || 1,
                    descricao: item.descricao || 'Item importado via IA',
                    preco: parseFloat(item.preco) || 0
                };
            });

            res.json({
                success: true,
                message: `Arquivo processado! ${processedItems.length} itens sugeridos.`,
                data: processedItems,
                cabecalho: cabecalho
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
