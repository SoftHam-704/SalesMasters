const https = require('https');

function ping(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        const req = https.get(url, (res) => {
            res.on('data', () => { });
            res.on('end', () => {
                resolve(Date.now() - start);
            });
        });
        req.on('error', (err) => {
            resolve(-1);
        });
        req.end();
    });
}

async function stressTest() {
    const domains = [
        'https://salesmasters.softham.com.br/api/system-info',
        'https://node254557-salesmaster.sp1.br.saveincloud.net.br/api/system-info'
    ];

    for (const testUrl of domains) {
        console.log(`\nTesting Latency for: ${testUrl}`);
        let totalTime = 0;
        let successes = 0;

        for (let i = 1; i <= 5; i++) {
            const duration = await ping(testUrl);
            if (duration > 0) {
                console.log(`  Ping ${i}: ${duration}ms`);
                totalTime += duration;
                successes++;
            } else {
                console.log(`  Ping ${i}: Failed`);
            }
        }

        if (successes > 0) {
            console.log(`  Average Latency: ${(totalTime / successes).toFixed(2)}ms`);
        } else {
            console.log(`  Target unreachable.`);
        }
    }
}

stressTest();
