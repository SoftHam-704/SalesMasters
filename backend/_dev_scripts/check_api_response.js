const axios = require('axios');

async function check() {
    try {
        // Fetch tables first to get a valid one
        const tablesRes = await axios.get('http://localhost:3005/api/products/tables/35'); // 35 is VIEMAR
        if (tablesRes.data.success && tablesRes.data.data.length > 0) {
            const table = tablesRes.data.data[0].itab_tabela;
            console.log(`Checking table: ${table}`);

            const productsRes = await axios.get(`http://localhost:3005/api/products/35/${encodeURIComponent(table)}`);
            if (productsRes.data.success && productsRes.data.data.length > 0) {
                const product = productsRes.data.data[0];
                console.log('Keys available:', Object.keys(product));
                console.log('Sample data:', product);
            } else {
                console.log('No products found.');
            }
        } else {
            console.log('No tables found.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

check();
