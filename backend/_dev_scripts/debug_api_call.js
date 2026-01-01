const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3005/api/suppliers');
        console.log('Status:', res.status);
        const data = res.data.data;
        console.log('Count:', data.length);
        console.log('Items:', data.map(d => `${d.for_codigo}: ${d.for_nomered} [${d.for_tipo2}]`).join('\n'));
    } catch (e) {
        console.error(e.message);
    }
}
test();
