const dns = require('dns');

dns.lookup('node254557-salesmaster.sp1.br.saveincloud.net.br', (err, address, family) => {
    console.log('Address:', address);
    console.log('Family: IPv', family);
});
