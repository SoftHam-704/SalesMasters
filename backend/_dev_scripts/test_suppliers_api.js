async function testApi() {
    try {
        console.log('Fetching from http://localhost:3001/api/suppliers ...');
        const res = await fetch('http://localhost:3001/api/suppliers');
        if (!res.ok) {
            console.error('Status:', res.status, res.statusText);
            const txt = await res.text();
            console.error('Body:', txt);
            return;
        }
        const data = await res.json();
        console.log('TYPE:', typeof data);
        console.log('DATA:', JSON.stringify(data).substring(0, 500)); // Log first 500 chars
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testApi();
