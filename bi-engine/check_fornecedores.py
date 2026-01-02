from services.database import execute_query

print("Verificando estrutura da tabela fornecedores...")

# Check columns
query_columns = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position
"""
df = execute_query(query_columns)
print("\nColunas da tabela fornecedores:")
print(df)

# Check sample data
query_sample = """
SELECT for_codigo, for_nomered, for_tipo2 
FROM fornecedores 
LIMIT 10
"""
df_sample = execute_query(query_sample)
print("\nAmostra de dados:")
print(df_sample)

# Check active industries
query_active = """
SELECT COUNT(*) as total_ativas
FROM fornecedores 
WHERE for_tipo2 = 'A'
"""
df_active = execute_query(query_active)
print("\nTotal de indústrias ativas (for_tipo2='A'):")
print(df_active)
