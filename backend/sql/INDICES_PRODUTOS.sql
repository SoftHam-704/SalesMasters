-- =====================================================
-- INDICES_PRODUTOS.sql
-- =====================================================

-- 1. Tabela itens_ped
-- Usado para filtrar por produto, pedido e fazer joins
CREATE INDEX IF NOT EXISTS idx_itens_ped_produto ON itens_ped(ite_idproduto);
CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido ON itens_ped(ite_pedido);
CREATE INDEX IF NOT EXISTS idx_itens_ped_industria ON itens_ped(ite_industria);

-- 2. Tabela cad_prod
-- Usado para agrupar por grupo e buscar detalhes
CREATE INDEX IF NOT EXISTS idx_cad_prod_grupo ON cad_prod(pro_grupo);
CREATE INDEX IF NOT EXISTS idx_cad_prod_status ON cad_prod(pro_status);

-- 3. Tabela grupos
-- Usado para joins de nome de grupo
CREATE INDEX IF NOT EXISTS idx_grupos_codigo ON grupos(gru_codigo);

-- 4. Tabela pedidos (Indices gerais já devem existir, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_pedidos_data_situacao ON pedidos(ped_data, ped_situacao);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(ped_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_industria ON pedidos(ped_industria);
