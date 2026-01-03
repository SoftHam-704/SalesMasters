require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Firebird = require('node-firebird');
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const path = require('path');
const multer = require('multer');

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'C:\\SalesMasters\\Imagens';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original filename
        cb(null, file.originalname);
    }
});
const uploadLogo = multer({ storage: logoStorage });

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Aumentado para suportar importações muito grandes (20k+ produtos)
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static images from C:\SalesMasters\Imagens
app.use('/images', express.static('C:\\SalesMasters\\Imagens'));

// Endpoint to serve any local image file
app.get('/api/image', (req, res) => {
    const { path: imagePath } = req.query;

    if (!imagePath) {
        return res.status(400).json({ success: false, message: 'Path is required' });
    }

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Send the file
    res.sendFile(imagePath);
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SalesMasters Backend running',
        version: '1.0.0'
    });
});

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if ((req.method === 'PUT' || req.method === 'POST') && req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body).substring(0, 500));
    }
    next();
});

// PostgreSQL Pool
// PostgreSQL Pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

// ==================== V2 ENDPOINTS (Top Priority) ====================

// --- PRODUCT GROUPS (V2) ---
app.get('/api/v2/product-groups', async (req, res) => {
    console.log('🔍 HIT TOP /api/v2/product-groups');
    try {
        const query = 'SELECT * FROM grupos ORDER BY gru_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM grupos WHERE gru_codigo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/v2/product-groups', async (req, res) => {
    try {
        const { gru_nome, gru_percomiss } = req.body;
        if (!gru_nome) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO grupos (gru_nome, gru_percomiss) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [gru_nome, gru_percomiss || 0]);
        res.json({ success: true, data: result.rows[0], message: 'Grupo criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { gru_nome, gru_percomiss } = req.body;
        const result = await pool.query('UPDATE grupos SET gru_nome = $1, gru_percomiss = $2 WHERE gru_codigo = $3 RETURNING *', [gru_nome, gru_percomiss, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, data: result.rows[0], message: 'Grupo atualizado!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/v2/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM grupos WHERE gru_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
        res.json({ success: true, message: 'Grupo excluído!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Grupo em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- DISCOUNT GROUPS (V2) ---


// GET - Listar todos os grupos de descontos
app.get('/api/v2/discount-groups', async (req, res) => {
    console.log('🔍 HIT TOP /api/v2/discount-groups');
    try {
        const query = `
            SELECT 
                gde_id,
                gid,
                gde_nome,
                gde_desc1,
                gde_desc2,
                gde_desc3,
                gde_desc4,
                gde_desc5,
                gde_desc6,
                gde_desc7,
                gde_desc8,
                gde_desc9
            FROM grupo_desc
            ORDER BY gid::integer
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupos de descontos: ${error.message}`
        });
    }
});

// GET - Buscar grupo de desconto por ID
app.get('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM grupo_desc WHERE gde_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupo de desconto: ${error.message}`
        });
    }
});

// POST - Criar novo grupo de desconto
app.post('/api/v2/discount-groups', async (req, res) => {
    try {
        const {
            gid,
            gde_nome,
            gde_desc1, gde_desc2, gde_desc3,
            gde_desc4, gde_desc5, gde_desc6,
            gde_desc7, gde_desc8, gde_desc9
        } = req.body;

        const checkGid = await pool.query('SELECT gde_id FROM grupo_desc WHERE gid = $1', [gid]);
        if (checkGid.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um grupo com este ID'
            });
        }

        const query = `
            INSERT INTO grupo_desc (
                gid, gde_nome,
                gde_desc1, gde_desc2, gde_desc3,
                gde_desc4, gde_desc5, gde_desc6,
                gde_desc7, gde_desc8, gde_desc9
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await pool.query(query, [
            gid || '0',
            gde_nome || '',
            gde_desc1 || 0, gde_desc2 || 0, gde_desc3 || 0,
            gde_desc4 || 0, gde_desc5 || 0, gde_desc6 || 0,
            gde_desc7 || 0, gde_desc8 || 0, gde_desc9 || 0
        ]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo de desconto criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar grupo de desconto: ${error.message}`
        });
    }
});

// PUT - Atualizar grupo de desconto
app.put('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            gid,
            gde_nome,
            gde_desc1, gde_desc2, gde_desc3,
            gde_desc4, gde_desc5, gde_desc6,
            gde_desc7, gde_desc8, gde_desc9
        } = req.body;

        const query = `
            UPDATE grupo_desc
            SET gid = $1,
                gde_nome = $2,
                gde_desc1 = $3,
                gde_desc2 = $4,
                gde_desc3 = $5,
                gde_desc4 = $6,
                gde_desc5 = $7,
                gde_desc6 = $8,
                gde_desc7 = $9,
                gde_desc8 = $10,
                gde_desc9 = $11
            WHERE gde_id = $12
            RETURNING *
        `;

        const result = await pool.query(query, [
            gid,
            gde_nome,
            gde_desc1 || 0, gde_desc2 || 0, gde_desc3 || 0,
            gde_desc4 || 0, gde_desc5 || 0, gde_desc6 || 0,
            gde_desc7 || 0, gde_desc8 || 0, gde_desc9 || 0,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo de desconto atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar grupo de desconto: ${error.message}`
        });
    }
});

// DELETE - Excluir grupo de desconto
app.delete('/api/v2/discount-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM grupo_desc WHERE gde_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo de desconto não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Grupo de desconto excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir grupo de desconto: ${error.message}`
        });
    }
});


// --- REGIONS (V2) ---

// GET - List all regions
app.get('/api/v2/regions', async (req, res) => {
    try {
        const query = 'SELECT * FROM regioes ORDER BY reg_descricao';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get region by ID
app.get('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM regioes WHERE reg_codigo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new region
app.post('/api/v2/regions', async (req, res) => {
    try {
        const { reg_descricao } = req.body;
        if (!reg_descricao) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO regioes (reg_descricao) VALUES ($1) RETURNING *';
        const result = await pool.query(query, [reg_descricao]);
        res.json({ success: true, data: result.rows[0], message: 'Região criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update region
app.put('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reg_descricao } = req.body;
        const result = await pool.query('UPDATE regioes SET reg_descricao = $1 WHERE reg_codigo = $2 RETURNING *', [reg_descricao, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, data: result.rows[0], message: 'Região atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete region
app.delete('/api/v2/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM regioes WHERE reg_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Região não encontrada' });
        res.json({ success: true, message: 'Região excluída!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Região em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- CITIES (V2) ---

// GET - List all cities (for combobox)
app.get('/api/v2/cities', async (req, res) => {
    try {
        const query = 'SELECT cid_codigo, cid_nome, cid_uf FROM cidades WHERE cid_ativo = true ORDER BY cid_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List cities of a specific region
app.get('/api/v2/regions/:id/cities', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT c.cid_codigo, c.cid_nome, c.cid_uf 
            FROM cidades c
            INNER JOIN cidades_regioes cr ON c.cid_codigo = cr.cid_id
            WHERE cr.reg_id = $1
            ORDER BY c.cid_nome
        `;
        const result = await pool.query(query, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Add city to region
app.post('/api/v2/regions/:id/cities', async (req, res) => {
    try {
        const { id } = req.params;
        const { cid_id } = req.body;

        // Check if association already exists
        const checkQuery = 'SELECT * FROM cidades_regioes WHERE reg_id = $1 AND cid_id = $2';
        const checkResult = await pool.query(checkQuery, [id, cid_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Cidade já está nesta região' });
        }

        const query = 'INSERT INTO cidades_regioes (reg_id, cid_id) VALUES ($1, $2)';
        await pool.query(query, [id, cid_id]);
        res.json({ success: true, message: 'Cidade adicionada à região!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Remove city from region
app.delete('/api/v2/regions/:regionId/cities/:cityId', async (req, res) => {
    try {
        const { regionId, cityId } = req.params;
        const result = await pool.query(
            'DELETE FROM cidades_regioes WHERE reg_id = $1 AND cid_id = $2 RETURNING *',
            [regionId, cityId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Associação não encontrada' });
        }

        res.json({ success: true, message: 'Cidade removida da região!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- ACTIVITY AREAS (V2) ---

// GET - List all activity areas
app.get('/api/v2/activity-areas', async (req, res) => {
    try {
        const query = 'SELECT * FROM area_atu ORDER BY atu_descricao';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get activity area by ID
app.get('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM area_atu WHERE atu_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new activity area
app.post('/api/v2/activity-areas', async (req, res) => {
    try {
        const { atu_descricao, atu_sel, gid } = req.body;
        if (!atu_descricao) return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });

        const query = 'INSERT INTO area_atu (atu_descricao, atu_sel, gid) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [atu_descricao, atu_sel || '', gid || '']);
        res.json({ success: true, data: result.rows[0], message: 'Área de atuação criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update activity area
app.put('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { atu_descricao, atu_sel, gid } = req.body;
        const result = await pool.query(
            'UPDATE area_atu SET atu_descricao = $1, atu_sel = $2, gid = $3 WHERE atu_id = $4 RETURNING *',
            [atu_descricao, atu_sel, gid, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, data: result.rows[0], message: 'Área de atuação atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete activity area
app.delete('/api/v2/activity-areas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM area_atu WHERE atu_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Área de atuação não encontrada' });
        res.json({ success: true, message: 'Área de atuação excluída!' });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'Área de atuação em uso.' });
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- CARRIERS (TRANSPORTADORAS) (V2) ---
// Adicionar estas linhas ANTES de "// Test Firebird Connection" (linha 522)

// GET - List all carriers
app.get('/api/v2/carriers', async (req, res) => {
    try {
        const query = 'SELECT * FROM transportadora ORDER BY tra_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Get carrier by ID
app.get('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM transportadora WHERE tra_codigo = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Fetch carrier data from CNPJ (ReceitaWS)
app.get('/api/v2/carriers/cnpj/:cnpj', async (req, res) => {
    try {
        const { cnpj } = req.params;
        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
        const data = await response.json();

        if (data.status === 'ERROR') {
            return res.status(404).json({ success: false, message: data.message || 'CNPJ não encontrado' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Create new carrier
app.post('/api/v2/carriers', async (req, res) => {
    try {
        const {
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists
        if (tra_cgc) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cgc = $1';
            const checkResult = await pool.query(checkQuery, [tra_cgc]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
            }
        }

        const query = `
            INSERT INTO transportadora (
                tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
                tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
                tra_inscricao, tra_obs
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        ]);

        res.json({ success: true, message: 'Transportadora criada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// CATEGORIAS DE PRODUTOS (categoria_prod)
// ==========================================

// GET - Listar todas as categorias
app.get('/api/v2/product-categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categoria_prod ORDER BY cat_id');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Buscar categoria por ID
app.get('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categoria_prod WHERE cat_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar nova categoria
app.post('/api/v2/product-categories', async (req, res) => {
    try {
        const { cat_descricao } = req.body;

        if (!cat_descricao) {
            return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
        }

        const result = await pool.query(
            'INSERT INTO categoria_prod (cat_descricao) VALUES ($1) RETURNING *',
            [cat_descricao]
        );
        res.json({ success: true, data: result.rows[0], message: 'Categoria criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Atualizar categoria
app.put('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cat_descricao } = req.body;

        const result = await pool.query(
            'UPDATE categoria_prod SET cat_descricao = $1 WHERE cat_id = $2 RETURNING *',
            [cat_descricao, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, data: result.rows[0], message: 'Categoria atualizada!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Excluir categoria
app.delete('/api/v2/product-categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM categoria_prod WHERE cat_id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        res.json({ success: true, message: 'Categoria excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Update carrier
app.put('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs
        } = req.body;

        // Check if CNPJ already exists for another carrier
        if (tra_cgc) {
            const checkQuery = 'SELECT tra_codigo FROM transportadora WHERE tra_cgc = $1 AND tra_codigo != $2';
            const checkResult = await pool.query(checkQuery, [tra_cgc, id]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'CNPJ já cadastrado para outra transportadora' });
            }
        }

        const query = `
            UPDATE transportadora SET
                tra_nome = $1, tra_cgc = $2, tra_endereco = $3, tra_bairro = $4,
                tra_cidade = $5, tra_uf = $6, tra_cep = $7, tra_fone = $8,
                tra_contato = $9, tra_email = $10,
                tra_inscricao = $11, tra_obs = $12
            WHERE tra_codigo = $13
            RETURNING *
        `;

        const result = await pool.query(query, [
            tra_nome, tra_cgc, tra_endereco, tra_bairro, tra_cidade,
            tra_uf, tra_cep, tra_fone, tra_contato, tra_email,
            tra_inscricao, tra_obs, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora atualizada!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Delete carrier
app.delete('/api/v2/carriers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transportadora WHERE tra_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportadora não encontrada' });
        }

        res.json({ success: true, message: 'Transportadora excluída!' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Transportadora em uso, não pode ser excluída' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== ORDER PRINTING ENDPOINTS ====================
require('./order_print_endpoints')(app, pool);

// ==================== PRICE TABLES ENDPOINTS ====================

// ==================== CLI_IND ENDPOINTS ====================
// Import CLI_IND routes for special client conditions
const cliIndRouter = require('./cli_ind_endpoints')(pool);
app.use('/api', cliIndRouter);

// ==================== CLI_ANIV ENDPOINTS ====================
// Import CLI_ANIV routes for buyer lookup
const cliAnivRouter = require('./cli_aniv_endpoints')(pool);
app.use('/api', cliAnivRouter);

// ==================== PARAMETROS ENDPOINTS ====================
// Import parametros routes for system configuration
const parametrosRouter = require('./parametros_endpoints')(pool);
app.use('/api', parametrosRouter);

// ==================== USERS ENDPOINTS ====================
// Import users routes for user management
const usersRouter = require('./users_endpoints')(pool);
app.use('/api/users', usersRouter);

// ==================== AUXILIARY DATA ENDPOINTS ====================

// GET - Listar clientes (opcionalmente filtrados por status 'A' ou indústria)
app.get('/api/aux/clientes', async (req, res) => {
    try {
        const { status, for_codigo } = req.query;

        // Colunas essenciais para busca e exibição
        let query = 'SELECT cli_codigo, cli_nome, cli_nomred, cli_cnpj, cli_tipopes, cli_cidade, cli_uf FROM clientes WHERE 1=1';
        const params = [];

        if (status === 'A') {
            query += " AND cli_tipopes = 'A'";
        }

        // Se quiser manter o suporte para filtro por indústria futuramente
        if (for_codigo) {
            // Por enquanto mantendo simples como solicitado, apenas retornando ativos
        }

        query += ' ORDER BY cli_nomred, cli_nome';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Vendedores
app.get('/api/aux/vendedores', async (req, res) => {
    try {
        const query = 'SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_nome';
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Tabelas de Preço por indústria
app.get('/api/aux/price-tables', async (req, res) => {
    try {
        const { for_codigo } = req.query;
        let query = 'SELECT tab_codigo, tab_descricao FROM tabela_preco';
        const params = [];

        if (for_codigo) {
            query += ' WHERE tab_fornecedor = $1';
            params.push(for_codigo);
        }

        query += ' ORDER BY tab_descricao';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== DATABASE CONFIGURATION ENDPOINTS ====================

// GET current database configuration
app.get('/api/config/database', (req, res) => {
    res.json({
        success: true,
        config: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'basesales',
            user: process.env.DB_USER || 'postgres',
            ssl: process.env.DB_SSL === 'true'
        }
    });
});

// POST test database connection
app.post('/api/config/database/test', async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    const testPool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
    });

    try {
        const client = await testPool.connect();
        await client.query('SELECT 1');
        client.release();
        await testPool.end();

        res.json({
            success: true,
            message: '✅ Conexão testada com sucesso!'
        });
    } catch (error) {
        await testPool.end();
        res.json({
            success: false,
            message: `❌ Erro ao conectar: ${error.message}`
        });
    }
});

// POST save database configuration
app.post('/api/config/database/save', async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    try {
        // Ler arquivo .env atual
        const envPath = path.join(__dirname, '.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Atualizar variáveis
        const updateEnv = (key, value) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        };

        updateEnv('DB_HOST', host);
        updateEnv('DB_PORT', port);
        updateEnv('DB_NAME', database);
        updateEnv('DB_USER', user);
        updateEnv('DB_PASSWORD', password);
        updateEnv('DB_SSL', ssl);

        // Salvar arquivo
        fs.writeFileSync(envPath, envContent.trim() + '\n');

        res.json({
            success: true,
            message: '✅ Configuração salva com sucesso! Reinicie o servidor para aplicar as mudanças.'
        });
    } catch (error) {
        res.json({
            success: false,
            message: `❌ Erro ao salvar configuração: ${error.message}`
        });
    }
});

// ==================== COMPANY CONFIGURATION ENDPOINTS ====================

// GET current company configuration from PostgreSQL
app.get('/api/config/company', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresa_status WHERE emp_id = 1');

        if (result.rows.length > 0) {
            const row = result.rows[0];
            res.json({
                success: true,
                config: {
                    situacao: row.emp_situacao?.trim() || 'A',
                    nome: row.emp_nome || '',
                    endereco: row.emp_endereco || '',
                    bairro: row.emp_bairro || '',
                    cidade: row.emp_cidade || '',
                    uf: row.emp_uf?.trim() || '',
                    cep: row.emp_cep || '',
                    cnpj: row.emp_cnpj || '',
                    inscricao: row.emp_inscricao || '',
                    fones: row.emp_fones || '',
                    logotipo: row.emp_logotipo || '',
                    baseDadosLocal: row.emp_basedadoslocal || '',
                    host: row.emp_host || 'localhost',
                    porta: row.emp_porta || 3070,
                    username: row.emp_username || 'SYSDBA',
                    password: row.emp_password || '',
                    pastaBasica: row.emp_pastabasica || ''
                }
            });
        } else {
            // Retornar configuração padrão se não existir
            res.json({
                success: true,
                config: {
                    situacao: 'A',
                    nome: 'SOFTHAM SISTEMAS - LOCAL',
                    endereco: 'R. SANTIAGO PERES UBINHA, 150',
                    bairro: 'JARDIM DOM NERY',
                    cidade: 'CAMPINAS',
                    uf: 'SP',
                    cep: '13.031-730',
                    cnpj: '17.504.829/0001-24',
                    inscricao: '',
                    fones: '(19) 3203-8600',
                    logotipo: 'C:\\SalesMasters\\Imagens\\Softham1.png',
                    baseDadosLocal: 'C:\\SalesMasters\\Dados50\\Nova\\BASESALES.FDB',
                    host: 'localhost',
                    porta: 3070,
                    username: 'SYSDBA',
                    password: '',
                    pastaBasica: 'C:\\SalesMasters\\'
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar configuração da empresa:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao carregar configuração: ${error.message}`
        });
    }
});

// POST save company configuration to PostgreSQL
app.post('/api/config/company/save', async (req, res) => {
    try {
        const config = req.body;

        // Verificar se existe registro
        const checkResult = await pool.query('SELECT emp_id FROM empresa_status WHERE emp_id = 1');

        if (checkResult.rows.length > 0) {
            // Update existing record
            await pool.query(`
                UPDATE empresa_status SET
                    emp_situacao = $1,
                    emp_nome = $2,
                    emp_endereco = $3,
                    emp_bairro = $4,
                    emp_cidade = $5,
                    emp_uf = $6,
                    emp_cep = $7,
                    emp_cnpj = $8,
                    emp_inscricao = $9,
                    emp_fones = $10,
                    emp_logotipo = $11,
                    emp_basedadoslocal = $12,
                    emp_host = $13,
                    emp_porta = $14,
                    emp_username = $15,
                    emp_password = $16,
                    emp_pastabasica = $17,
                    emp_dataatualizacao = CURRENT_TIMESTAMP
                WHERE emp_id = 1
            `, [
                config.situacao || 'A',
                config.nome,
                config.endereco,
                config.bairro,
                config.cidade,
                config.uf,
                config.cep,
                config.cnpj,
                config.inscricao,
                config.fones,
                config.logotipo,
                config.baseDadosLocal,
                config.host,
                config.porta,
                config.username,
                config.password,
                config.pastaBasica
            ]);
        } else {
            // Insert new record
            await pool.query(`
                INSERT INTO empresa_status (
                    emp_id, emp_situacao, emp_nome, emp_endereco, emp_bairro, emp_cidade,
                    emp_uf, emp_cep, emp_cnpj, emp_inscricao, emp_fones,
                    emp_logotipo, emp_basedadoslocal, emp_host, emp_porta,
                    emp_username, emp_password, emp_pastabasica
                ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
                config.situacao || 'A',
                config.nome,
                config.endereco,
                config.bairro,
                config.cidade,
                config.uf,
                config.cep,
                config.cnpj,
                config.inscricao,
                config.fones,
                config.logotipo,
                config.baseDadosLocal,
                config.host,
                config.porta,
                config.username,
                config.password,
                config.pastaBasica
            ]);
        }

        console.log('✅ Configuração da empresa salva no PostgreSQL:', config.nome);

        res.json({
            success: true,
            message: '✅ Configuração da empresa salva com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao salvar configuração da empresa:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao salvar configuração: ${error.message}`
        });
    }
});

// POST upload logo image
app.post('/api/config/company/upload-logo', uploadLogo.single('logo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        const fullPath = path.join('C:\\SalesMasters\\Imagens', req.file.originalname);

        console.log('✅ Logo uploaded:', fullPath);

        res.json({
            success: true,
            path: fullPath,
            filename: req.file.originalname,
            message: '✅ Logo enviado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao fazer upload do logo:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao fazer upload: ${error.message}`
        });
    }
});

// ==================== DASHBOARD ENDPOINTS ====================
// GET /api/dashboard/sales-comparison - Comparação de vendas mensais
app.get('/api/dashboard/sales-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;

        console.log(`📊 [DASHBOARD] Buscando comparação de vendas: ${anoAtual || 2025} vs ${anoAnterior || 2024}`);

        const result = await pool.query(
            'SELECT * FROM fn_comparacao_vendas_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} meses`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar comparação:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar comparação de vendas: ${error.message}`
        });
    }
});

// GET /api/dashboard/quantities-comparison - Comparação de quantidades mensais
app.get('/api/dashboard/quantities-comparison', async (req, res) => {
    try {
        const { anoAtual, anoAnterior } = req.query;

        console.log(`📊 [DASHBOARD] Buscando comparação de quantidades: ${anoAtual || 2025} vs ${anoAnterior || 2024}`);

        const result = await pool.query(
            'SELECT * FROM fn_comparacao_quantidades_mensais($1, $2)',
            [anoAtual || 2025, anoAnterior || 2024]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} meses`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar comparação de quantidades:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar comparação de quantidades: ${error.message}`
        });
    }
});

// GET /api/dashboard/top-clients - Top 10 clientes por vendas
app.get('/api/dashboard/top-clients', async (req, res) => {
    try {
        const { ano, mes, limit = 10 } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando top ${limit} clientes: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_top_clients($1, $2, $3)',
            [parseInt(ano), mes ? parseInt(mes) : null, parseInt(limit)]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} clientes`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching top clients:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar top clientes: ${error.message}`
        });
    }
});

// GET /api/dashboard/industry-revenue - Faturamento por indústria
app.get('/api/dashboard/industry-revenue', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando faturamento por indústria: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_industry_revenue($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} indústrias`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching industry revenue:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar faturamento por indústria: ${error.message}`
        });
    }
});

// GET - Sales Performance by Seller
app.get('/api/dashboard/sales-performance', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando performance de vendedores: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_sales_performance($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );

        console.log(`📊 [DASHBOARD] Retornou ${result.rows.length} vendedores`);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching sales performance:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar performance de vendedores: ${error.message}`
        });
    }
});

// GET /api/dashboard/metrics - General dashboard metrics (total sales, quantity, clients, orders)
app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        const { ano, mes } = req.query;

        if (!ano) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "ano" é obrigatório'
            });
        }

        console.log(`📊 [DASHBOARD] Buscando métricas gerais: ano=${ano}, mes=${mes || 'todos'}`);

        const result = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2)',
            [parseInt(ano), mes ? parseInt(mes) : null]
        );

        console.log(`📊 [DASHBOARD] Métricas retornadas com sucesso`);

        res.json({
            success: true,
            data: result.rows[0] // Return first row with all metrics
        });
    } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching dashboard metrics:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar métricas do dashboard: ${error.message}`
        });
    }
});


// ==================== PRODUCTS ENDPOINTS ====================
// Import products routes
const productsRouter = require('./products_endpoints')(pool);
app.use('/api', productsRouter);

// ==================== AUXILIARY ENDPOINTS ====================
// These endpoints provide data for form dropdowns



// GET - Listar vendedores
app.get('/api/aux/vendedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_nome');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Listar áreas de atuação
app.get('/api/aux/areas', async (req, res) => {
    try {
        const result = await pool.query('SELECT atu_id, atu_descricao FROM area_atuacao ORDER BY atu_descricao');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Listar regiões
app.get('/api/aux/regioes', async (req, res) => {
    try {
        const result = await pool.query('SELECT reg_codigo, reg_descricao FROM regioes ORDER BY reg_descricao');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Buscar cidades (com busca opcional)
app.get('/api/aux/cidades', async (req, res) => {
    try {
        const { search, id } = req.query;
        let query = 'SELECT cid_codigo, cid_nome, cid_uf FROM cidades WHERE cid_ativo = true';
        const params = [];

        if (id) {
            query += ' AND cid_codigo = $1';
            params.push(parseInt(id));
        } else if (search) {
            query += ' AND cid_nome ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY cid_nome LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
                for_tipo2 = $12, for_nomered = $13, for_obs2 = $14,
                for_homepage = $15, for_locimagem = $16
            WHERE for_cgc = $17
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
            supplier.for_homepage || '',
            supplier.for_locimagem || '',
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

// ==================== CLIENT CONTACTS ENDPOINTS (cli_aniv) ====================

// GET - Listar contatos de um cliente
app.get('/api/clients/:clientId/contacts', async (req, res) => {
    try {
        const { clientId } = req.params;
        const result = await pool.query(
            'SELECT * FROM cli_aniv WHERE ani_cliente = $1 ORDER BY ani_nome',
            [clientId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar contatos do cliente: ${error.message}`
        });
    }
});

// POST - Criar novo contato de cliente
app.post('/api/clients/:clientId/contacts', async (req, res) => {
    try {
        const { clientId } = req.params;
        const contact = req.body;

        // Generate next ani_lancto manually
        const maxResult = await pool.query('SELECT MAX(ani_lancto) as max_id FROM cli_aniv');
        const nextId = (maxResult.rows[0].max_id || 0) + 1;

        const query = `
            INSERT INTO cli_aniv (
                ani_lancto, ani_cliente, ani_nome, ani_funcao, 
                ani_fone, ani_email, ani_diaaniv, ani_mes, 
                ani_niver, ani_obs, gid,
                ani_timequetorce, ani_esportepreferido, ani_hobby
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            nextId,
            clientId,
            contact.ani_nome,
            contact.ani_funcao || '',
            contact.ani_fone || '',
            contact.ani_email || '',
            contact.ani_diaaniv || null,
            contact.ani_mes || null,
            contact.ani_niver || null,
            contact.ani_obs || '',
            contact.gid || '',
            contact.ani_timequetorce || '',
            contact.ani_esportepreferido || '',
            contact.ani_hobby || ''
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

// PUT - Atualizar contato de cliente
app.put('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const contact = req.body;

        // Update using ani_lancto as it is unique per row usually
        const query = `
            UPDATE cli_aniv SET
                ani_nome = $1, ani_funcao = $2,
                ani_fone = $3, ani_email = $4,
                ani_diaaniv = $5, ani_mes = $6,
                ani_niver = $7, ani_obs = $8,
                ani_timequetorce = $9, ani_esportepreferido = $10, ani_hobby = $11
            WHERE ani_lancto = $12
            RETURNING *
        `;

        const values = [
            contact.ani_nome,
            contact.ani_funcao || '',
            contact.ani_fone || '',
            contact.ani_email || '',
            contact.ani_diaaniv || null,
            contact.ani_mes || null,
            contact.ani_niver || null,
            contact.ani_obs || '',
            contact.ani_timequetorce || '',
            contact.ani_esportepreferido || '',
            contact.ani_hobby || '',
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

// DELETE - Excluir contato de cliente
app.delete('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const result = await pool.query(
            'DELETE FROM cli_aniv WHERE ani_lancto = $1 RETURNING *',
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

// ==================== CRUD CLIENTES ====================

// GET - Listar todos os clientes
app.get('/api/clients', async (req, res) => {
    try {
        const { search, active, page = 1, limit = 10 } = req.query;

        let query = 'SELECT * FROM clientes WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtro de busca
        if (search) {
            query += ` AND (cli_nome ILIKE $${paramCount} OR cli_fantasia ILIKE $${paramCount} OR cli_cnpj ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Filtro ativo/inativo (CLI_TIPOPES: 'A' = Ativo, 'I' = Inativo)
        // Note: The user mentioned CLI_TIPOPES stores A/I.
        if (active !== undefined) {
            query += ` AND cli_tipopes = $${paramCount}`;
            params.push(active === 'true' ? 'A' : 'I');
            paramCount++;
        }

        // Ordenação
        query += ' ORDER BY cli_nome';

        // Paginação
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM clientes WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (search) {
            countQuery += ` AND (cli_nome ILIKE $${countParamCount} OR cli_fantasia ILIKE $${countParamCount} OR cli_cnpj ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
            countParamCount++;
        }

        if (active !== undefined) {
            countQuery += ` AND cli_tipopes = $${countParamCount}`;
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
            message: `Erro ao buscar clientes: ${error.message}`
        });
    }
});

// GET - Buscar cliente por ID
app.get('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM clientes WHERE cli_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar novo cliente
app.post('/api/clients', async (req, res) => {
    try {
        const client = req.body;
        // Basic fields for now, can expand
        const query = `
            INSERT INTO clientes (
                cli_cnpj, cli_inscricao, cli_tipopes, cli_atuacaoprincipal,
                cli_nome, cli_fantasia, cli_dtabertura,
                cli_endereco, cli_complemento, cli_bairro, cli_idcidade, cli_cidade, cli_uf, cli_cep,
                cli_fone1, cli_fone3, cli_fone2,
                cli_email, cli_nomred, cli_redeloja,
                cli_vendedor, cli_skype, cli_regiao2, cli_regimeemp,
                cli_emailnfe, cli_cxpostal, cli_emailfinanc, cli_suframa, cli_vencsuf,
                cli_obspedido, cli_obs, cli_refcom,
                cli_endcob, cli_baicob, cli_cidcob, cli_cepcob, cli_ufcob,
                cli_datacad, cli_usuario
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
            ) RETURNING *
        `;
        const values = [
            client.cli_cnpj, client.cli_inscricao, client.cli_tipopes, client.cli_atuacaoprincipal,
            client.cli_nome, client.cli_fantasia, client.cli_dtabertura || null,
            client.cli_endereco, client.cli_complemento, client.cli_bairro, client.cli_idcidade || null, client.cli_cidade, client.cli_uf, client.cli_cep,
            client.cli_fone1, client.cli_fone3, client.cli_fone2,
            client.cli_email, client.cli_nomred, client.cli_redeloja,
            client.cli_vendedor || null, client.cli_skype, client.cli_regiao2 || null, client.cli_regimeemp,
            client.cli_emailnfe, client.cli_cxpostal, client.cli_emailfinanc, client.cli_suframa, client.cli_vencsuf || null,
            client.cli_obspedido, client.cli_obs, client.cli_refcom,
            client.cli_endcob, client.cli_baicob, client.cli_cidcob, client.cli_cepcob, client.cli_ufcob,
            client.cli_datacad || new Date(), client.cli_usuario
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Cliente criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Atualizar cliente
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = req.body;

        const query = `
            UPDATE clientes SET
                cli_cnpj=$1, cli_inscricao=$2, cli_tipopes=$3, cli_atuacaoprincipal=$4,
                cli_nome=$5, cli_fantasia=$6, cli_dtabertura=$7,
                cli_endereco=$8, cli_complemento=$9, cli_bairro=$10, cli_idcidade=$11, cli_cidade=$12, cli_uf=$13, cli_cep=$14,
                cli_fone1=$15, cli_fone3=$16, cli_fone2=$17,
                cli_email=$18, cli_nomred=$19, cli_redeloja=$20,
                cli_vendedor=$21, cli_skype=$22, cli_regiao2=$23, cli_regimeemp=$24,
                cli_emailnfe=$25, cli_cxpostal=$26, cli_emailfinanc=$27, cli_suframa=$28, cli_vencsuf=$29,
                cli_obspedido=$30, cli_obs=$31, cli_refcom=$32,
                cli_endcob=$33, cli_baicob=$34, cli_cidcob=$35, cli_cepcob=$36, cli_ufcob=$37,
                cli_dataalt=NOW()
            WHERE cli_codigo = $38
            RETURNING *
        `;
        const values = [
            client.cli_cnpj, client.cli_inscricao, client.cli_tipopes, client.cli_atuacaoprincipal,
            client.cli_nome, client.cli_fantasia, client.cli_dtabertura || null,
            client.cli_endereco, client.cli_complemento, client.cli_bairro, client.cli_idcidade || null, client.cli_cidade, client.cli_uf, client.cli_cep,
            client.cli_fone1, client.cli_fone3, client.cli_fone2,
            client.cli_email, client.cli_nomred, client.cli_redeloja,
            client.cli_vendedor || null, client.cli_skype, client.cli_regiao2 || null, client.cli_regimeemp,
            client.cli_emailnfe, client.cli_cxpostal, client.cli_emailfinanc, client.cli_suframa, client.cli_vencsuf || null,
            client.cli_obspedido, client.cli_obs, client.cli_refcom,
            client.cli_endcob, client.cli_baicob, client.cli_cidcob, client.cli_cepcob, client.cli_ufcob,
            id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });

        res.json({ success: true, data: result.rows[0], message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Excluir cliente
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM clientes WHERE cli_codigo = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        res.json({ success: true, message: 'Cliente excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/aux/cidades', async (req, res) => {
    try {
        const { search, id } = req.query;

        let query = 'SELECT cid_codigo, cid_nome, cid_uf FROM cidades';
        const params = [];
        let paramCount = 1;

        if (id) {
            // ID Lookup - Exact Match (Indexed)
            query += ` WHERE cid_codigo = $${paramCount}`;
            params.push(id);
        } else if (search) {
            // Search Mode - Text Match
            query += ` WHERE cid_nome ILIKE $${paramCount}`;
            params.push(`%${search}%`);
            query += ' ORDER BY cid_nome ASC LIMIT 50';
        } else {
            // Default - Return empty or very limited set to prevent full table load
            // Returning top 10 just for initial population if needed, or empty
            query += ' ORDER BY cid_nome ASC LIMIT 10';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/aux/regioes', async (req, res) => {
    try {
        const result = await pool.query('SELECT reg_codigo, reg_descricao FROM regioes ORDER BY reg_descricao');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/aux/areas', async (req, res) => {
    try {
        const query = 'SELECT atu_id, atu_descricao FROM area_atuacao ORDER BY atu_descricao';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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



// ============================================
// Listar todas as transportadoras (Legacy Endpoint for OrderForm)
app.get('/api/transportadoras', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transportadora ORDER BY tra_nome ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Adicionar indústria ao cliente
app.post('/api/clients/:clientId/industries', async (req, res) => {
    try {
        const { clientId } = req.params;
        const data = req.body;

        const query = `
            INSERT INTO cli_ind (
                cli_codigo, cli_forcodigo, 
                cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, 
                cli_desc6, cli_desc7, cli_desc8, cli_desc9, cli_desc10, 
                cli_transportadora, cli_prazopg, cli_ipi, cli_tabela, 
                cli_codcliind, cli_obsparticular, cli_comprador, 
                cli_frete, cli_emailcomprador, cli_desc11
            ) VALUES (
                $1, $2, 
                $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, 
                $13, $14, $15, $16, 
                $17, $18, $19, 
                $20, $21, $22
            ) RETURNING *
        `;

        const values = [
            clientId, data.cli_forcodigo,
            data.cli_desc1 || 0, data.cli_desc2 || 0, data.cli_desc3 || 0,
            data.cli_desc4 || 0, data.cli_desc5 || 0, data.cli_desc6 || 0,
            data.cli_desc7 || 0, data.cli_desc8 || 0, data.cli_desc9 || 0,
            data.cli_desc10 || 0,
            data.cli_transportadora || null,
            data.cli_prazopg || '',
            data.cli_ipi || '',
            data.cli_tabela || '',
            data.cli_codcliind || '',
            data.cli_obsparticular || '',
            data.cli_comprador || '',
            data.cli_frete || '',
            data.cli_emailcomprador || '',
            data.cli_desc11 || 0
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error("Erro ao salvar indústria:", error);
        res.status(500).json({ success: false, message: `Erro ao salvar: ${error.message}` });
    }
});

// Atualizar dados da indústria
app.put('/api/clients/:clientId/industries/:industryId', async (req, res) => {
    try {
        const { industryId } = req.params;
        const data = req.body;

        const query = `
            UPDATE cli_ind SET
                cli_desc1 = $1, cli_desc2 = $2, cli_desc3 = $3, 
                cli_desc4 = $4, cli_desc5 = $5, cli_desc6 = $6, 
                cli_desc7 = $7, cli_desc8 = $8, cli_desc9 = $9, 
                cli_desc10 = $10, cli_transportadora = $11, 
                cli_prazopg = $12, cli_ipi = $13, cli_tabela = $14, 
                cli_codcliind = $15, cli_obsparticular = $16, 
                cli_comprador = $17, cli_frete = $18, 
                cli_emailcomprador = $19, cli_desc11 = $20
            WHERE cli_lancamento = $21
            RETURNING *
        `;

        const values = [
            data.cli_desc1 || 0, data.cli_desc2 || 0, data.cli_desc3 || 0,
            data.cli_desc4 || 0, data.cli_desc5 || 0, data.cli_desc6 || 0,
            data.cli_desc7 || 0, data.cli_desc8 || 0, data.cli_desc9 || 0,
            data.cli_desc10 || 0, data.cli_transportadora || null,
            data.cli_prazopg || '', data.cli_ipi || '', data.cli_tabela || '',
            data.cli_codcliind || '', data.cli_obsparticular || '',
            data.cli_comprador || '', data.cli_frete || '',
            data.cli_emailcomprador || '', data.cli_desc11 || 0,
            industryId
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao atualizar: ${error.message}` });
    }
});

// Excluir indústria
app.delete('/api/clients/:clientId/industries/:industryId', async (req, res) => {
    try {
        const { industryId } = req.params;
        await pool.query('DELETE FROM cli_ind WHERE cli_lancamento = $1', [industryId]);
        res.json({ success: true, message: 'Registro excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Erro ao excluir: ${error.message}` });
    }
});


// AUX - Listar Vendedores (Combobox)
app.get('/api/aux/vendedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_nome');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend rodando!' });
});

// --- AREAS OF ACTIVITY ENDPOINTS ---

// Get all available areas (for combobox)
app.get('/api/areas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM area_atu ORDER BY atu_descricao');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar áreas de atuação' });
    }
});

// Get areas for a specific client
app.get('/api/clients/:id/areas', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                ac.atu_idcli, 
                ac.atu_atuaid, 
                aa.atu_descricao 
            FROM atua_cli ac
            JOIN area_atu aa ON ac.atu_atuaid = aa.atu_id
            WHERE ac.atu_idcli = $1
            ORDER BY aa.atu_descricao
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar áreas do cliente' });
    }
});

// Add area to client
app.post('/api/clients/:id/areas', async (req, res) => {
    try {
        const { id } = req.params;
        const { areaId } = req.body; // Expects atu_atuaid

        if (!areaId) return res.status(400).json({ error: 'Area ID is required' });

        // Check availability
        const check = await pool.query(
            'SELECT 1 FROM atua_cli WHERE atu_idcli = $1 AND atu_atuaid = $2',
            [id, areaId]
        );
        if (check.rowCount > 0) {
            return res.status(409).json({ error: 'Cliente já possui esta área vinculada' });
        }

        await pool.query(
            'INSERT INTO atua_cli (atu_idcli, atu_atuaid) VALUES ($1, $2)',
            [id, areaId]
        );
        res.status(201).json({ message: 'Área adicionada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar área' });
    }
});

// Remove area from client
app.delete('/api/clients/:id/areas/:areaId', async (req, res) => {
    try {
        const { id, areaId } = req.params;
        await pool.query(
            'DELETE FROM atua_cli WHERE atu_idcli = $1 AND atu_atuaid = $2',
            [id, areaId]
        );
        res.json({ message: 'Área removida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover área' });
    }
});


// GET - List all discount groups (for combobox) - MUST BE BEFORE PARAMETERIZED ROUTES
app.get('/api/discount-groups', async (req, res) => {
    try {
        console.log('📋 Fetching discount groups...');
        const result = await pool.query('SELECT gru_codigo, gru_nome FROM grupos ORDER BY gru_nome');
        console.log(`✅ Found ${result.rows.length} groups:`, result.rows.slice(0, 3));
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching groups:', err.message);
        res.status(500).json({ error: 'Erro ao buscar grupos de desconto' });
    }
});

// Get client discount groups
app.get('/api/clients/:id/discounts', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                cd.cli_codigo,
                cd.cli_forcodigo,
                cd.cli_grupo,
                f.for_nomered as industria,
                g.gru_nome as grupo_nome,
                cd.cli_desc1,
                cd.cli_desc2,
                cd.cli_desc3,
                cd.cli_desc4,
                cd.cli_desc5,
                cd.cli_desc6,
                cd.cli_desc7,
                cd.cli_desc8,
                cd.cli_desc9
            FROM cli_descpro cd
            LEFT JOIN fornecedores f ON f.for_codigo = cd.cli_forcodigo
            LEFT JOIN grupos g ON g.gru_codigo = cd.cli_grupo
            WHERE cd.cli_codigo = $1
            ORDER BY f.for_nomered, g.gru_nome
        `, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar grupos de desconto' });
    }
});

// POST - Create new discount group for client
app.post('/api/clients/:id/discounts', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const query = `
            INSERT INTO cli_descpro (
                cli_codigo, cli_forcodigo, cli_grupo,
                cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                cli_desc6, cli_desc7, cli_desc8, cli_desc9
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            id,
            data.cli_forcodigo,
            data.cli_grupo,
            data.cli_desc1 || 0,
            data.cli_desc2 || 0,
            data.cli_desc3 || 0,
            data.cli_desc4 || 0,
            data.cli_desc5 || 0,
            data.cli_desc6 || 0,
            data.cli_desc7 || 0,
            data.cli_desc8 || 0,
            data.cli_desc9 || 0
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar grupo de desconto' });
    }
});

// PUT - Update discount group
app.put('/api/clients/:clientId/discounts/:forcodigo/:grupo', async (req, res) => {
    try {
        const { clientId, forcodigo, grupo } = req.params;
        const data = req.body;

        const query = `
            UPDATE cli_descpro SET
                cli_desc1 = $1,
                cli_desc2 = $2,
                cli_desc3 = $3,
                cli_desc4 = $4,
                cli_desc5 = $5,
                cli_desc6 = $6,
                cli_desc7 = $7,
                cli_desc8 = $8,
                cli_desc9 = $9
            WHERE cli_codigo = $10 AND cli_forcodigo = $11 AND cli_grupo = $12
            RETURNING *
        `;

        const values = [
            data.cli_desc1 || 0,
            data.cli_desc2 || 0,
            data.cli_desc3 || 0,
            data.cli_desc4 || 0,
            data.cli_desc5 || 0,
            data.cli_desc6 || 0,
            data.cli_desc7 || 0,
            data.cli_desc8 || 0,
            data.cli_desc9 || 0,
            clientId,
            forcodigo,
            grupo
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo de desconto não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar grupo de desconto' });
    }
});

// DELETE - Remove discount group
app.delete('/api/clients/:clientId/discounts/:forcodigo/:grupo', async (req, res) => {
    try {
        const { clientId, forcodigo, grupo } = req.params;
        const result = await pool.query(
            'DELETE FROM cli_descpro WHERE cli_codigo = $1 AND cli_forcodigo = $2 AND cli_grupo = $3 RETURNING *',
            [clientId, forcodigo, grupo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo de desconto não encontrado' });
        }

        res.json({ success: true, message: 'Grupo de desconto excluído com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir grupo de desconto' });
    }
});



// ==================== CLIENT INDUSTRIES (PROSPECÇÃO) ====================

// GET - List industries for a client
app.get('/api/clients/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                ci.cli_lancamento,
                ci.cli_codigo,
                ci.cli_forcodigo,
                ci.cli_desc1,
                ci.cli_desc2,
                ci.cli_desc3,
                ci.cli_desc4,
                ci.cli_desc5,
                ci.cli_desc6,
                ci.cli_desc7,
                ci.cli_desc8,
                ci.cli_prazopg,
                ci.cli_transportadora,
                f.for_nomered as fornecedor_nome,
                t.for_nomered as transportadora_nome
            FROM cli_ind ci
            LEFT JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
            LEFT JOIN fornecedores t ON t.for_codigo = ci.cli_transportadora
            WHERE ci.cli_codigo = $1
            ORDER BY f.for_nomered
        `, [id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erro ao buscar indústrias' });
    }
});

// POST - Add industry to client
app.post('/api/clients/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const { cli_forcodigo } = req.body;

        const result = await pool.query(`
            INSERT INTO cli_ind (cli_codigo, cli_forcodigo)
            VALUES ($1, $2)
            RETURNING *
        `, [id, cli_forcodigo]);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar indústria' });
    }
});

// DELETE - Remove industry from client
app.delete('/api/clients/:id/industries/:forcodigo', async (req, res) => {
    try {
        const { id, forcodigo } = req.params;
        await pool.query(
            'DELETE FROM cli_ind WHERE cli_codigo = $1 AND cli_forcodigo = $2',
            [id, forcodigo]
        );
        res.json({ success: true, message: 'Indústria removida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover indústria' });
    }
});

// ==================== CRUD VENDEDORES (SELLERS) ====================

// GET - Listar todos os vendedores
app.get('/api/sellers', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        let query = 'SELECT * FROM vendedores WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtro de busca
        if (search) {
            query += ` AND (ven_nome ILIKE $${paramCount} OR ven_cpf ILIKE $${paramCount} OR ven_email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Ordenação
        query += ' ORDER BY ven_nome';

        // Paginação
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM vendedores WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (search) {
            countQuery += ` AND (ven_nome ILIKE $${countParamCount} OR ven_cpf ILIKE $${countParamCount} OR ven_email ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
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
            message: `Erro ao buscar vendedores: ${error.message}`
        });
    }
});

// GET - Buscar vendedor por ID
app.get('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM vendedores WHERE ven_codigo = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendedor não encontrado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Criar novo vendedor
app.post('/api/sellers', async (req, res) => {
    try {
        const seller = req.body;

        // Validação: nome é obrigatório
        if (!seller.ven_nome || seller.ven_nome.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'O nome do vendedor é obrigatório'
            });
        }

        const query = `
            INSERT INTO vendedores (
                ven_nome, ven_endereco, ven_bairro, ven_cidade, ven_cep, ven_uf,
                ven_fone1, ven_fone2, ven_obs, ven_cpf, ven_comissao, ven_email,
                ven_nomeusu, ven_aniversario, ven_rg, ven_ctps, ven_filiacao,
                ven_pis, ven_filhos, ven_codusu, ven_imagem, gid
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            ) RETURNING *
        `;

        const values = [
            seller.ven_nome,
            seller.ven_endereco || '',
            seller.ven_bairro || '',
            seller.ven_cidade || '',
            seller.ven_cep || '',
            seller.ven_uf || '',
            seller.ven_fone1 || '',
            seller.ven_fone2 || '',
            seller.ven_obs || '',
            seller.ven_cpf || '',
            seller.ven_comissao || null,
            seller.ven_email || '',
            seller.ven_nomeusu || '',
            seller.ven_aniversario || '',
            seller.ven_rg || '',
            seller.ven_ctps || '',
            seller.ven_filiacao || '',
            seller.ven_pis || '',
            seller.ven_filhos || null,
            seller.ven_codusu || null,
            seller.ven_imagem || '',
            seller.gid || ''
        ];

        const result = await pool.query(query, values);
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Vendedor criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar vendedor: ${error.message}`
        });
    }
});

// PUT - Atualizar vendedor
app.put('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const seller = req.body;

        // Validação: nome é obrigatório
        if (!seller.ven_nome || seller.ven_nome.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'O nome do vendedor é obrigatório'
            });
        }

        const query = `
            UPDATE vendedores SET
                ven_nome = $1, ven_endereco = $2, ven_bairro = $3, ven_cidade = $4,
                ven_cep = $5, ven_uf = $6, ven_fone1 = $7, ven_fone2 = $8,
                ven_obs = $9, ven_cpf = $10, ven_comissao = $11, ven_email = $12,
                ven_nomeusu = $13, ven_aniversario = $14, ven_rg = $15, ven_ctps = $16,
                ven_filiacao = $17, ven_pis = $18, ven_filhos = $19, ven_codusu = $20,
                ven_imagem = $21
            WHERE ven_codigo = $22
            RETURNING *
        `;

        const values = [
            seller.ven_nome,
            seller.ven_endereco || '',
            seller.ven_bairro || '',
            seller.ven_cidade || '',
            seller.ven_cep || '',
            seller.ven_uf || '',
            seller.ven_fone1 || '',
            seller.ven_fone2 || '',
            seller.ven_obs || '',
            seller.ven_cpf || '',
            seller.ven_comissao || null,
            seller.ven_email || '',
            seller.ven_nomeusu || '',
            seller.ven_aniversario || '',
            seller.ven_rg || '',
            seller.ven_ctps || '',
            seller.ven_filiacao || '',
            seller.ven_pis || '',
            seller.ven_filhos || null,
            seller.ven_codusu || null,
            seller.ven_imagem || '',
            id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendedor não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vendedor atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar vendedor: ${error.message}`
        });
    }
});

// DELETE - Excluir vendedor
app.delete('/api/sellers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM vendedores WHERE ven_codigo = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendedor não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Vendedor excluído com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao excluir vendedor: ${error.message}`
        });
    }
});

// ==================== SELLER INDUSTRIES/COMMISSIONS ENDPOINTS ====================

// GET - Listar indústrias e comissões de um vendedor
app.get('/api/sellers/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                vi.vin_industria,
                vi.vin_codigo,
                vi.vin_percom,
                f.for_nomered,
                f.for_nome
            FROM vendedor_ind vi
            INNER JOIN fornecedores f ON vi.vin_industria = f.for_codigo
            WHERE vi.vin_codigo = $1
            ORDER BY f.for_nomered
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar indústrias do vendedor: ${error.message}`
        });
    }
});

// POST - Adicionar indústria/comissão ao vendedor
app.post('/api/sellers/:id/industries', async (req, res) => {
    try {
        const { id } = req.params;
        const { vin_industria, vin_percom } = req.body;

        const query = `
            INSERT INTO vendedor_ind (vin_codigo, vin_industria, vin_percom)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [id, vin_industria, vin_percom || 0];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Indústria adicionada com sucesso!'
        });
    } catch (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Esta indústria já está cadastrada para este vendedor'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao adicionar indústria: ${error.message}`
        });
    }
});

// PUT - Atualizar comissão de uma indústria
app.put('/api/sellers/:id/industries/:industryId', async (req, res) => {
    try {
        const { id, industryId } = req.params;
        const { vin_percom } = req.body;

        const query = `
            UPDATE vendedor_ind
            SET vin_percom = $1
            WHERE vin_codigo = $2 AND vin_industria = $3
            RETURNING *
        `;

        const result = await pool.query(query, [vin_percom || 0, id, industryId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Indústria não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Comissão atualizada com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar comissão: ${error.message}`
        });
    }
});

// DELETE - Remover indústria do vendedor
app.delete('/api/sellers/:id/industries/:industryId', async (req, res) => {
    try {
        const { id, industryId } = req.params;

        const result = await pool.query(
            'DELETE FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2 RETURNING *',
            [id, industryId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Indústria não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            message: 'Indústria removida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao remover indústria: ${error.message}`
        });
    }
});

// GET customers who have purchased from a specific supplier
app.get('/api/suppliers/:id/customers', async (req, res) => {
    try {
        const supplierId = req.params.id;

        const query = `
            SELECT 
                c.cli_codigo,
                c.cli_nomred,
                MAX(p.ped_data) as ultima_compra,
                SUM(p.ped_totliq) as total_compras,
                COUNT(p.ped_pedido) as qtd_pedidos
            FROM clientes c
            INNER JOIN pedidos p ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_industria = $1
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY c.cli_codigo, c.cli_nomred
            ORDER BY total_compras DESC
        `;

        const result = await pool.query(query, [supplierId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching supplier customers:', error);
        res.status(500).json({ error: error.message });
    }
});


// GET industries purchased by a specific client
app.get('/api/clients/:id/purchased-industries', async (req, res) => {
    try {
        const clientId = req.params.id;

        const query = `
            SELECT 
                p.ped_pedido,
                p.ped_data,
                p.ped_totliq,
                f.for_nomered,
                p.ped_cliente,
                p.ped_industria
            FROM pedidos p
            LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_cliente = $1 
              AND p.ped_situacao IN ('P', 'F')
            ORDER BY p.ped_data DESC, f.for_nomered
        `;

        const result = await pool.query(query, [clientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching client purchased industries:', error);
        res.status(500).json({ error: error.message });
    }
});


// ==================== SELLER REGIONS ENDPOINTS ====================

// GET - Listar regiões do vendedor
app.get('/api/sellers/:id/regions', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                vr.vin_codigo,
                vr.vin_regiao,
                r.reg_descricao,
                r.reg_codigo
            FROM vendedor_reg vr
            INNER JOIN regioes r ON r.reg_codigo = vr.vin_regiao
            WHERE vr.vin_codigo = $1
            ORDER BY r.reg_descricao
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar regiões: ${error.message}`
        });
    }
});

// POST - Adicionar região ao vendedor
app.post('/api/sellers/:id/regions', async (req, res) => {
    try {
        const { id } = req.params;
        const { vin_regiao } = req.body;

        if (!vin_regiao) {
            return res.status(400).json({
                success: false,
                message: 'Região é obrigatória'
            });
        }

        const query = `
            INSERT INTO vendedor_reg (vin_codigo, vin_regiao, gid)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(query, [id, vin_regiao, null]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Região adicionada com sucesso!'
        });
    } catch (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Esta região já está cadastrada para este vendedor'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao adicionar região: ${error.message}`
        });
    }
});

// DELETE - Remover região do vendedor
app.delete('/api/sellers/:id/regions/:regionId', async (req, res) => {
    try {
        const { id, regionId } = req.params;

        const result = await pool.query(
            'DELETE FROM vendedor_reg WHERE vin_codigo = $1 AND vin_regiao = $2 RETURNING *',
            [id, regionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Região não encontrada para este vendedor'
            });
        }

        res.json({
            success: true,
            message: 'Região removida com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao remover região: ${error.message}`
        });
    }
});

// ==================== REGIONS ENDPOINTS ====================

// GET - Listar todas as regiões disponíveis
app.get('/api/regions', async (req, res) => {
    console.log('📍 Endpoint /api/regions chamado!');
    try {
        const query = `
            SELECT 
                reg_codigo,
                reg_descricao
            FROM regioes
            ORDER BY reg_descricao
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar regiões: ${error.message}`
        });
    }
});

// ==================== PRODUCT GROUPS ENDPOINTS ====================

// GET - Listar todos os grupos de produtos
app.get('/api/product-groups', async (req, res) => {
    try {
        const query = `
            SELECT 
                gru_codigo,
                gru_descricao,
                gru_compreposto
            FROM grupos
            ORDER BY gru_descricao
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupos: ${error.message}`
        });
    }
});

// GET - Buscar grupo por ID
app.get('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM grupos WHERE gru_codigo = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao buscar grupo: ${error.message}`
        });
    }
});

// POST - Criar novo grupo
app.post('/api/product-groups', async (req, res) => {
    try {
        const { gru_descricao, gru_compreposto } = req.body;

        if (!gru_descricao) {
            return res.status(400).json({
                success: false,
                message: 'Descrição é obrigatória'
            });
        }

        const query = `
            INSERT INTO grupos (gru_descricao, gru_compreposto)
            VALUES ($1, $2)
            RETURNING *
        `;

        const result = await pool.query(query, [
            gru_descricao,
            gru_compreposto || 0
        ]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo criado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao criar grupo: ${error.message}`
        });
    }
});

// PUT - Atualizar grupo
app.put('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { gru_descricao, gru_compreposto } = req.body;

        if (!gru_descricao) {
            return res.status(400).json({
                success: false,
                message: 'Descrição é obrigatória'
            });
        }

        const query = `
            UPDATE grupos
            SET gru_descricao = $1,
                gru_compreposto = $2
            WHERE gru_codigo = $3
            RETURNING *
        `;

        const result = await pool.query(query, [
            gru_descricao,
            gru_compreposto || 0,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Grupo atualizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar grupo: ${error.message}`
        });
    }
});

// DELETE - Excluir grupo
app.delete('/api/product-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM grupos WHERE gru_codigo = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Grupo não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Grupo excluído com sucesso!'
        });
    } catch (error) {
        // Check for foreign key constraint
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir este grupo pois ele está sendo utilizado'
            });
        }

        res.status(500).json({
            success: false,
            message: `Erro ao excluir grupo: ${error.message}`
        });
    }
});


// ==================== ORDERS MODULE ENDPOINTS ====================

// GET - List active industries for orders with order count
app.get('/api/orders/industries', async (req, res) => {
    try {
        const query = `
            SELECT 
                f.for_codigo, 
                f.for_nomered,
                COUNT(p.ped_pedido) as total_pedidos
            FROM fornecedores f
            LEFT JOIN pedidos p ON f.for_codigo = p.ped_industria
            WHERE f.for_tipo2 = 'A'
            GROUP BY f.for_codigo, f.for_nomered
            ORDER BY f.for_nomered ASC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List active clients for orders (for combobox)
app.get('/api/orders/clients', async (req, res) => {
    try {
        const query = `
            SELECT cli_codigo, cli_nomred, cli_cnpj
            FROM clientes
            WHERE cli_tipopes = 'A'
            ORDER BY cli_nomred ASC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - List orders with filters
app.get('/api/orders', async (req, res) => {
    try {
        const {
            industria,
            cliente,
            ignorarIndustria,
            pesquisa,
            situacao,
            dataInicio,
            dataFim,
            limit
        } = req.query;

        console.log('📦 [ORDERS] Fetching orders with filters:', {
            industria,
            cliente,
            ignorarIndustria,
            pesquisa,
            situacao,
            dataInicio,
            dataFim,
            limit
        });

        // Build dynamic query
        let query = `
            SELECT
                p.*,
                c.cli_nomred,
                c.cli_nome,
                f.for_nomered,
                (SELECT COALESCE(SUM(i.ite_quant), 0) FROM itens_ped i WHERE i.ite_pedido = p.ped_pedido) as ped_total_quant
            FROM pedidos p
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE 1 = 1
    `;

        const params = [];
        let paramIndex = 1;

        // Filter by industry (if not ignoring)
        if (industria && ignorarIndustria !== 'true') {
            query += ` AND p.ped_industria = $${paramIndex} `;
            params.push(parseInt(industria));
            paramIndex++;
        }

        // Filter by client (if provided)
        if (cliente) {
            query += ` AND p.ped_cliente = $${paramIndex} `;
            params.push(parseInt(cliente));
            paramIndex++;
        }

        // Filter by search term (order number or client name)
        if (pesquisa) {
            query += ` AND(
        p.ped_pedido ILIKE $${paramIndex} OR
                c.cli_nomred ILIKE $${paramIndex}
    )`;
            params.push(`% ${pesquisa}% `);
            paramIndex++;
        }

        // Filter by situation (if not 'Z' = All)
        if (situacao && situacao !== 'Z') {
            query += ` AND p.ped_situacao = $${paramIndex} `;
            params.push(situacao);
            paramIndex++;
        }

        // Filter by date range
        if (dataInicio) {
            query += ` AND p.ped_data >= $${paramIndex} `;
            params.push(dataInicio);
            paramIndex++;
        }

        if (dataFim) {
            query += ` AND p.ped_data <= $${paramIndex} `;
            params.push(dataFim);
            paramIndex++;
        }

        // Order by date descending
        query += ` ORDER BY p.ped_data DESC`;

        // Limit results (default 700)
        const limitValue = limit || 700;
        query += ` LIMIT $${paramIndex} `;
        params.push(parseInt(limitValue));

        console.log('📦 [ORDERS] Executing query with params:', params);

        const result = await pool.query(query, params);

        console.log(`📦[ORDERS] Found ${result.rows.length} orders`);

        res.json({
            success: true,
            pedidos: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar pedidos: ${error.message} `
        });
    }
});

// GET - Estatísticas dos pedidos usando função do PostgreSQL
app.get('/api/orders/stats', async (req, res) => {
    try {
        const { dataInicio, dataFim, industria } = req.query;

        console.log('📊 [STATS] Fetching order stats:', { dataInicio, dataFim, industria });

        const query = `SELECT * FROM get_orders_stats($1, $2, $3)`;
        const params = [
            dataInicio || null,
            dataFim || null,
            industria ? parseInt(industria) : null
        ];

        const result = await pool.query(query, params);

        if (result.rows.length > 0) {
            const stats = result.rows[0];
            res.json({
                success: true,
                data: {
                    total_vendido: parseFloat(stats.total_vendido),
                    total_quantidade: parseFloat(stats.total_quantidade),
                    total_clientes: parseInt(stats.total_clientes),
                    ticket_medio: parseFloat(stats.ticket_medio)
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    total_vendido: 0,
                    total_quantidade: 0,
                    total_clientes: 0,
                    ticket_medio: 0
                }
            });
        }
    } catch (error) {
        console.error('❌ [STATS] Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao buscar estatísticas: ${error.message} `
        });
    }
});

// POST - Criar novo pedido
app.post('/api/orders', async (req, res) => {
    try {
        const {
            ped_data,
            ped_situacao,
            ped_cliente,
            ped_transp,
            ped_vendedor,
            ped_condpag,
            ped_comprador,
            ped_nffat, // Número do pedido do cliente
            ped_tipofrete,
            ped_tabela,
            ped_industria,
            ped_cliind,
            ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
            ped_sex, ped_set, ped_oit, ped_nov
        } = req.body;

        console.log('📝 [ORDERS] Creating new order - UNIQUE CHECK 5555:', req.body);

        // Validações obrigatórias
        if (!ped_cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente é obrigatório'
            });
        }

        if (!ped_vendedor) {
            return res.status(400).json({
                success: false,
                message: 'Vendedor é obrigatório'
            });
        }

        if (!ped_industria) {
            return res.status(400).json({
                success: false,
                message: 'Indústria é obrigatória'
            });
        }

        if (!ped_tabela) {
            return res.status(400).json({
                success: false,
                message: 'Tabela de preço é obrigatória'
            });
        }

        // Gerar número do pedido
        // Temporariamente usando "HS" (Hamilton Silva) - futuramente virá do login
        const userInitials = "HS";

        // Buscar próximo número sequencial
        const seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
        const pedNumero = seqResult.rows[0].next_num;

        // Formatar: HS + 000001 (6 dígitos com zeros à esquerda)
        const pedPedido = userInitials + pedNumero.toString().padStart(6, '0');

        console.log(`📝[ORDERS] Generated order number: ${pedPedido} (${userInitials} + ${pedNumero})`);

        // Inserir pedido
        const query = `
            INSERT INTO pedidos(
        ped_numero,
        ped_pedido,
        ped_data,
        ped_situacao,
        ped_cliente,
        ped_transp,
        ped_vendedor,
        ped_condpag,
        ped_comprador,
        ped_nffat,
        ped_tipofrete,
        ped_tabela,
        ped_industria,
        ped_cliind,
        ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
        ped_sex, ped_set, ped_oit, ped_nov,
        ped_totbruto,
        ped_totliq,
        ped_totalipi,
        ped_obs
    ) VALUES(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27
    ) RETURNING *
        `;

        const now = new Date();
        const values = [
            pedNumero,
            pedPedido,
            ped_data || now.toISOString().split('T')[0],
            ped_situacao || 'P',
            ped_cliente,
            ped_transp || 0,
            ped_vendedor,
            ped_condpag || '',
            ped_comprador || '',
            ped_nffat || '',
            ped_tipofrete || 'C',
            ped_tabela,
            ped_industria,
            ped_cliind || '',
            ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
            ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
            0, // ped_totbruto
            0, // ped_totliq
            0, // ped_totalipi
            req.body.ped_obs || ''
        ];

        const result = await pool.query(query, values);

        console.log(`✅[ORDERS] Order created successfully: ${pedPedido} `);

        res.json({
            success: true,
            message: `Pedido ${pedPedido} criado com sucesso!`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error creating order:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao criar pedido: ${error.message} `
        });
    }
});


// PUT - Atualizar pedido existente
app.put('/api/orders/:pedPedido', async (req, res) => {
    try {
        const { pedPedido } = req.params;
        const {
            ped_data,
            ped_situacao,
            ped_cliente,
            ped_transp,
            ped_vendedor,
            ped_condpag,
            ped_comprador,
            ped_nffat,
            ped_tipofrete,
            ped_tabela,
            ped_industria,
            ped_cliind,
            ped_pri, ped_seg, ped_ter, ped_qua, ped_qui,
            ped_sex, ped_set, ped_oit, ped_nov,
            ped_obs
        } = req.body;

        console.log(`📝[ORDERS] Updating order: ${pedPedido} `, req.body);

        const query = `
            UPDATE pedidos SET
ped_data = $1,
    ped_situacao = $2,
    ped_cliente = $3,
    ped_transp = $4,
    ped_vendedor = $5,
    ped_condpag = $6,
    ped_comprador = $7,
    ped_nffat = $8,
    ped_tipofrete = $9,
    ped_tabela = $10,
    ped_industria = $11,
    ped_cliind = $12,
    ped_pri = $13, ped_seg = $14, ped_ter = $15, ped_qua = $16, ped_qui = $17,
    ped_sex = $18, ped_set = $19, ped_oit = $20, ped_nov = $21,
    ped_obs = $22
            WHERE ped_pedido = $23
RETURNING *
    `;

        const values = [
            ped_data,
            ped_situacao,
            ped_cliente,
            ped_transp,
            ped_vendedor,
            ped_condpag,
            ped_comprador,
            ped_nffat,
            ped_tipofrete,
            ped_tabela,
            ped_industria,
            ped_cliind || '',
            ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
            ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
            ped_obs || '',
            pedPedido
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        console.log(`✅[ORDERS] Order updated successfully: ${pedPedido} `);

        res.json({
            success: true,
            message: `Pedido ${pedPedido} atualizado com sucesso!`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [ORDERS] Error updating order:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao atualizar pedido: ${error.message} `
        });
    }
});

// ==================== END ORDERS MODULE ====================

// Load orders endpoints
require('./orders_endpoints')(app, pool);
require('./ia_order_endpoints')(app, pool);
require('./order_items_endpoints')(app, pool);
require('./order_print_endpoints')(app, pool);
require('./email_endpoints')(app, pool);
require('./pdf_save_endpoints')(app, pool);
require('./crm_endpoints')(app, pool);
app.use('/api/financeiro', require('./financial_endpoints')(pool)); // Financial Module
app.use('/api', require('./parametros_endpoints')(pool));
app.use('/api', require('./price_tables_endpoints')(pool)); // Register Price Tables Endpoints

app.use('/api/suppliers', require('./suppliers_endpoints')(pool));
app.use('/api/clients', require('./clients_endpoints')(pool));
app.use('/api/sellers', require('./vendedores_endpoints')(pool));
app.use('/api/reports', require('./reports_endpoints')(pool));
app.use('/api/metas', require('./metas_endpoints')(pool)); // Dashboard de Metas
require('./narratives_endpoints')(app);

app.listen(PORT, () => {

    console.log(`🚀 Backend rodando na porta ${PORT} - UNIQUE CHECK 3002`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});
