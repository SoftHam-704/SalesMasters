
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('bi-engine/.env')

def migrate():
    conn = None
    try:
        conn = psycopg2.connect(
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            database=os.getenv('DB_NAME')
        )
        cur = conn.cursor()

        tables = ['fin_plano_contas', 'fin_centro_custo']
        
        for table in tables:
            print(f"\n--- Analisando tabela: {table} ---")
            
            # Verificar se existe no public
            cur.execute(f"SELECT exists (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '{table}')")
            exists_public = cur.fetchone()[0]
            if not exists_public:
                print(f"ERRO: Tabela {table} não existe no schema public.")
                continue

            # Verificar se existe no ro_consult
            cur.execute(f"SELECT exists (SELECT FROM information_schema.tables WHERE table_schema = 'ro_consult' AND table_name = '{table}')")
            exists_ro = cur.fetchone()[0]
            
            if not exists_ro:
                print(f"Criando tabela ro_consult.{table} baseada na estrutura do public...")
                cur.execute(f"CREATE TABLE ro_consult.{table} (LIKE public.{table} INCLUDING ALL)")
                print(f"Tabela ro_consult.{table} criada com sucesso.")
            else:
                print(f"Tabela ro_consult.{table} já existe.")

            # Contar registros no public
            cur.execute(f"SELECT count(*) FROM public.{table}")
            count_public = cur.fetchone()[0]
            print(f"Registros no public.{table}: {count_public}")

            # Limpar dados existentes no ro_consult (opcional, mas seguro para migração limpa se solicitado)
            cur.execute(f"TRUNCATE TABLE ro_consult.{table} CASCADE")
            print(f"Dados antigos em ro_consult.{table} removidos (TRUNCATE).")

            # Migrar dados
            print(f"Migrando dados para ro_consult.{table}...")
            cur.execute(f"INSERT INTO ro_consult.{table} SELECT * FROM public.{table}")
            
            # Verificar contagem final
            cur.execute(f"SELECT count(*) FROM ro_consult.{table}")
            count_ro = cur.fetchone()[0]
            print(f"Migração concluída! Registros no ro_consult.{table}: {count_ro}")

        conn.commit()
        print("\n✅ Todas as migrações foram aplicadas com sucesso.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Erro durante a migração: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    migrate()
