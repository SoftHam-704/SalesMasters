
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        print("🚀 Conectando ao Banco Master na Nuvem...")
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='salesmasters_master',
            user='webadmin',
            password='ytAyO0u043'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("📝 Preparando dados para inserção da BARROS REPRESENTACOES...")

        dados = {
            "cnpj": "60717759000111", # Sem máscara
            "razao_social": "BARROS REPRESENTACOES LTDA",
            "nome_fantasia": "BARROS REPRESENTACOES LTDA",
            "telefone": "1154901675",
            "status": "ATIVO",
            "db_host": "node254557-salesmaster.sp1.br.saveincloud.net.br",
            "db_nome": "basesales",
            "db_usuario": "webadmin",
            "db_senha": "ytAyO0u043", # Senha padrão do user webadmin
            "db_porta": 13062,
            "db_schema": "barrosrep"
        }

        # Query de inserção
        sql = """
            INSERT INTO empresas (
                cnpj, razao_social, nome_fantasia, telefone, status,
                db_host, db_nome, db_usuario, db_senha, db_porta, db_schema
            ) VALUES (
                %(cnpj)s, %(razao_social)s, %(nome_fantasia)s, %(telefone)s, %(status)s,
                %(db_host)s, %(db_nome)s, %(db_usuario)s, %(db_senha)s, %(db_porta)s, %(db_schema)s
            )
            ON CONFLICT (cnpj) DO UPDATE SET
                razao_social = EXCLUDED.razao_social,
                nome_fantasia = EXCLUDED.nome_fantasia,
                db_schema = EXCLUDED.db_schema,
                db_host = EXCLUDED.db_host,
                db_nome = EXCLUDED.db_nome,
                status = EXCLUDED.status;
        """
        
        print(f"🔄 Executando INSERT/UPDATE para CNPJ {dados['cnpj']}...")
        cur.execute(sql, dados)
        
        print("✅ Empresa cadastrada/atualizada com sucesso!")
        
        # Verificar o registro inserido
        cur.execute("SELECT id, razao_social, db_schema FROM empresas WHERE cnpj = %s", (dados['cnpj'],))
        row = cur.fetchone()
        print(f"🔎 Verificação: ID={row[0]}, Nome={row[1]}, Schema={row[2]}")

        conn.close()

    except Exception as e:
        print(f"❌ Erro ao cadastrar empresa: {e}")

if __name__ == "__main__":
    run()
