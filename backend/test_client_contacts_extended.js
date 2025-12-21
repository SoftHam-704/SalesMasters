// const fetch = require('node-fetch'); // Using native fetch in Node 18+

const BASE_URL = 'http://localhost:3001/api';

async function test() {
    try {
        const clientId = 1;

        console.log('--- 1. Create Extended Contact ---');
        const newContact = {
            ani_nome: 'CONTATO EXTENDIDO',
            ani_funcao: 'TESTER',
            ani_fone: '999999',
            ani_email: 'extended@teste.com',
            ani_timequetorce: 'Flamengo',
            ani_esportepreferido: 'Futebol',
            ani_hobby: 'Pesca'
        };
        const createRes = await fetch(`${BASE_URL}/clients/${clientId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact)
        });
        const createJson = await createRes.json();
        console.log('Create Result:', createJson);

        if (!createJson.success) {
            console.error('Failed to create, stopping.');
            return;
        }

        const createdId = createJson.data.ani_lancto;
        console.log('Created ID:', createdId);

        // Verify fields in response
        if (createJson.data.ani_timequetorce !== 'Flamengo') console.error('FAIL: Time not saved');
        else console.log('PASS: Time saved');

        if (createJson.data.ani_hobby !== 'Pesca') console.error('FAIL: Hobby not saved');
        else console.log('PASS: Hobby saved');


        console.log('--- 2. Update Extended Contact ---');
        const updateRes = await fetch(`${BASE_URL}/clients/${clientId}/contacts/${createdId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newContact,
                ani_nome: 'CONTATO EXTENDIDO UPDATED',
                ani_hobby: 'Leitura'
            })
        });
        const updateJson = await updateRes.json();
        console.log('Update Result:', updateJson);

        if (updateJson.data.ani_hobby !== 'Leitura') console.error('FAIL: Hobby update failed');
        else console.log('PASS: Hobby updated');

        console.log('--- 3. Delete Contact ---');
        const deleteRes = await fetch(`${BASE_URL}/clients/${clientId}/contacts/${createdId}`, {
            method: 'DELETE'
        });
        const deleteJson = await deleteRes.json();
        console.log('Delete Result:', deleteJson);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
