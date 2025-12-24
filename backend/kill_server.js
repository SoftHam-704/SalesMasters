
const { exec } = require('child_process');

exec('wmic process where "commandline like \'%server.js%\'" get processid', (err, stdout, stderr) => {
    if (err) {
        console.error('Error finding process:', err);
        return;
    }
    const lines = stdout.split('\n');
    const pid = lines[1]?.trim();
    if (pid) {
        console.log(`Killing PID: ${pid}`);
        exec(`taskkill /F /PID ${pid}`, (kerr, kout, kerrrout) => {
            if (kerr) console.error('Error killing:', kerr);
            else console.log('Process killed.');
        });
    } else {
        console.log('No server.js process found.');
    }
});
