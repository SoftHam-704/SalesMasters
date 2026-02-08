
import psycopg2

# Tentar uma string DSN direta e simples
# Evitando passar argumentos extras kwargs que podem triggering o erro
DSN = "host=localhost dbname=basesales user=postgres password=postgres port=5432"

try:
    print("Tentando conexão básica...")
    conn = psycopg2.connect(DSN)
    conn.autocommit = True
    
    # Define encoding UTF8 na sessão imediatamente
    cur = conn.cursor()
    cur.execute("SET client_encoding TO 'UTF8'")
    
    print("Lendo script SQL...")
    with open("clone_schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    print("Executando Script no Banco...")
    cur.execute(sql)
    
    print("\n✅ SCRIPT EXECUTADO COM SUCESSO via Python!")
    conn.close()

except Exception as e:
    print(f"\n❌ FALHA: {e}")
    # Se falhar, avisa onde está o arquivo
    import os
    print(f"👉 Por favor, execute o arquivo manualmente: {os.path.abspath('clone_schema.sql')}")
