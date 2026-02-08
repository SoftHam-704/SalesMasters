const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('e:/Sistemas_ia/SalesMasters/frontend/src/components/forms/ClientForm.jsx', 'utf8');

try {
    const parser = acorn.Parser.extend(jsx());
    parser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
    console.log("Syntax is valid!");
} catch (e) {
    console.log("Syntax error:", e.message);
    if (e.loc) {
        console.log(`Line: ${e.loc.line}, Column: ${e.loc.column}`);
        // Show context
        const lines = code.split('\n');
        console.log('Context:');
        for (let i = Math.max(0, e.loc.line - 3); i < Math.min(lines.length, e.loc.line + 2); i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
}
