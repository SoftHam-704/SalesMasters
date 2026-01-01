const axios = require('axios');

module.exports = function (app) {
    const BI_ENGINE_URL = process.env.BI_ENGINE_URL || 'http://localhost:8000';

    console.log(`📡 [NARRATIVES] Bridge initialized. BI Engine: ${BI_ENGINE_URL}`);

    // Bridge for SmartInsights.jsx
    const endpoints = ['oportunidades', 'alerts', 'highlights', 'risks', 'executive-summary'];

    endpoints.forEach(endpoint => {
        app.get(`/api/narratives/${endpoint}`, async (req, res) => {
            const { industryId } = req.query;
            if (!industryId) {
                return res.status(400).json({ success: false, message: 'industryId query param required' });
            }

            try {
                // Forward request to BI Engine (Python)
                const response = await axios.get(`${BI_ENGINE_URL}/api/narratives/${endpoint}`, {
                    params: { industryId }
                });

                res.json(response.data);
            } catch (error) {
                console.error(`❌ [NARRATIVES] Error fetching ${endpoint} from BI Engine:`, error.message);
                res.status(500).json({
                    success: false,
                    message: `Erro ao buscar insights: ${error.message}`,
                    detail: error.response?.data || null
                });
            }
        });
    });

    // Legacy support or specific v2.0 consolidated endpoint
    app.get('/api/narratives/v2/:industryId', async (req, res) => {
        const { industryId } = req.params;
        try {
            const response = await axios.get(`${BI_ENGINE_URL}/api/narratives/executive-summary`, {
                params: { industryId }
            });
            res.json(response.data);
        } catch (error) {
            console.error('❌ [NARRATIVES] Error fetching executive summary:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};
