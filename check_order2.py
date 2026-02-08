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

# Verificar tipo e valor real
cur.execute("""
    SELECT ite_seq, ite_produto, ite_idproduto, pg_typeof(ite_idproduto) as tipo
    FROM itens_ped 
    WHERE TRIM(ite_pedido) = 'PB906044'
    LIMIT 5
""")
print('SEQ | CODIGO | ID_PROD | TIPO')
for row in cur.fetchall():
    id_val = repr(row[2])
    print(f'{row[0]} | {row[1]} | {id_val} | {row[3]}')

# Comparar com cad_prod
print('\n--- Verificar se códigos existem em cad_prod ---')
cur.execute("""
    SELECT pro_id, pro_codprod, pro_codigonormalizado 
    FROM cad_prod 
    WHERE pro_codprod IN ('7015', '7088', '5051')
    LIMIT 5
""")
rows = cur.fetchall()
if rows:
    for row in rows:
        print(f'ID: {row[0]} | Código: {row[1]} | Normalizado: {row[2]}')
else:
    print('NENHUM produto encontrado com esses códigos!')
    
    # Tentar buscar com LIKE
    print('\n--- Buscando produtos similares ---')
    cur.execute("""
        SELECT pro_id, pro_codprod, pro_codigonormalizado 
        FROM cad_prod 
        WHERE pro_codprod LIKE '%7015%' OR pro_codigonormalizado LIKE '%7015%'
        LIMIT 5
    """)
    for row in cur.fetchall():
        print(f'ID: {row[0]} | Código: {row[1]} | Normalizado: {row[2]}')

conn.close()
