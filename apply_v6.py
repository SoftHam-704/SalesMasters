import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

print('Aplicando correção: itab_industria -> itab_idindustria')

with open('backend/sql/fix_fn_upsert_preco_v6.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

try:
    cur.execute(sql)
    conn.commit()
    print('✅ Função corrigida com sucesso!')
except Exception as e:
    print(f'❌ Erro: {e}')
    conn.rollback()

conn.close()
