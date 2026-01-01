const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // ============================================
    // PLANO DE CONTAS
    // ============================================

    // GET all - Árvore hierárquica
    router.get('/plano-contas', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    id,
                    codigo,
                    descricao,
                    tipo,
                    nivel,
                    id_pai,
                    ativo
                FROM fin_plano_contas
                WHERE ativo = true
                ORDER BY codigo
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching plano de contas:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET by ID
    router.get('/plano-contas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query(
                'SELECT * FROM fin_plano_contas WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Conta não encontrada' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create
    router.post('/plano-contas', async (req, res) => {
        try {
            const { codigo, descricao, tipo, nivel, id_pai } = req.body;

            const result = await pool.query(`
                INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [codigo, descricao, tipo, nivel, id_pai || null]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update
    router.put('/plano-contas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo, descricao, tipo, nivel, id_pai, ativo } = req.body;

            const result = await pool.query(`
                UPDATE fin_plano_contas 
                SET codigo = $1, descricao = $2, tipo = $3, nivel = $4, id_pai = $5, ativo = $6
                WHERE id = $7
                RETURNING *
            `, [codigo, descricao, tipo, nivel, id_pai || null, ativo, id]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Soft delete
    router.delete('/plano-contas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE fin_plano_contas SET ativo = false WHERE id = $1', [id]);
            res.json({ success: true, message: 'Conta inativada com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // CENTRO DE CUSTO
    // ============================================

    router.get('/centro-custo', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, codigo, descricao, ativo
                FROM fin_centro_custo
                WHERE ativo = true
                ORDER BY descricao
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.get('/centro-custo/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT * FROM fin_centro_custo WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Centro de custo não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/centro-custo', async (req, res) => {
        try {
            const { codigo, descricao } = req.body;

            const result = await pool.query(`
                INSERT INTO fin_centro_custo (codigo, descricao)
                VALUES ($1, $2)
                RETURNING *
            `, [codigo, descricao]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.put('/centro-custo/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo, descricao, ativo } = req.body;

            const result = await pool.query(`
                UPDATE fin_centro_custo 
                SET codigo = $1, descricao = $2, ativo = $3
                WHERE id = $4
                RETURNING *
            `, [codigo, descricao, ativo, id]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.delete('/centro-custo/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE fin_centro_custo SET ativo = false WHERE id = $1', [id]);
            res.json({ success: true, message: 'Centro de custo inativado com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // CLIENTES FINANCEIROS
    // ============================================

    router.get('/clientes', async (req, res) => {
        try {
            const { search } = req.query;
            let query = `
                SELECT id, tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia, 
                       cidade, uf, telefone, celular, email, ativo
                FROM fin_clientes
                WHERE ativo = true
            `;
            const params = [];

            if (search) {
                query += ` AND (nome_razao ILIKE $1 OR cpf_cnpj ILIKE $1)`;
                params.push(`%${search}%`);
            }

            query += ` ORDER BY nome_razao LIMIT 50`;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.get('/clientes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT * FROM fin_clientes WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/clientes', async (req, res) => {
        try {
            const {
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes
            } = req.body;

            const result = await pool.query(`
                INSERT INTO fin_clientes (
                    tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                    endereco, numero, complemento, bairro, cidade, uf, cep,
                    telefone, celular, email, observacoes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.put('/clientes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const {
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes, ativo
            } = req.body;

            const result = await pool.query(`
                UPDATE fin_clientes SET
                    tipo_pessoa = $1, cpf_cnpj = $2, nome_razao = $3, nome_fantasia = $4,
                    endereco = $5, numero = $6, complemento = $7, bairro = $8,
                    cidade = $9, uf = $10, cep = $11, telefone = $12, celular = $13,
                    email = $14, observacoes = $15, ativo = $16
                WHERE id = $17
                RETURNING *
            `, [
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes, ativo, id
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.delete('/clientes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE fin_clientes SET ativo = false WHERE id = $1', [id]);
            res.json({ success: true, message: 'Cliente inativado com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // FORNECEDORES FINANCEIROS
    // ============================================

    router.get('/fornecedores', async (req, res) => {
        try {
            const { search } = req.query;
            let query = `
                SELECT id, tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                       cidade, uf, telefone, celular, email, ativo
                FROM fin_fornecedores
                WHERE ativo = true
            `;
            const params = [];

            if (search) {
                query += ` AND (nome_razao ILIKE $1 OR cpf_cnpj ILIKE $1)`;
                params.push(`%${search}%`);
            }

            query += ` ORDER BY nome_razao LIMIT 50`;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.get('/fornecedores/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('SELECT * FROM fin_fornecedores WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/fornecedores', async (req, res) => {
        try {
            const {
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes
            } = req.body;

            const result = await pool.query(`
                INSERT INTO fin_fornecedores (
                    tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                    endereco, numero, complemento, bairro, cidade, uf, cep,
                    telefone, celular, email, observacoes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.put('/fornecedores/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const {
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes, ativo
            } = req.body;

            const result = await pool.query(`
                UPDATE fin_fornecedores SET
                    tipo_pessoa = $1, cpf_cnpj = $2, nome_razao = $3, nome_fantasia = $4,
                    endereco = $5, numero = $6, complemento = $7, bairro = $8,
                    cidade = $9, uf = $10, cep = $11, telefone = $12, celular = $13,
                    email = $14, observacoes = $15, ativo = $16
                WHERE id = $17
                RETURNING *
            `, [
                tipo_pessoa, cpf_cnpj, nome_razao, nome_fantasia,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                telefone, celular, email, observacoes, ativo, id
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.delete('/fornecedores/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE fin_fornecedores SET ativo = false WHERE id = $1', [id]);
            res.json({ success: true, message: 'Fornecedor inativado com sucesso' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // CONTAS A PAGAR
    // ============================================

    // GET all with filters
    router.get('/contas-pagar', async (req, res) => {
        try {
            const {
                dataInicio,
                dataFim,
                status,
                idFornecedor,
                idPlanoContas,
                idCentroCusto
            } = req.query;

            let query = `
                SELECT 
                    cp.id,
                    cp.descricao,
                    cp.numero_documento,
                    cp.valor_total,
                    cp.valor_pago,
                    cp.data_emissao,
                    cp.data_vencimento,
                    cp.data_pagamento,
                    cp.status,
                    cp.observacoes,
                    f.nome_razao as fornecedor_nome,
                    pc.descricao as plano_contas_descricao,
                    cc.descricao as centro_custo_descricao,
                    (cp.valor_total - cp.valor_pago) as saldo
                FROM fin_contas_pagar cp
                LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
                LEFT JOIN fin_plano_contas pc ON cp.id_plano_contas = pc.id
                LEFT JOIN fin_centro_custo cc ON cp.id_centro_custo = cc.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (dataInicio) {
                query += ` AND cp.data_vencimento >= $${paramIndex}`;
                params.push(dataInicio);
                paramIndex++;
            }

            if (dataFim) {
                query += ` AND cp.data_vencimento <= $${paramIndex}`;
                params.push(dataFim);
                paramIndex++;
            }

            if (status) {
                query += ` AND cp.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (idFornecedor) {
                query += ` AND cp.id_fornecedor = $${paramIndex}`;
                params.push(idFornecedor);
                paramIndex++;
            }

            if (idPlanoContas) {
                query += ` AND cp.id_plano_contas = $${paramIndex}`;
                params.push(idPlanoContas);
                paramIndex++;
            }

            if (idCentroCusto) {
                query += ` AND cp.id_centro_custo = $${paramIndex}`;
                params.push(idCentroCusto);
                paramIndex++;
            }

            query += ` ORDER BY cp.data_vencimento DESC, cp.id DESC`;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching contas a pagar:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET by ID with parcels
    router.get('/contas-pagar/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const contaResult = await pool.query(`
                SELECT 
                    cp.*,
                    f.nome_razao as fornecedor_nome,
                    pc.descricao as plano_contas_descricao,
                    cc.descricao as centro_custo_descricao
                FROM fin_contas_pagar cp
                LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
                LEFT JOIN fin_plano_contas pc ON cp.id_plano_contas = pc.id
                LEFT JOIN fin_centro_custo cc ON cp.id_centro_custo = cc.id
                WHERE cp.id = $1
            `, [id]);

            if (contaResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Conta não encontrada' });
            }

            const parcelasResult = await pool.query(`
                SELECT * FROM fin_parcelas_pagar
                WHERE id_conta_pagar = $1
                ORDER BY numero_parcela
            `, [id]);

            res.json({
                success: true,
                data: {
                    ...contaResult.rows[0],
                    parcelas: parcelasResult.rows
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create with automatic parcels
    router.post('/contas-pagar', async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                descricao,
                id_fornecedor,
                numero_documento,
                valor_total,
                data_emissao,
                data_vencimento,
                observacoes,
                id_plano_contas,
                id_centro_custo,
                criado_por,
                numero_parcelas = 1,
                intervalo_dias = 30
            } = req.body;

            // Create main conta
            const contaResult = await client.query(`
                INSERT INTO fin_contas_pagar (
                    descricao, id_fornecedor, numero_documento, valor_total,
                    data_emissao, data_vencimento, observacoes,
                    id_plano_contas, id_centro_custo, criado_por
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                descricao, id_fornecedor, numero_documento, valor_total,
                data_emissao, data_vencimento, observacoes,
                id_plano_contas, id_centro_custo, criado_por
            ]);

            const contaId = contaResult.rows[0].id;

            // Generate parcels automatically
            if (numero_parcelas > 1) {
                const valorParcela = parseFloat((valor_total / numero_parcelas).toFixed(2));
                let somaTotal = 0;

                for (let i = 1; i <= numero_parcelas; i++) {
                    const isUltima = (i === numero_parcelas);
                    const valor = isUltima ? (valor_total - somaTotal) : valorParcela;

                    const dataVenc = new Date(data_vencimento);
                    dataVenc.setDate(dataVenc.getDate() + ((i - 1) * intervalo_dias));

                    await client.query(`
                        INSERT INTO fin_parcelas_pagar (
                            id_conta_pagar, numero_parcela, valor, data_vencimento
                        )
                        VALUES ($1, $2, $3, $4)
                    `, [contaId, i, valor, dataVenc.toISOString().split('T')[0]]);

                    somaTotal += valor;
                }
            } else {
                // Single parcel
                await client.query(`
                    INSERT INTO fin_parcelas_pagar (
                        id_conta_pagar, numero_parcela, valor, data_vencimento
                    )
                    VALUES ($1, 1, $2, $3)
                `, [contaId, valor_total, data_vencimento]);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Conta criada com ${numero_parcelas} parcela(s)`,
                data: contaResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating conta:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    // POST - Baixa (Payment)
    router.post('/contas-pagar/:id/baixa', async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const {
                id_parcela,
                data_pagamento,
                valor_pago,
                juros = 0,
                desconto = 0,
                observacoes
            } = req.body;

            // Update parcel
            await client.query(`
                UPDATE fin_parcelas_pagar
                SET 
                    data_pagamento = $1,
                    valor_pago = $2,
                    juros = $3,
                    desconto = $4,
                    status = 'PAGO',
                    observacoes = $5
                WHERE id = $6
            `, [data_pagamento, valor_pago, juros, desconto, observacoes, id_parcela]);

            // Recalculate conta status
            const parcelasResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as pagas,
                    COALESCE(SUM(valor_pago), 0) as total_pago
                FROM fin_parcelas_pagar
                WHERE id_conta_pagar = $1
            `, [id]);

            const { total, pagas, total_pago } = parcelasResult.rows[0];
            const novStatus = (parseInt(total) === parseInt(pagas)) ? 'PAGO' : 'ABERTO';

            await client.query(`
                UPDATE fin_contas_pagar
                SET 
                    valor_pago = $1,
                    status = $2,
                    data_pagamento = CASE WHEN $2 = 'PAGO' THEN $3 ELSE NULL END
                WHERE id = $4
            `, [total_pago, novStatus, data_pagamento, id]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Pagamento registrado com sucesso'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error processing payment:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    // GET Vencidas
    router.get('/contas-pagar/status/vencidas', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    cp.*,
                    f.nome_razao as fornecedor_nome,
                    (CURRENT_DATE - cp.data_vencimento) as dias_atraso
                FROM fin_contas_pagar cp
                LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
                WHERE cp.status IN ('ABERTO', 'VENCIDO')
                AND cp.data_vencimento < CURRENT_DATE
                ORDER BY cp.data_vencimento
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET A Vencer (próximos 30 dias)
    router.get('/contas-pagar/status/a-vencer', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    cp.*,
                    f.nome_razao as fornecedor_nome,
                    (cp.data_vencimento - CURRENT_DATE) as dias_falta
                FROM fin_contas_pagar cp
                LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
                WHERE cp.status = 'ABERTO'
                AND cp.data_vencimento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
                ORDER BY cp.data_vencimento
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // CONTAS A RECEBER
    // ============================================

    // GET all with filters
    router.get('/contas-receber', async (req, res) => {
        try {
            const {
                dataInicio,
                dataFim,
                status,
                idCliente,
                idPlanoContas,
                idCentroCusto
            } = req.query;

            let query = `
                SELECT 
                    cr.id,
                    cr.descricao,
                    cr.numero_documento,
                    cr.valor_total,
                    cr.valor_recebido,
                    cr.data_emissao,
                    cr.data_vencimento,
                    cr.data_recebimento,
                    cr.status,
                    cr.observacoes,
                    c.nome_razao as cliente_nome,
                    pc.descricao as plano_contas_descricao,
                    cc.descricao as centro_custo_descricao,
                    (cr.valor_total - cr.valor_recebido) as saldo
                FROM fin_contas_receber cr
                LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
                LEFT JOIN fin_plano_contas pc ON cr.id_plano_contas = pc.id
                LEFT JOIN fin_centro_custo cc ON cr.id_centro_custo = cc.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (dataInicio) {
                query += ` AND cr.data_vencimento >= $${paramIndex}`;
                params.push(dataInicio);
                paramIndex++;
            }

            if (dataFim) {
                query += ` AND cr.data_vencimento <= $${paramIndex}`;
                params.push(dataFim);
                paramIndex++;
            }

            if (status) {
                query += ` AND cr.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (idCliente) {
                query += ` AND cr.id_cliente = $${paramIndex}`;
                params.push(idCliente);
                paramIndex++;
            }

            if (idPlanoContas) {
                query += ` AND cr.id_plano_contas = $${paramIndex}`;
                params.push(idPlanoContas);
                paramIndex++;
            }

            if (idCentroCusto) {
                query += ` AND cr.id_centro_custo = $${paramIndex}`;
                params.push(idCentroCusto);
                paramIndex++;
            }

            query += ` ORDER BY cr.data_vencimento DESC, cr.id DESC`;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching contas a receber:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET by ID with parcels
    router.get('/contas-receber/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const contaResult = await pool.query(`
                SELECT 
                    cr.*,
                    c.nome_razao as cliente_nome,
                    pc.descricao as plano_contas_descricao,
                    cc.descricao as centro_custo_descricao
                FROM fin_contas_receber cr
                LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
                LEFT JOIN fin_plano_contas pc ON cr.id_plano_contas = pc.id
                LEFT JOIN fin_centro_custo cc ON cr.id_centro_custo = cc.id
                WHERE cr.id = $1
            `, [id]);

            if (contaResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Conta não encontrada' });
            }

            const parcelasResult = await pool.query(`
                SELECT * FROM fin_parcelas_receber
                WHERE id_conta_receber = $1
                ORDER BY numero_parcela
            `, [id]);

            res.json({
                success: true,
                data: {
                    ...contaResult.rows[0],
                    parcelas: parcelasResult.rows
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create with automatic parcels
    router.post('/contas-receber', async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                descricao,
                id_cliente,
                numero_documento,
                valor_total,
                data_emissao,
                data_vencimento,
                observacoes,
                id_plano_contas,
                id_centro_custo,
                criado_por,
                numero_parcelas = 1,
                intervalo_dias = 30
            } = req.body;

            // Create main conta
            const contaResult = await client.query(`
                INSERT INTO fin_contas_receber (
                    descricao, id_cliente, numero_documento, valor_total,
                    data_emissao, data_vencimento, observacoes,
                    id_plano_contas, id_centro_custo, criado_por
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                descricao, id_cliente, numero_documento, valor_total,
                data_emissao, data_vencimento, observacoes,
                id_plano_contas, id_centro_custo, criado_por
            ]);

            const contaId = contaResult.rows[0].id;

            // Generate parcels automatically
            if (numero_parcelas > 1) {
                const valorParcela = parseFloat((valor_total / numero_parcelas).toFixed(2));
                let somaTotal = 0;

                for (let i = 1; i <= numero_parcelas; i++) {
                    const isUltima = (i === numero_parcelas);
                    const valor = isUltima ? (valor_total - somaTotal) : valorParcela;

                    const dataVenc = new Date(data_vencimento);
                    dataVenc.setDate(dataVenc.getDate() + ((i - 1) * intervalo_dias));

                    await client.query(`
                        INSERT INTO fin_parcelas_receber (
                            id_conta_receber, numero_parcela, valor, data_vencimento
                        )
                        VALUES ($1, $2, $3, $4)
                    `, [contaId, i, valor, dataVenc.toISOString().split('T')[0]]);

                    somaTotal += valor;
                }
            } else {
                // Single parcel
                await client.query(`
                    INSERT INTO fin_parcelas_receber (
                        id_conta_receber, numero_parcela, valor, data_vencimento
                    )
                    VALUES ($1, 1, $2, $3)
                `, [contaId, valor_total, data_vencimento]);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Conta criada com ${numero_parcelas} parcela(s)`,
                data: contaResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating conta a receber:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    // POST - Baixa (Receipt)
    router.post('/contas-receber/:id/baixa', async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const {
                id_parcela,
                data_recebimento,
                valor_recebido,
                juros = 0,
                desconto = 0,
                observacoes
            } = req.body;

            // Update parcel
            await client.query(`
                UPDATE fin_parcelas_receber
                SET 
                    data_recebimento = $1,
                    valor_recebido = $2,
                    juros = $3,
                    desconto = $4,
                    status = 'RECEBIDO',
                    observacoes = $5
                WHERE id = $6
            `, [data_recebimento, valor_recebido, juros, desconto, observacoes, id_parcela]);

            // Recalculate conta status
            const parcelasResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'RECEBIDO' THEN 1 END) as recebidas,
                    COALESCE(SUM(valor_recebido), 0) as total_recebido
                FROM fin_parcelas_receber
                WHERE id_conta_receber = $1
            `, [id]);

            const { total, recebidas, total_recebido } = parcelasResult.rows[0];
            const novStatus = (parseInt(total) === parseInt(recebidas)) ? 'RECEBIDO' : 'ABERTO';

            await client.query(`
                UPDATE fin_contas_receber
                SET 
                    valor_recebido = $1,
                    status = $2,
                    data_recebimento = CASE WHEN $2 = 'RECEBIDO' THEN $3 ELSE NULL END
                WHERE id = $4
            `, [total_recebido, novStatus, data_recebimento, id]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Recebimento registrado com sucesso'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error processing receipt:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    // GET Vencidas (Overdue)
    router.get('/contas-receber/status/vencidas', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    cr.*,
                    c.nome_razao as cliente_nome,
                    (CURRENT_DATE - cr.data_vencimento) as dias_atraso
                FROM fin_contas_receber cr
                LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
                WHERE cr.status IN ('ABERTO', 'VENCIDO')
                AND cr.data_vencimento < CURRENT_DATE
                ORDER BY cr.data_vencimento
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET A Vencer (próximos 30 dias)
    router.get('/contas-receber/status/a-vencer', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT 
                    cr.*,
                    c.nome_razao as cliente_nome,
                    (cr.data_vencimento - CURRENT_DATE) as dias_falta
                FROM fin_contas_receber cr
                LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
                WHERE cr.status = 'ABERTO'
                AND cr.data_vencimento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
                ORDER BY cr.data_vencimento
            `);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ============================================
    // RELATÓRIOS FINANCEIROS
    // ============================================

    // GET Fluxo de Caixa
    router.get('/relatorios/fluxo-caixa', async (req, res) => {
        try {
            const { dataInicio, dataFim, agrupamento = 'DIARIO' } = req.query;

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'Data início e data fim são obrigatórias'
                });
            }

            const result = await pool.query(
                'SELECT * FROM get_fluxo_caixa($1, $2, $3)',
                [dataInicio, dataFim, agrupamento.toUpperCase()]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching fluxo de caixa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET Relatório Contas a Pagar
    router.get('/relatorios/contas-pagar', async (req, res) => {
        try {
            const {
                dataInicio,
                dataFim,
                status,
                idFornecedor,
                idCentroCusto
            } = req.query;

            const result = await pool.query(
                'SELECT * FROM get_relatorio_contas_pagar($1, $2, $3, $4, $5)',
                [
                    dataInicio || null,
                    dataFim || null,
                    status || null,
                    idFornecedor ? parseInt(idFornecedor) : null,
                    idCentroCusto ? parseInt(idCentroCusto) : null
                ]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching relatório contas a pagar:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET Relatório Contas a Receber
    router.get('/relatorios/contas-receber', async (req, res) => {
        try {
            const {
                dataInicio,
                dataFim,
                status,
                idCliente,
                idCentroCusto
            } = req.query;

            const result = await pool.query(
                'SELECT * FROM get_relatorio_contas_receber($1, $2, $3, $4, $5)',
                [
                    dataInicio || null,
                    dataFim || null,
                    status || null,
                    idCliente ? parseInt(idCliente) : null,
                    idCentroCusto ? parseInt(idCentroCusto) : null
                ]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching relatório contas a receber:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET DRE Simples
    router.get('/relatorios/dre', async (req, res) => {
        try {
            const { mes, ano } = req.query;

            if (!mes || !ano) {
                return res.status(400).json({
                    success: false,
                    message: 'Mês e ano são obrigatórios'
                });
            }

            const result = await pool.query(
                'SELECT * FROM get_dre_simples($1, $2)',
                [parseInt(mes), parseInt(ano)]
            );

            // Group results by type for easier frontend consumption
            const receitas = result.rows.filter(r => r.tipo === 'R');
            const despesas = result.rows.filter(r => r.tipo === 'D');

            const totalReceitas = receitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
            const totalDespesas = despesas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
            const resultadoLiquido = totalReceitas - totalDespesas;

            res.json({
                success: true,
                data: {
                    receitas,
                    despesas,
                    totais: {
                        receitas: totalReceitas,
                        despesas: totalDespesas,
                        resultado: resultadoLiquido
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching DRE:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};


