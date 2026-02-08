
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        schema = 'ro_consult'
        
        print(f"Testing query for supplier 8 in {schema}...")
        
        # This is the exact query from suppliers_endpoints.js lines 140-161
        query = f"""
                SELECT 
                    for_codigo as id,
                    for_cnpj as cnpj,
                    for_inscricao as inscricao,
                    for_razao as "razaoSocial",
                    for_nomered as nome,
                    for_nomered as "nomeReduzido",
                    for_situacao as situacao,
                    for_endereco as endereco,
                    for_bairro as bairro,
                    for_cidade as cidade,
                    for_uf as uf,
                    for_cep as cep,
                    for_telefone as telefone,
                    for_email as email,
                    for_obs2 as obs2,
                    for_homepage,
                    for_locimagem,
                    for_fax
                FROM {schema}.fornecedores
                WHERE for_codigo = 8
        """
        
        try:
            cur.execute(query)
            row = cur.fetchone()
            if row:
                print("✅ Query successful!")
                print("Result:", row)
            else:
                print("⚠️ Query returned no rows for ID 8")
        except Exception as qe:
            print(f"❌ Query Error: {qe}")

        conn.close()
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    run()
