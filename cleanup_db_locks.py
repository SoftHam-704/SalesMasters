import psycopg2
import os
from dotenv import load_dotenv

def cleanup_db():
    try:
        # DB Config from .env
        host = "node254557-salesmaster.sp1.br.saveincloud.net.br"
        port = 13062
        user = "webadmin"
        password = "ytAyO0u043"
        database = "basesales"
        
        print(f"📡 Conectando ao banco {database} em {host}...")
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # SQL para matar queries que estão rodando há mais de 30 segundos (provável causa dos 504)
        kill_query = """
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query_start < now() - interval '30 seconds'
          AND pid <> pg_backend_pid();
        """
        
        print("⚡ Matando queries travadas (>30s)...")
        cur.execute(kill_query)
        killed_count = cur.rowcount
        print(f"✅ Sucesso! {killed_count} conexões travadas foram encerradas.")
        
        # Limpar o pool de conexões inativas se necessário
        cur.execute("DISCARD ALL;")
        
        cur.close()
        conn.close()
        print("🔌 Conexão encerrada.")
        
    except Exception as e:
        print(f"❌ Erro ao limpar o banco: {str(e)}")

if __name__ == "__main__":
    cleanup_db()
