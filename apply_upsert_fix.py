import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

print('Aplicando fix fn_upsert_preco com 13 parâmetros...')

with open('backend/sql/fix_fn_upsert_preco_v5.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

try:
    cur.execute(sql)
    conn.commit()
    print('✅ Função atualizada com sucesso!')
    
    # Verificar resultado
    cur.execute("""
        SELECT n.nspname, pronargs
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'fn_upsert_preco'
        ORDER BY n.nspname
    """)
    
    print('\nSchema          | Num Params')
    print('-' * 35)
    for row in cur.fetchall():
        status = '✅' if row[1] == 13 else '❌'
        print(f'{row[0]:<15} | {row[1]} {status}')
        
except Exception as e:
    print(f'❌ Erro: {e}')
    conn.rollback()

conn.close()
