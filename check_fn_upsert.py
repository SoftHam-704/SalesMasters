import psycopg2

conn = psycopg2.connect(
    host='node254557-salesmaster.sp1.br.saveincloud.net.br',
    port=13062,
    database='basesales',
    user='webadmin',
    password='ytAyO0u043'
)

cur = conn.cursor()

print('=' * 80)
print('Verificando função fn_upsert_preco')
print('=' * 80)

# Verificar em quais schemas a função existe
cur.execute("""
    SELECT n.nspname as schema, p.proname as function, oidvectortypes(p.proargtypes) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_upsert_preco'
    ORDER BY n.nspname
""")

results = cur.fetchall()
if results:
    print(f'\nFunção encontrada em {len(results)} schema(s):')
    for r in results:
        print(f'   {r[0]}.{r[1]}')
        print(f'      Args: {r[2][:80]}...' if len(r[2]) > 80 else f'      Args: {r[2]}')
else:
    print('\n❌ Função fn_upsert_preco NÃO encontrada em nenhum schema!')

# Verificar se rimef existe
cur.execute("""
    SELECT nspname FROM pg_namespace WHERE nspname = 'rimef'
""")
if cur.fetchone():
    print('\n✅ Schema rimef existe')
else:
    print('\n❌ Schema rimef NÃO existe!')

# Buscar definição da função em outro schema
print('\n📋 Buscando definição da função em public ou repsoma...')
cur.execute("""
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_upsert_preco'
    AND n.nspname IN ('public', 'repsoma')
    LIMIT 1
""")
func_def = cur.fetchone()
if func_def:
    print('✅ Definição encontrada!')
    print('\n' + func_def[0][:500] + '...')
else:
    print('❌ Definição não encontrada em public ou repsoma')

conn.close()
