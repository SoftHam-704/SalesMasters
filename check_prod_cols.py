
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
        print(f"🔍 Sample data from '{schema}.pedidos':")
        # Tentamos buscar pedidos que tenham algo no campo ped_cliind
        cur.execute(f"SELECT ped_pedido, ped_cliente, ped_cliind FROM {schema}.pedidos WHERE ped_cliind IS NOT NULL AND ped_cliind != '' LIMIT 5")
        rows = cur.fetchall()
        if not rows:
            print("  (Nenhum dado encontrado com ped_cliind preenchido, tentando geral)")
            cur.execute(f"SELECT ped_pedido, ped_cliente, ped_cliind FROM {schema}.pedidos LIMIT 5")
            rows = cur.fetchall()
            
        for r in rows:
            print(f"  - Pedido: {r[0]} | Cliente ID: {r[1]} | Campo 'ped_cliind': {r[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
