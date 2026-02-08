import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()
cur.execute('SET search_path TO ro_consult')

print('=' * 80)
print('TESTE: ro_consult - Janeiro/2026')
print('=' * 80)

# Usar a funcao
print('\n📊 Resultado da função get_dashboard_metrics(2026, 1):')
cur.execute('SELECT * FROM get_dashboard_metrics(2026, 1, NULL)')
result = cur.fetchone()

if result:
    print(f'   Total Vendido:        R$ {result[0]:,.2f}')
    print(f'   Quantidade Vendida:   {result[2]:,.0f}')
    print(f'   Clientes Atendidos:   {result[4]}')
    print(f'   Total Pedidos:        {result[6]}')

# Comparar metodos
print('\n📊 Comparação detalhada:')
cur.execute("""
    SELECT 
        (SELECT SUM(ped_totliq) FROM pedidos 
         WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31' 
         AND ped_situacao IN ('P', 'F')) as metodo_cabecalho,
        (SELECT SUM(i.ite_totliquido) FROM itens_ped i 
         JOIN pedidos p ON p.ped_pedido = i.ite_pedido 
         WHERE p.ped_data >= '2026-01-01' AND p.ped_data <= '2026-01-31' 
         AND p.ped_situacao IN ('P', 'F')) as metodo_itens
""")
compare = cur.fetchone()
if compare:
    cab = compare[0] or 0
    ite = compare[1] or 0
    print(f'   Método Cabeçalho (ped_totliq):   R$ {cab:,.2f}')
    print(f'   Método Itens (ite_totliquido):   R$ {ite:,.2f}')
    print(f'   Diferença:                       R$ {ite - cab:,.2f}')

# Detalhes por status
print('\n📊 Pedidos por Status (Janeiro/2026):')
cur.execute("""
    SELECT ped_situacao, COUNT(*), SUM(ped_totliq)
    FROM pedidos 
    WHERE ped_data >= '2026-01-01' AND ped_data <= '2026-01-31'
    GROUP BY ped_situacao
    ORDER BY ped_situacao
""")
for row in cur.fetchall():
    status = row[0] or 'NULL'
    qtd = row[1]
    total = row[2] or 0
    print(f'   {status}: {qtd} pedidos = R$ {total:,.2f}')

conn.close()
