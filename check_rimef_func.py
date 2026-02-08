import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

print('📋 Definição da função rimef.fn_upsert_preco:')
cur.execute("""
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_upsert_preco' AND n.nspname = 'rimef'
""")
func_def = cur.fetchone()
if func_def:
    print(func_def[0])
else:
    print('Função não encontrada em rimef!')

conn.close()
