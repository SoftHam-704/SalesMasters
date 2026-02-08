
import psycopg2
import sys

def run():
    print("🚀 Conectando ao banco...")
    try:
        # Tenta conectar usando LATIN1 para evitar erro de decode do 0xe7 (ç)
        conn = psycopg2.connect(
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432,
            database="basesales",
            client_encoding="UTF8"
        )
        conn.autocommit = True
        cur = conn.cursor()

        print("� Conectado! Criando schema barrosrep...")

        # 1. Criar o schema
        cur.execute("CREATE SCHEMA IF NOT EXISTS barrosrep")
        print("✅ Schema barrosrep garantido.")

        # 2. Pegar todas as tabelas de public
        print("🔍 Listando tabelas do schema public...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"📋 Encontradas {len(tables)} tabelas.")

        # 3. Clonar estrutura de cada tabela
        for table in tables:
            try:
                # Cria a tabela copiando toda a estrutura (indices, constraints, defaults)
                cur.execute(f"CREATE TABLE IF NOT EXISTS barrosrep.{table} (LIKE public.{table} INCLUDING ALL)")
                # sys.stdout.write(f".") # Feedback minimalista
            except Exception as te:
                print(f"\n⚠️ Erro ao clonar tabela {table}: {str(te)}")
        
        print("\n✅ Estruturas de tabelas clonadas.")

        # 4. Copiar dados da tabela user_nomes (apenas usuários de sistema)
        print("👤 Migrando usuários para barrosrep...")
        try:
            # Limpa tabela destino para evitar duplicidade se rodar 2x
            cur.execute("TRUNCATE TABLE barrosrep.user_nomes RESTART IDENTITY CASCADE")
            # Copia os dados
            cur.execute("INSERT INTO barrosrep.user_nomes SELECT * FROM public.user_nomes")
            print(f"✅ Usuários copiados com sucesso ({cur.rowcount} registros).")
        except Exception as ue:
            print(f"⚠️ Erro ao copiar usuários: {str(ue)}")
        
        print("\n" + "="*50)
        print("🎉 SUCESSO! Schema 'barrosrep' está pronto para uso.")
        print("="*50)

        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ ERRO FATAL: {str(e)}")
        # Tentar imprimir traceback se possível
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run()
