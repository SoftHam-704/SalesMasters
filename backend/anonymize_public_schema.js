require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const AMERICAN_NAMES = [
    "James Smith", "Michael Smith", "Robert Smith", "Maria Garcia", "David Smith",
    "Maria Rodriguez", "Mary Smith", "Maria Hernandez", "Maria Martinez", "James Johnson",
    "Gabriela Roberts", "Christopher Muller", "Thomas Anderson", "Daniel Taylor",
    "Sarah Thomas", "Charles Moore", "Emma Jackson", "Brian Martin", "Christopher Lee",
    "George Thompson", "Matthew White", "Joseph Lopez", "Patricia Sanchez", "Edward Clark",
    "Susan Robinson", "Jessica Lewis", "Sarah Lee", "Karen Walker", "Lisa Hall",
    "Nancy Allen", "Betty Young", "Margaret Hernandez", "Sandra King", "Ashley Wright",
    "Kimberly Lopez", "Emily Hill", "Donna Scott", "Michelle Green", "Dorothy Adams",
    "Carol Baker", "Amanda Gonzalez", "Melissa Nelson", "Deborah Carter", "Stephanie Mitchell",
    "Rebecca Perez", "Sharon Roberts", "Laura Turner", "Cynthia Phillips", "Elizabeth Campbell",
    "Jennifer Parker", "Amy Evans", "Kathleen Edwards", "Angela Collins", "Helen Stewart",
    "Anna Sanchez", "Brenda Morris", "Pamela Rogers", "Nicole Reed", "Samantha Cook",
    "Katherine Morgan", "Christine Bell", "Debra Murphy", "Rachel Bailey", "Carolyn Rivera",
    "Janet Cooper", "Virginia Richardson", "Catherine Cox", "Heather Howard", "Diane Ward",
    "Julie Torres", "Joyce Peterson", "Victoria Gray", "Olivia Ramirez", "Kelly James",
    "Christina Watson", "Lauren Brooks", "Joan Kelly", "Evelyn Sanders", "Judith Price",
    "Megan Bennett", "Cheryl Wood", "Andrea Barnes", "Hannah Ross", "Martha Henderson",
    "Jacqueline Coleman", "Frances Jenkins", "Gloria Perry", "Ann Powell", "Teresa Long",
    "Kathryn Patterson", "Sara Hughes", "Janice Flores", "Jean Washington", "Alice Butler",
    "Madison Simmons", "Doris Foster", "Julia Gonzales", "Grace Bryant", "Judy Alexander"
];

const AMERICAN_COMPANIES = [
    { name: "General Electric", short: "GE" },
    { name: "Ford Motor Company", short: "Ford" },
    { name: "Microsoft Corporation", short: "Microsoft" },
    { name: "Apple Inc.", short: "Apple" },
    { name: "Google LLC", short: "Google" },
    { name: "The Coca-Cola Company", short: "Coca-Cola" },
    { name: "Walmart Inc.", short: "Walmart" },
    { name: "Exxon Mobil Corporation", short: "ExxonMobil" },
    { name: "Chevron Corporation", short: "Chevron" },
    { name: "Berkshire Hathaway", short: "Berkshire" },
    { name: "Amazon.com Inc.", short: "Amazon" },
    { name: "UnitedHealth Group", short: "UnitedHealth" },
    { name: "Johnson & Johnson", short: "J&J" },
    { name: "JPMorgan Chase & Co.", short: "JPMorgan" },
    { name: "Procter & Gamble", short: "P&G" },
    { name: "Intel Corporation", short: "Intel" },
    { name: "Verizon Communications", short: "Verizon" },
    { name: "AT&T Inc.", short: "AT&T" },
    { name: "Home Depot", short: "Home Depot" },
    { name: "Pfizer Inc.", short: "Pfizer" },
    { name: "Boeing Company", short: "Boeing" },
    { name: "Merck & Co.", short: "Merck" },
    { name: "Comcast Corporation", short: "Comcast" },
    { name: "PepsiCo Inc.", short: "PepsiCo" },
    { name: "Bank of America", short: "BoA" },
    { name: "Wells Fargo", short: "Wells Fargo" },
    { name: "Citigroup", short: "Citi" },
    { name: "Cisco Systems", short: "Cisco" },
    { name: "Oracle Corporation", short: "Oracle" },
    { name: "IBM", short: "IBM" },
    { name: "Nike Inc.", short: "Nike" },
    { name: "McDonald's", short: "McDonald's" },
    { name: "Walt Disney Company", short: "Disney" },
    { name: "3M Company", short: "3M" },
    { name: "Abbott Laboratories", short: "Abbott" },
    { name: "Tesla Inc.", short: "Tesla" },
    { name: "Goldman Sachs", short: "Goldman" },
    { name: "Morgan Stanley", short: "Morgan Stanley" },
    { name: "Caterpillar Inc.", short: "Caterpillar" },
    { name: "Lockheed Martin", short: "Lockheed" },
    { name: "Visa Inc.", short: "Visa" },
    { name: "Mastercard", short: "Mastercard" },
    { name: "Honeywell", short: "Honeywell" },
    { name: "Union Pacific", short: "Union Pacific" },
    { name: "United Parcel Service", short: "UPS" },
    { name: "Starbucks", short: "Starbucks" },
    { name: "Bristol-Myers Squibb", short: "BMS" },
    { name: "Amgen Inc.", short: "Amgen" },
    { name: "Salesforce", short: "Salesforce" },
    { name: "NVIDIA", short: "NVIDIA" }
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function anonymizePublicSchema() {
    console.log(`\n🚀 INICIANDO ANONIMIZAÇÃO DO SCHEMA PUBLIC EM: ${process.env.DB_HOST} (${process.env.DB_NAME})\n`);

    try {
        // --- VENDEDORES ---
        console.log('🔄 Anonimizando VENDEDORES...');
        const vendedoresRes = await pool.query('SELECT ven_codigo FROM public.vendedores');
        const vendedores = vendedoresRes.rows;

        for (const vend of vendedores) {
            const newName = getRandomItem(AMERICAN_NAMES);
            // Updating ven_nome and optionally ven_email if you want (but user only asked for names)
            // Let's stick to name as requested, but maybe update email to match?
            // User request: "troque os nomes dos vendedores para nomes aleatórios, coloque nomes de pessoas de outros paises como EUA"

            await pool.query('UPDATE public.vendedores SET ven_nome = $1 WHERE ven_codigo = $2', [
                newName,
                vend.ven_codigo
            ]);
            process.stdout.write('.');
        }
        console.log(`\n✅ ${vendedores.length} vendedores atualizados!\n`);

        // --- FORNECEDORES ---
        console.log('🔄 Anonimizando FORNECEDORES (INDUSTRIAS)...');
        const fornecedoresRes = await pool.query('SELECT for_codigo FROM public.fornecedores');
        const fornecedores = fornecedoresRes.rows;

        for (const forn of fornecedores) {
            const company = getRandomItem(AMERICAN_COMPANIES);

            // User request: "nome de industrias americanas e o nome reduzido tambem"
            await pool.query('UPDATE public.fornecedores SET for_nome = $1, for_nomered = $2 WHERE for_codigo = $3', [
                company.name,
                company.short,
                forn.for_codigo
            ]);
            process.stdout.write('.');
        }
        console.log(`\n✅ ${fornecedores.length} fornecedores atualizados!\n`);

        console.log('✨ Operação concluída com sucesso!');

    } catch (error) {
        console.error('❌ ERRO:', error);
    } finally {
        await pool.end();
    }
}

anonymizePublicSchema();
