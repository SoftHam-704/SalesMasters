import psycopg2

# Conectar ao banco
conn = psycopg2.connect(
    host="node254557-salesmaster.sp1.br.saveincloud.net.br",
    port=13062,
    database="basesales",
    user="webadmin",
    password="ytAyO0u043"
)

# Usar schema repsoma (ou ajustar conforme necessário)
schema = "repsoma"

cur = conn.cursor()
cur.execute(f"SET search_path TO {schema}")

print("=" * 80)
print(f"DIAGNÓSTICO DE CÓDIGOS - Schema: {schema}")
print("=" * 80)

# 1. Verificar quantos produtos têm código normalizado NULL
print("\n📊 1. PRODUTOS COM CÓDIGO NORMALIZADO NULL:")
cur.execute("""
    SELECT COUNT(*) as total, 
           SUM(CASE WHEN pro_codigonormalizado IS NULL OR pro_codigonormalizado = '' THEN 1 ELSE 0 END) as sem_normalizado
    FROM cad_prod
""")
row = cur.fetchone()
print(f"   Total de produtos: {row[0]}")
print(f"   Sem código normalizado: {row[1]}")
print(f"   Percentual: {(row[1]/row[0]*100) if row[0] > 0 else 0:.1f}%")

# 2. Verificar itens do pedido que têm ite_idproduto NULL
print("\n📊 2. ITENS DE PEDIDO SEM ID DO PRODUTO (últimos 30 dias):")
cur.execute("""
    SELECT COUNT(*) as total,
           SUM(CASE WHEN ite_idproduto IS NULL THEN 1 ELSE 0 END) as sem_id
    FROM itens_ped
    WHERE ite_pedido IN (SELECT ped_pedido FROM pedidos WHERE ped_data >= CURRENT_DATE - 30)
""")
row = cur.fetchone()
print(f"   Total de itens recentes: {row[0]}")
print(f"   Sem ite_idproduto: {row[1]}")

# 3. Exemplo de itens sem ID - pegar códigos de produto
print("\n📊 3. EXEMPLOS DE ITENS SEM ID (amostras):")
cur.execute("""
    SELECT ite_produto, ite_nomeprod, ite_pedido
    FROM itens_ped 
    WHERE ite_idproduto IS NULL
    LIMIT 10
""")
for row in cur.fetchall():
    codigo = row[0]
    nome = row[1][:40] if row[1] else '-'
    pedido = row[2]
    
    # Tentar encontrar na cad_prod
    cur.execute("""
        SELECT pro_id, pro_codprod, pro_codigonormalizado 
        FROM cad_prod 
        WHERE pro_codprod = %s OR pro_codigonormalizado = %s
        LIMIT 1
    """, (codigo, codigo))
    match = cur.fetchone()
    
    if match:
        print(f"   ✅ {codigo} -> Encontrado no cad_prod (ID: {match[0]})")
    else:
        print(f"   ❌ {codigo} ({nome}) -> NÃO encontrado no cad_prod")

# 4. Verificar se itens na tabela de preço têm itab_idprod
print("\n📊 4. TABELA DE PREÇOS - PRODUTOS SEM ID:")
cur.execute("""
    SELECT itab_tabela, COUNT(*) as total, 
           SUM(CASE WHEN itab_idprod IS NULL THEN 1 ELSE 0 END) as sem_id
    FROM cad_tabelaspre
    GROUP BY itab_tabela
    ORDER BY sem_id DESC
    LIMIT 10
""")
print("   Tabela                    | Total  | Sem ID")
print("   " + "-" * 50)
for row in cur.fetchall():
    print(f"   {row[0][:25]:<25} | {row[1]:>6} | {row[2]:>6}")

# 5. Amostra de produtos na tabela de preços sem ligação com cad_prod
print("\n📊 5. EXEMPLO DE PRODUTOS NA TABELA SEM cad_prod:")
cur.execute("""
    SELECT t.itab_tabela, t.itab_idprod, p.pro_codprod, p.pro_codigonormalizado
    FROM cad_tabelaspre t
    LEFT JOIN cad_prod p ON t.itab_idprod = p.pro_id
    WHERE p.pro_id IS NULL
    LIMIT 10
""")
orphans = cur.fetchall()
if orphans:
    for row in orphans:
        print(f"   Tabela: {row[0]} | itab_idprod: {row[1]} -> Produto não existe no cad_prod!")
else:
    print("   ✅ Todos os itab_idprod têm correspondência no cad_prod")

# 6. Verificar ite_codigonormalizado na itens_ped
print("\n📊 6. ITENS_PED - CÓDIGO NORMALIZADO:")
cur.execute("""
    SELECT COUNT(*) as total,
           SUM(CASE WHEN ite_codigonormalizado IS NULL OR ite_codigonormalizado = '' THEN 1 ELSE 0 END) as sem_normalizado
    FROM itens_ped
""")
row = cur.fetchone()
print(f"   Total de itens: {row[0]}")
print(f"   Sem ite_codigonormalizado: {row[1]}")
print(f"   Percentual: {(row[1]/row[0]*100) if row[0] > 0 else 0:.1f}%")

# 7. Comparar: itens sem ID vs itens sem código normalizado
print("\n📊 7. CORRELAÇÃO - Itens sem ID vs sem código normalizado:")
cur.execute("""
    SELECT 
        SUM(CASE WHEN ite_idproduto IS NULL AND (ite_codigonormalizado IS NULL OR ite_codigonormalizado = '') THEN 1 ELSE 0 END) as ambos_null,
        SUM(CASE WHEN ite_idproduto IS NULL AND ite_codigonormalizado IS NOT NULL AND ite_codigonormalizado != '' THEN 1 ELSE 0 END) as id_null_cod_ok,
        SUM(CASE WHEN ite_idproduto IS NOT NULL AND (ite_codigonormalizado IS NULL OR ite_codigonormalizado = '') THEN 1 ELSE 0 END) as id_ok_cod_null
    FROM itens_ped
""")
row = cur.fetchone()
print(f"   Ambos NULL (sem ID e sem código normalizado): {row[0]}")
print(f"   ID NULL mas código normalizado OK: {row[1]}")
print(f"   ID OK mas código normalizado NULL: {row[2]}")

cur.close()
conn.close()

print("\n" + "=" * 80)
print("Diagnóstico concluído.")
