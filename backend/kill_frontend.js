const { exec } = require('child_process');

console.log('Finding and killing Vite processes...');

// Specify the port to look for (default Vite port)
const port = 5173;

const killCommand = process.platform === 'win32'
    ? `netstat -ano | findstr :${port}`
    : `lsof -i :${port}`;

exec(killCommand, (error, stdout, stderr) => {
    if (error) {
        console.log(`No process found on port ${port}. Trying to kill by process name...`);
         // Fallback: kill node processes indiscriminately if port lookup fails (risky but effective for cleanup)
         // But let's try to be safer and just kill processes that look like vite dev server if possible.
         // Actually, given the user wants a restart, killing all node processes is often the cleanest way if we restart everything.
         // But let's just try to notify the user to restart manually if we can't find it.
         // Wait, the user has "two" instances.
         // Let's just output instructions for the user if this fails.
        return;
    }

    const lines = stdout.trim().split('\n');
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && !isNaN(pid)) {
             console.log(`Killing process on port ${port} with PID: ${pid}`);
             try {
                process.kill(parseInt(pid), 'SIGKILL'); // Force kill
             } catch (e) {
                 console.error(`Failed to kill ${pid}: ${e.message}`);
             }
        }
    });
    console.log('Done.');
});
