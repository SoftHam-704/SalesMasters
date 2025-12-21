const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const searchTerm = "AGRICOLA"; // from user print

fs.readdir(dataDir, (err, files) => {
    if (err) return console.error(err);

    files.forEach(file => {
        if (path.extname(file) === '.xlsx') {
            try {
                const workbook = XLSX.readFile(path.join(dataDir, file));
                const sheetName = workbook.SheetNames[0]; // Check first sheet
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const found = JSON.stringify(json).includes(searchTerm);
                if (found) {
                    console.log(`MATCH FOUND IN: ${file}`);
                    // Print header to confirm
                    console.log(`Headers: ${JSON.stringify(json[0])}`);
                }
            } catch (e) {
                // ignore
            }
        }
    });
});
