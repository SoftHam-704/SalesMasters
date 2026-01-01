async function testApi() {
    try {
        const res = await fetch('http://localhost:3001/api/clients/2/industries');
        console.log(`Status: ${res.status}`);
        const json = await res.json();
        console.log('Response Length JSON:', JSON.stringify(json, null, 2));
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testApi();
