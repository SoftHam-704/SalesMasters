import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def link_prods_only():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("--- VINCULANDO ite_idproduto (JOIN DIRETO) ---")

        # Join direto entre itens e catalogo
        # Preferindo pro_codigonormalizado ja preenchido no catalogo
        query = """
            UPDATE ro_consult.itens_ped i
            SET ite_idproduto = c.pro_id
            FROM ro_consult.cad_prod c
            WHERE (i.ite_idproduto = 0 OR i.ite_idproduto IS NULL)
              AND i.ite_industria = c.pro_industria
              AND (
                  i.ite_codigonormalizado = c.pro_codigonormalizado
                  OR 
                  i.ite_codigonormalizado = UPPER(REGEXP_REPLACE(REGEXP_REPLACE(c.pro_codprod, '[^A-Z0-9]', '', 'g'), '^0+', ''))
              )
        """
        cur.execute(query)
        updated = cur.rowcount
        conn.commit()
        print(f"✅ {updated} itens vinculados com sucesso.")

        cur.execute("SELECT COUNT(*) FROM ro_consult.itens_ped WHERE ite_idproduto = 0")
        rem = cur.fetchone()[0]
        print(f"⚠️ Restantes zerados: {rem}")

        conn.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    link_prods_only()
