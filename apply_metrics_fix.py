import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

print("=" * 80)
print("APLICANDO CORREÇÃO: get_dashboard_metrics v5")
print("=" * 80)
print("\n📋 Mudanças:")
print("  1. TOTAL VENDIDO: Agora usa SUM(itens_ped.ite_totliquido)")
print("  2. STATUS: Filtro mudou de '<> C' para IN ('P', 'F')")
print()

# Read the SQL file
with open('backend/sql/fix_dashboard_metrics_v5.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

try:
    cur.execute(sql)
    conn.commit()
    print("✅ Função atualizada com sucesso!")
    
    # Test the function
    print("\n📊 Testando nova função (repsoma, 2026, Janeiro)...")
    cur.execute("SET search_path TO repsoma")
    cur.execute("SELECT * FROM get_dashboard_metrics(2026, 1, NULL)")
    result = cur.fetchone()
    
    if result:
        print(f"\n   Total Vendido (novo): R$ {result[0]:,.2f}")
        print(f"   Quantidade Vendida:   {result[2]:,.0f}")
        print(f"   Clientes Atendidos:   {result[4]}")
        print(f"   Total Pedidos:        {result[6]}")
    
    # Compare with old method
    print("\n📊 Comparação com método antigo (ped_totliq):")
    cur.execute("""
        SELECT 
            SUM(ped_totliq) as old_method,
            (SELECT SUM(i.ite_totliquido) FROM itens_ped i JOIN pedidos p ON p.ped_pedido = i.ite_pedido 
             WHERE p.ped_data >= '2026-01-01' AND p.ped_data <= '2026-01-31' AND p.ped_situacao IN ('P', 'F')) as new_method
        FROM pedidos 
        WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31' AND ped_situacao IN ('P', 'F')
    """)
    compare = cur.fetchone()
    if compare:
        print(f"   Método ANTIGO (ped_totliq):      R$ {compare[0] or 0:,.2f}")
        print(f"   Método NOVO (ite_totliquido):    R$ {compare[1] or 0:,.2f}")
        diff = (compare[1] or 0) - (compare[0] or 0)
        print(f"   Diferença:                       R$ {diff:,.2f}")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    conn.rollback()

cur.close()
conn.close()

print("\n" + "=" * 80)
print("Processo concluído.")
