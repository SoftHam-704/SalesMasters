
import psycopg2

def run_update():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        print("🚀 Iniciando atualização de ite_idproduto...")
        
        # Etapa 1: Normalizar códigos de produtos que estão com ID 0
        print("1/2 Normalizando códigos (ite_codigonormalizado)...")
        cur.execute("""
            UPDATE ro_consult.itens_ped 
            SET ite_codigonormalizado = UPPER(REGEXP_REPLACE(ite_produto, '[^a-zA-Z0-9]', '', 'g')) 
            WHERE ite_idproduto = 0
        """)
        rows1 = cur.rowcount
        print(f"✅ {rows1} códigos normalizados.")
        
        # Etapa 2: Vincular ID do produto buscando na cad_prod
        print("2/2 Vinculando ite_idproduto via cad_prod...")
        cur.execute("""
            UPDATE ro_consult.itens_ped i 
            SET ite_idproduto = p.pro_id 
            FROM ro_consult.cad_prod p 
            WHERE i.ite_codigonormalizado = p.pro_codigonormalizado 
            AND i.ite_industria = p.pro_industria 
            AND i.ite_idproduto = 0
        """)
        rows2 = cur.rowcount
        print(f"✅ {rows2} itens vinculados com sucesso.")
        
        conn.commit()
        conn.close()
        print("\n🎉 Operação finalizada!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == '__main__':
    run_update()
