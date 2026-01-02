from services.database import execute_query

print("Testando função SQL diretamente...")

# Teste direto
query = "SELECT * FROM fn_analise_curva_abc(2025, 31, NULL)"
result = execute_query(query)

print(f"\nResultado: {len(result)} linhas")
print(result)
