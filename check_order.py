import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()
cur.execute('SET search_path TO ndsrep')

print('=' * 100)
print('PEDIDO PB906044 - Schema: ndsrep')
print('=' * 100)

# Buscar todos os itens do pedido
cur.execute("""
    SELECT ite_seq, ite_produto, ite_idproduto, ite_codigonormalizado, ite_nomeprod, ite_quant
    FROM itens_ped 
    WHERE TRIM(ite_pedido) = 'PB906044'
    ORDER BY ite_seq
""")

rows = cur.fetchall()
print(f'\nTotal de itens: {len(rows)}\n')
print(f"SEQ   | CODIGO          | ID_PROD    | COD_NORMAL      | NOME                                     | QTD")
print('-' * 100)

for row in rows:
    seq = row[0] or '-'
    codigo = (row[1] or '-')[:15]
    id_prod = row[2] if row[2] else 'NULL'
    cod_norm = (row[3] or 'NULL')[:15]
    nome = (row[4] or '-')[:40]
    qtd = row[5] or 0
    print(f"{seq:<5} | {codigo:<15} | {str(id_prod):<10} | {cod_norm:<15} | {nome:<40} | {qtd}")

# Contar quantos têm ID null
null_count = sum(1 for r in rows if r[2] is None)
print(f'\n⚠️ Itens com ite_idproduto NULL: {null_count} de {len(rows)}')

cur.close()
conn.close()
