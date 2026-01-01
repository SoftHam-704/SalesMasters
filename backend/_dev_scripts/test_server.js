// Teste direto do endpoint
const { Pool } = require('pg');
const express = require('express');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432,
});

const app = express();

// Carregar o router
const priceTablesRouter = require('./price_tables_endpoints')(pool);
app.use('/api', priceTablesRouter);

// Iniciar servidor de teste
const PORT = 3006;
app.listen(PORT, () => {
    console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
    console.log(`📡 Teste: http://localhost:${PORT}/api/price-tables/12`);
});
