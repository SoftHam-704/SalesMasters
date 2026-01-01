const axios = require('axios');

async function test() {
    try {
        console.log('Testing Normal Route...');
        const res1 = await axios.get('http://localhost:3005/api/suppliers');
        console.log('Normal Route Count:', res1.data.data.length);


        console.log('Testing V2 Route...');
        try {
            const res2 = await axios.get('http://localhost:3005/api/suppliers_v2');
            console.log('V2 Route Count:', res2.data.data.length);
        } catch (e) {
            console.log('V2 Failed:', e.message);
        }

        console.log('Testing V3 Route...');
        try {
            const res3 = await axios.get('http://localhost:3005/api/suppliers_v3');
            console.log('V3 Response:', res3.data.message);
        } catch (e) {
            console.log('V3 Failed:', e.message);
        }

        if (res2.data.data.length > 20) {
            console.log('SUCCESS: V2 Route found all records!');
            const viemar = res2.data.data.find(d => d.nomeReduzido === 'VIEMAR' || d.for_nomered === 'VIEMAR');
            console.log('VIEMAR found?', !!viemar);
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Status:', e.response.status);
    }
}
test();
