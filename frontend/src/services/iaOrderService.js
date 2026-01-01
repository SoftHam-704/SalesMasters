const API_URL = 'http://localhost:3005/api';

export const iaOrderService = {
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`📡 [IA SERVICE] Fetching to ${API_URL}/ia-order/upload...`);

        try {
            const response = await fetch(`${API_URL}/ia-order/upload`, {
                method: 'POST',
                body: formData,
            });

            console.log("🔙 [IA SERVICE] Fetch status:", response.status);

            // Check if response is OK before parsing JSON
            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `Erro do servidor: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Response is not JSON, maybe HTML error page
                    const textResponse = await response.text();
                    console.error('❌ [IA SERVICE] Non-JSON response:', textResponse.substring(0, 200));
                    errorMessage = `Erro do servidor: ${response.status}`;
                }
                return { success: false, message: errorMessage };
            }

            const data = await response.json();
            console.log("✅ [IA SERVICE] Success! Data:", data);
            return data;
        } catch (error) {
            console.error('❌ [IA SERVICE] Error uploading file:', error);
            return { success: false, message: `Erro ao enviar arquivo: ${error.message}` };
        }
    }
};
