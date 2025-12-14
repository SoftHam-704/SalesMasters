const express = require('express');
const cors = require('cors');
const Firebird = require('node-firebird');
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'PUT' || req.method === 'POST') {
        console.log('Body:', JSON.stringify(req.body).substring(0, 500));
    }
    next();
});

// PostgreSQL Pool
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

// Test Firebird Connection
app.post('/api/firebird/test', async (req, res) => {
    const { host, port, database, username, password, type } = req.body;

    if (!database || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Campos obrigatórios: database, username, password'
        });
    }

    const connectionString = `${type === 'remote' ? (host || 'localhost') : 'localhost'}/${port || 3050}:${database}`;

    const options = {
        user: username,
        password: password,
        lowercase_keys: false,
        role: null,
        pageSize: 4096
    };

    console.log('Tentando conectar ao Firebird:', {
        connectionString: connectionString,
        user: options.user
    });

    Firebird.attach(connectionString, options, (err, db) => {
        if (err) {
            console.error('Erro ao conectar:', err.message);

            if (err.message.includes('wire encryption')) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro de criptografia. Configure o Firebird para aceitar conexões sem criptografia. No firebird.conf, defina: WireCrypt = Enabled (não Required)'
                });
            }

            return res.status(500).json({
                success: false,
                message: `Erro ao conectar: ${err.message}`
            });
        }

        console.log('Conexão estabelecida com sucesso!');

        db.detach((detachErr) => {
            if (detachErr) {
                console.error('Erro ao desconectar:', detachErr.message);
            }
        });

        res.json({
            success: true,
            message: 'Conexão estabelecida com sucesso!'
        });
    });
});

// Test PostgreSQL Connection
app.post('/api/postgres/test', async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        res.json({
            success: true,
            message: 'Conexão com PostgreSQL estabelecida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao conectar: ${error.message}`
        });
    }
});

// Import Suppliers from CSV
app.post('/api/import/suppliers', async (req, res) => {
    const csvPath = path.join(__dirname, '../data/fornecedores.csv');

    if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
            success: false,
            message: 'Arquivo fornecedores.csv não encontrado em data/'
        });
    }

    const suppliers = [];
    let totalProcessed = 0;
    let totalInserted = 0;
    let errors = [];

    // Ler CSV
    fs.createReadStream(csvPath)
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
            suppliers.push(row);
        })
        .on('end', async () => {
            console.log(`Total de fornecedores no CSV: ${suppliers.length}`);

            // Processar cada fornecedor
            for (const supplier of suppliers) {
                totalProcessed++;

                try {
                    // Inserir diretamente na tabela fornecedores com estrutura original
                    const query = `
            INSERT INTO fornecedores (
              for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
              for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
              for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
              for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
              for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
            ON CONFLICT (for_codigo) DO UPDATE SET
              for_nome = EXCLUDED.for_nome,
              for_endereco = EXCLUDED.for_endereco,
              for_bairro = EXCLUDED.for_bairro,
              for_cidade = EXCLUDED.for_cidade,
              for_uf = EXCLUDED.for_uf,
              for_cep = EXCLUDED.for_cep,
              for_fone = EXCLUDED.for_fone,
              for_fone2 = EXCLUDED.for_fone2,
              for_fax = EXCLUDED.for_fax,
              for_cgc = EXCLUDED.for_cgc,
              for_inscricao = EXCLUDED.for_inscricao,
              for_email = EXCLUDED.for_email,
              for_tipo2 = EXCLUDED.for_tipo2
          `;

                    const values = [
                        parseInt(supplier.FOR_CODIGO) || null,
                        supplier.FOR_NOME || '',
                        supplier.FOR_ENDERECO || '',
                        supplier.FOR_BAIRRO || '',
                        supplier.FOR_CIDADE || '',
                        supplier.FOR_UF || '',
                        supplier.FOR_CEP || '',
                        supplier.FOR_FONE || '',
                        supplier.FOR_FONE2 || '',
                        supplier.FOR_FAX || '',
                        supplier.FOR_CGC || '',
                        supplier.FOR_INSCRICAO || '',
                        supplier.FOR_EMAIL || '',
                        parseInt(supplier.FOR_CODREP) || null,
                        parseFloat(supplier.FOR_PERCOM) || 0,
                        parseFloat(supplier.FOR_DES1) || 0,
                        parseFloat(supplier.FOR_DES2) || 0,
                        parseFloat(supplier.FOR_DES3) || 0,
                        parseFloat(supplier.FOR_DES4) || 0,
                        parseFloat(supplier.FOR_DES5) || 0,
                        parseFloat(supplier.FOR_DES6) || 0,
                        parseFloat(supplier.FOR_DES7) || 0,
                        parseFloat(supplier.FOR_DES8) || 0,
                        parseFloat(supplier.FOR_DES9) || 0,
                        parseFloat(supplier.FOR_DES10) || 0,
                        supplier.FOR_HOMEPAGE || '',
                        supplier.FOR_CONTATOREP || '',
                        supplier.FOR_NOMERED || '',
                        supplier.FOR_TIPO2 || 'A',
                        supplier.FOR_LOCIMAGEM || '',
                        supplier.GID || '',
                        supplier.FOR_TIPOFRETE || ''
                    ];

                    await pool.query(query, values);
                    totalInserted++;

                    console.log(`✓ Importado: ${supplier.FOR_NOME}`);
                } catch (error) {
                    errors.push({
                        supplier: supplier.FOR_NOME,
                        error: error.message
                    });
                    console.error(`✗ Erro ao importar ${supplier.FOR_NOME}:`, error.message);
                }
            }

            // Retornar resultado
            res.json({
                success: true,
                message: 'Importação concluída!',
                stats: {
                    total: suppliers.length,
                    processed: totalProcessed,
                    inserted: totalInserted,
                    errors: errors.length
                },
                errors: errors
            });
        })
        .on('error', (error) => {
            res.status(500).json({
                success: false,
                message: `Erro ao ler CSV: ${error.message}`
            });
        });
});

// Import suppliers from XLSX (melhor para preservar CNPJ)
app.post('/api/import/suppliers-xlsx', async (req, res) => {
    try {
        const xlsxPath = path.join(__dirname, '..', 'data', 'fornecedores.xlsx');

        if (!fs.existsSync(xlsxPath)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo fornecedores.xlsx não encontrado em data/'
            });
        }

        // Ler arquivo Excel
        const workbook = XLSX.readFile(xlsxPath, { cellText: false, cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converter para JSON mantendo strings
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Importante: mantém como string
            defval: ''
        });

        console.log(`Total de fornecedores no XLSX: ${data.length}`);

        let totalProcessed = 0;
        let totalInserted = 0;
        const errors = [];

        for (const row of data) {
            totalProcessed++;

            try {
                const query = `
                    INSERT INTO fornecedores (
                        for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
                        for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
                        for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
                        for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
                        for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
                    ON CONFLICT (for_codigo) DO UPDATE SET
                        for_nome = EXCLUDED.for_nome,
                        for_cgc = EXCLUDED.for_cgc,
                        for_nomered = EXCLUDED.for_nomered,
                        for_tipo2 = EXCLUDED.for_tipo2
                `;

                const values = [
                    parseInt(row.FOR_CODIGO) || 0,
                    row.FOR_NOME || '',
                    row.FOR_ENDERECO || '',
                    row.FOR_BAIRRO || '',
                    row.FOR_CIDADE || '',
                    row.FOR_UF || '',
                    row.FOR_CEP || '',
                    row.FOR_FONE || '',
                    row.FOR_FONE2 || '',
                    row.FOR_FAX || '',
                    String(row.FOR_CGC || ''), // IMPORTANTE: Forçar string
                    row.FOR_INSCRICAO || '',
                    row.FOR_EMAIL || '',
                    parseInt(row.FOR_CODREP) || null,
                    parseFloat(row.FOR_PERCOM) || 0,
                    parseFloat(row.FOR_DES1) || 0,
                    parseFloat(row.FOR_DES2) || 0,
                    parseFloat(row.FOR_DES3) || 0,
                    parseFloat(row.FOR_DES4) || 0,
                    parseFloat(row.FOR_DES5) || 0,
                    parseFloat(row.FOR_DES6) || 0,
                    parseFloat(row.FOR_DES7) || 0,
                    parseFloat(row.FOR_DES8) || 0,
                    parseFloat(row.FOR_DES9) || 0,
                    parseFloat(row.FOR_DES10) || 0,
                    row.FOR_HOMEPAGE || '',
                    row.FOR_CONTATOREP || '',
                    row.FOR_NOMERED || '',
                    row.FOR_TIPO2 || 'A',
                    row.FOR_LOCIMAGEM || '',
                    row.GID || '',
                    row.FOR_TIPOFRETE || ''
                ];

                await pool.query(query, values);
                totalInserted++;
                console.log(`✓ Importado: ${row.FOR_NOME}`);

            } catch (error) {
                console.error(`✗ Erro ao importar ${row.FOR_NOME}:`, error.message);
                errors.push({
                    row: totalProcessed,
                    name: row.FOR_NOME,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Importação concluída!',
            stats: {
                total: data.length,
                processed: totalProcessed,
                inserted: totalInserted,
                errors: errors.length
            },
            errors: errors
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao ler XLSX: ${error.message}`
        });
    }
});

// ==================== CRUD FORNECEDORES ====================

// GET - Listar todos os fornecedores (com filtros)
app.get('/api/suppliers', async (req, res) => {
    try {
        const { search, active, page = 1, limit = 10 } = req.query;

        let query = 'SELECT * FROM fornecedores WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtro de busca
        if (search) {
            query += ` AND (for_nome ILIKE $${paramCount} OR for_cgc ILIKE $${paramCount} OR for_cidade ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Filtro ativo/inativo
        if (active !== undefined) {
            query += ` AND for_tipo2 = $${paramCount}`;
            params.push(active === 'true' ? 'A' : 'I');
            paramCount++;
        }

        // Ordenação
        query += ' ORDER BY for_nome';

        // Paginação
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM fornecedores WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (search) {
            countQuery += ` AND (for_nome ILIKE $${countParamCount} OR for_cgc ILIKE $${countParamCount} OR for_cidade ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
            countParamCount++;
        }

        if (active !== undefined) {
            countQuery += ` AND for_tipo2 = $${countParamCount}`;
            countParams.push(active === 'true' ? 'A' : 'I');
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar fornecedores: ${error.message}`
        });
    }
});

// GET - Buscar fornecedor por ID
app.get('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM fornecedores WHERE for_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar fornecedor: ${error.message}`
        });
    }
});

// POST - Criar novo fornecedor
app.post('/api/suppliers', async (req, res) => {
    try {
        const supplier = req.body;

        const query = `
            INSERT INTO fornecedores (
                for_codigo, for_nome, for_endereco, for_bairro, for_cidade, for_uf, for_cep,
                for_fone, for_fone2, for_fax, for_cgc, for_inscricao, for_email,
                for_codrep, for_percom, for_des1, for_des2, for_des3, for_des4, for_des5,
                for_des6, for_des7, for_des8, for_des9, for_des10, for_homepage,
                for_contatorep, for_nomered, for_tipo2, for_locimagem, gid, for_tipofrete
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
            RETURNING *
        `;

        const values = [
            supplier.for_codigo,
            supplier.for_nome,
            supplier.for_endereco || '',
            supplier.for_bairro || '',
            supplier.for_cidade || '',
            supplier.for_uf || '',
            supplier.for_cep || '',
            supplier.for_fone || '',
            supplier.for_fone2 || '',
            supplier.for_fax || '',
            supplier.for_cgc,
            supplier.for_inscricao || '',
            supplier.for_email || '',
            supplier.for_codrep || null,
            supplier.for_percom || 0,
            supplier.for_des1 || 0,
            supplier.for_des2 || 0,
            supplier.for_des3 || 0,
            supplier.for_des4 || 0,
            supplier.for_des5 || 0,
            supplier.for_des6 || 0,
            supplier.for_des7 || 0,
            supplier.for_des8 || 0,
            supplier.for_des9 || 0,
            supplier.for_des10 || 0,
            supplier.for_homepage || '',
            supplier.for_contatorep || '',
            supplier.for_nomered,
            supplier.for_tipo2 || 'A',
            supplier.for_locimagem || '',
            supplier.gid || '',
            supplier.for_tipofrete || ''
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Fornecedor criado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar fornecedor: ${error.message}`
        });
    }
});

// PUT - Atualizar fornecedor (Chave: CNPJ)
app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params; // We might ignore this if using CNPJ from body, but keeping route same
        const supplier = req.body;

        if (!supplier.for_cgc) {
            return res.status(400).json({ success: false, message: 'CNPJ é obrigatório para atualização' });
        }

        const query = `
            UPDATE fornecedores SET
                for_nome = $1, for_endereco = $2, for_bairro = $3, for_cidade = $4,
                for_uf = $5, for_cep = $6, for_fone = $7, for_fone2 = $8,
                for_fax = $9, for_inscricao = $10, for_email = $11,
                for_tipo2 = $12, for_nomered = $13, for_obs2 = $14
            WHERE for_cgc = $15
            RETURNING *
        `;

        const values = [
            supplier.for_nome,
            supplier.for_endereco || '',
            supplier.for_bairro || '',
            supplier.for_cidade || '',
            supplier.for_uf || '',
            supplier.for_cep || '',
            supplier.for_fone || '',
            supplier.for_fone2 || '',
            supplier.for_fax || '',
            supplier.for_inscricao || '',
            supplier.for_email || '',
            supplier.for_tipo2 || 'A',
            supplier.for_nomered,
            supplier.for_obs2 || '',
            supplier.for_cgc // The Key
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado com este CNPJ'
            });
        }

        res.json({
            success: true,
            message: 'Fornecedor atualizado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Erro UPDATE:", error);
        const fs = require('fs');
        fs.appendFileSync('backend_error.log', `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nValues: ${JSON.stringify(req.body)}\n\n`);

        res.status(500).json({
            success: false,
            message: `Erro ao atualizar fornecedor: ${error.message}`
        });
    }
});

// DELETE - Excluir fornecedor
app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM fornecedores WHERE for_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Fornecedor excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir fornecedor: ${error.message}`
        });
    }
});

// PATCH - Alternar status ativo/inativo
app.patch('/api/suppliers/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE fornecedores 
            SET for_tipo2 = CASE WHEN for_tipo2 = 'A' THEN 'I' ELSE 'A' END
            WHERE for_codigo = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fornecedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Status alterado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao alternar status: ${error.message}`
        });
    }
});

// ==================== CONTACTS ENDPOINTS ====================

// GET - Listar contatos de um fornecedor
app.get('/api/suppliers/:supplierId/contacts', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const result = await pool.query(
            'SELECT * FROM contato_for WHERE con_fornec = $1 ORDER BY con_codigo',
            [supplierId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar contatos: ${error.message}`
        });
    }
});

// POST - Criar novo contato
app.post('/api/suppliers/:supplierId/contacts', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const contact = req.body;

        // Get next con_codigo for this supplier
        const maxCodeResult = await pool.query(
            'SELECT COALESCE(MAX(con_codigo), 0) + 1 as next_code FROM contato_for WHERE con_fornec = $1',
            [supplierId]
        );
        const nextCode = maxCodeResult.rows[0].next_code;

        const query = `
            INSERT INTO contato_for (
                con_codigo, con_fornec, con_nome, con_cargo, 
                con_telefone, con_celular, con_email, con_dtnasc, con_obs,
                con_timequetorce, con_esportepreferido, con_hobby
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            nextCode,
            supplierId,
            contact.con_nome,
            contact.con_cargo || '',
            contact.con_telefone || '',
            contact.con_celular || '',
            contact.con_email || '',
            contact.con_dtnasc || null,
            contact.con_obs || '',
            contact.con_timequetorce || '',
            contact.con_esportepreferido || '',
            contact.con_hobby || ''
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Contato criado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar contato: ${error.message}`
        });
    }
});

// PUT - Atualizar contato (usando con_codigo como identificador único)
app.put('/api/suppliers/:supplierId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const contact = req.body;

        const query = `
            UPDATE contato_for SET
                con_telefone = $1, con_celular = $2,
                con_email = $3, con_dtnasc = $4, con_obs = $5,
                con_timequetorce = $6, con_esportepreferido = $7, con_hobby = $8
            WHERE con_codigo = $9
            RETURNING *
        `;

        const values = [
            contact.con_telefone || '',
            contact.con_celular || '',
            contact.con_email || '',
            contact.con_dtnasc || null,
            contact.con_obs || '',
            contact.con_timequetorce || '',
            contact.con_esportepreferido || '',
            contact.con_hobby || '',
            contactId
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contato atualizado com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar contato: ${error.message}`
        });
    }
});

// DELETE - Excluir contato (usando con_codigo como identificador único)
app.delete('/api/suppliers/:supplierId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const result = await pool.query(
            'DELETE FROM contato_for WHERE con_codigo = $1 RETURNING *',
            [contactId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contato excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir contato: ${error.message}`
        });
    }
});

// ==================== ANNUAL GOALS ENDPOINTS ====================

// GET - Buscar metas de um fornecedor por ano
app.get('/api/suppliers/:supplierId/goals/:year', async (req, res) => {
    try {
        const { supplierId, year } = req.params;
        const result = await pool.query(
            'SELECT * FROM ind_metas WHERE met_industria = $1 AND met_ano = $2',
            [supplierId, year]
        );

        if (result.rows.length === 0) {
            // Return empty goals if not found
            return res.json({
                success: true,
                data: {
                    met_ano: parseInt(year),
                    met_industria: parseInt(supplierId),
                    met_jan: 0, met_fev: 0, met_mar: 0, met_abr: 0,
                    met_mai: 0, met_jun: 0, met_jul: 0, met_ago: 0,
                    met_set: 0, met_out: 0, met_nov: 0, met_dez: 0
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar metas: ${error.message}`
        });
    }
});

// PUT - Atualizar/Criar metas de um fornecedor para um ano
app.put('/api/suppliers/:supplierId/goals/:year', async (req, res) => {
    try {
        const { supplierId, year } = req.params;
        const goals = req.body;

        const query = `
            INSERT INTO ind_metas (
                met_ano, met_industria,
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (met_ano, met_industria) DO UPDATE SET
                met_jan = EXCLUDED.met_jan,
                met_fev = EXCLUDED.met_fev,
                met_mar = EXCLUDED.met_mar,
                met_abr = EXCLUDED.met_abr,
                met_mai = EXCLUDED.met_mai,
                met_jun = EXCLUDED.met_jun,
                met_jul = EXCLUDED.met_jul,
                met_ago = EXCLUDED.met_ago,
                met_set = EXCLUDED.met_set,
                met_out = EXCLUDED.met_out,
                met_nov = EXCLUDED.met_nov,
                met_dez = EXCLUDED.met_dez
            RETURNING *
        `;

        const values = [
            parseInt(year),
            parseInt(supplierId),
            goals.met_jan || 0,
            goals.met_fev || 0,
            goals.met_mar || 0,
            goals.met_abr || 0,
            goals.met_mai || 0,
            goals.met_jun || 0,
            goals.met_jul || 0,
            goals.met_ago || 0,
            goals.met_set || 0,
            goals.met_out || 0,
            goals.met_nov || 0,
            goals.met_dez || 0
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Metas salvas com sucesso!',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao salvar metas: ${error.message}`
        });
    }
});


// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend rodando!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});
