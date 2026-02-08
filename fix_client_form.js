const fs = require('fs');
const filePath = 'e:/Sistemas_ia/SalesMasters/frontend/src/components/forms/ClientForm.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// We want to remove lines 532 to 939 (1-based index from 'view_file').
// In 0-based index array: index 531 to 938. 
// Let's verify content to be sure.

const startLineIndex = 531; // Line 532
const endLineIndex = 939;   // Line 940 (This is the comment I want to keep? No, 940 is empty line?)

// In Step 1346: 
// 939: </div>
// 940: (Empty)
// 941: /* Coluna Principal ... */

// In Step 1343:
// 531: (Empty)
// 532: /* Painel I ... */

// So let's delete from index 531 (Line 532) up to index 938 (Line 939).
// Wait, if I delete 532-939.
// line 532 is index 531.
// line 939 is index 938.
// So splice(531, 939 - 532 + 1).

// Let's print the lines to be deleted to log first just to be super safe.
console.log("Line 532:", lines[531]);
console.log("Line 939:", lines[938]);
console.log("Line 940:", lines[939]);
console.log("Line 941:", lines[940]);

// If correct:
// lines.splice(531, 938 - 531 + 1);

// Actually, I'll searching for the specific marker strings to be robust against line shifts.
const startMarker = "{/* Painel I - Identificação Comercial */}";
const endMarker = "{/* Coluna Principal - Sistema de Abas Unificado */}";

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startMarker)) {
        startIdx = i;
        break; // Find the first occurrence (the legacy one)
    }
}

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(endMarker)) {
        endIdx = i;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    console.log(`Found start at ${startIdx + 1} and end at ${endIdx + 1}`);
    // We want to delete from startIdx up to endIdx - 1.
    // endIdx is header for new section, so keep it.

    // Also check if we found the *correct* start.
    // The legacy one is around 532.
    // The new one might be inside tabs? No, the new one IS the tabs (starts at 940).
    // Wait, 940 is the comment. 

    // So we delete from startIdx to endIdx - 1.

    lines.splice(startIdx, endIdx - startIdx);

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log("File updated successfully.");
} else {
    console.log("Markers not found.");
}
