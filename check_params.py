import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

# Verificar quantos parametros cada schema tem
cur.execute("""
    SELECT n.nspname, pronargs
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_upsert_preco'
    ORDER BY n.nspname
""")

print('Schema          | Num Params')
print('-' * 35)
for row in cur.fetchall():
    print(f'{row[0]:<15} | {row[1]}')

# Verificar a definição do public (que deve ser a mais recente)
print('\n📋 Parâmetros do public.fn_upsert_preco:')
cur.execute("""
    SELECT pg_get_function_arguments(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_upsert_preco' AND n.nspname = 'public'
""")
args = cur.fetchone()
if args:
    print(args[0])

conn.close()
