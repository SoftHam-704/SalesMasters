
-- ==============================================================================
-- SALESMASTERS BI - SCRIPT DE AJUSTE PARA PRODUÇÃO (REPSOMA)
-- Finalidade: Normalizar códigos, vincular catálogo e criar Views de Performance
-- ==============================================================================

-- 1. NORMALIZAÇÃO DE CÓDIGOS
-- Preenche a coluna ite_codigonormalizado para permitir o vínculo com o catálogo
UPDATE repsoma.itens_ped 
SET ite_codigonormalizado = public.fn_normalizar_codigo(ite_produto) 
WHERE ite_codigonormalizado IS NULL;

-- 2. VÍNCULO COM O CATÁLOGO (cad_prod)
-- Vincula os itens vendidos aos IDs do catálogo usando Código + Indústria (trava de segurança)
UPDATE repsoma.itens_ped i
SET ite_idproduto = p.pro_id
FROM public.cad_prod p
WHERE i.ite_codigonormalizado = p.pro_codigonormalizado 
  AND i.ite_industria = p.pro_industria
  AND i.ite_idproduto IS NULL;

-- 3. CRIAÇÃO DAS VIEWS DE PERFORMANCE (SCHEMA REPSOMA)
-- Redireciona as views do BI para olhar para os dados do schema repsoma

-- 3.1 View de Performance Mensal
CREATE OR REPLACE VIEW repsoma.vw_performance_mensal AS
SELECT 
    EXTRACT(year FROM ped_data) AS ano,
    EXTRACT(month FROM ped_data) AS mes,
    ped_industria AS industry_id,
    sum(ped_totliq) AS valor_total,
    count(DISTINCT ped_numero) AS qtd_pedidos,
    count(DISTINCT ped_cliente) AS clientes_ativos,
    avg(ped_totliq) AS ticket_medio
FROM repsoma.pedidos
WHERE ped_situacao IN ('P', 'F')
GROUP BY (EXTRACT(year FROM ped_data)), (EXTRACT(month FROM ped_data)), ped_industria;

-- 3.2 View de Métricas por Cliente
CREATE OR REPLACE VIEW repsoma.vw_metricas_cliente AS
SELECT 
    p.ped_cliente AS cliente_id,
    c.cli_nomred AS cliente_nome,
    p.ped_industria AS industry_id,
    (CURRENT_DATE - max(p.ped_data)) AS dias_sem_compra,
    sum(p.ped_totliq) AS valor_total,
    count(p.ped_numero) AS total_pedidos,
    avg(p.ped_totliq) AS ticket_medio
FROM repsoma.pedidos p
JOIN public.clientes c ON p.ped_cliente = c.cli_codigo
WHERE p.ped_situacao IN ('P', 'F')
GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;

-- 4. OTIMIZAÇÃO E ESTATÍSTICAS
-- Atualiza o mapa interno do banco para o BI ficar rápido
ANALYZE repsoma.pedidos;
ANALYZE repsoma.itens_ped;

-- 5. VERIFICAÇÃO FINAL
SELECT 
    'ITENS TOTAIS' as descricao, COUNT(*) as valor FROM repsoma.itens_ped
UNION ALL
SELECT 
    'ITENS VINCULADOS' as descricao, COUNT(ite_idproduto) as valor FROM repsoma.itens_ped
UNION ALL
SELECT 
    'ITENS SEM VÍNCULO' as descricao, COUNT(*) - COUNT(ite_idproduto) as valor FROM repsoma.itens_ped;
