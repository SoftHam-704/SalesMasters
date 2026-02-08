
import psycopg2
import sys

def run():
    print("🚀 Conectando ao banco para criar schema brasil_wl...")
    try:
        conn = psycopg2.connect(
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432,
            database="basesales",
            client_encoding="LATIN1" 
        )
        conn.autocommit = True
        cur = conn.cursor()

        print(" Criando schema brasil_wl...")
        cur.execute("CREATE SCHEMA IF NOT EXISTS brasil_wl")
        
        print("🔍 Listando tabelas do schema public...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"📋 Encontradas {len(tables)} tabelas.")

        print("🔄 Clonando estruturas...")
        for table in tables:
            try:
                cur.execute(f"CREATE TABLE IF NOT EXISTS brasil_wl.{table} (LIKE public.{table} INCLUDING ALL)")
            except Exception as te:
                print(f"⚠️ Erro ao clonar tabela {table}: {str(te)}")
        
        # Copiar usuarios base (admin)
        print("👤 Copiando usuários do sistema...")
        try:
            cur.execute("TRUNCATE TABLE brasil_wl.user_nomes RESTART IDENTITY CASCADE")
            cur.execute("INSERT INTO brasil_wl.user_nomes SELECT * FROM public.user_nomes")
        except Exception as ue:
            print(f"⚠️ Erro ao copiar usuários: {str(ue)}")
            
        print("✅ Schema brasil_wl criado com sucesso.")
        conn.close()

    except Exception as e:
        print(f"❌ ERRO: {str(e)}")

if __name__ == "__main__":
    run()
