const fetch = require('node-fetch');

async function seed() {
    try {
        console.log('Triggering CRM seed...');
        const res = await fetch('http://localhost:3005/api/crm/seed', { method: 'POST' });
        const data = await res.json();
        console.log('Seed result:', data);
    } catch (e) {
        console.error('Error seeding:', e);
    }
}

seed();
