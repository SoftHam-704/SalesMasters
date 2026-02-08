import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_dashboard_function():
    conn = psycopg2.connect(**DB_CONFIG)
    # Importante: Definir o schema para ro_consult para simular o ambiente correto
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SET search_path TO ro_consult, public")

    print("--- SIMULANDO DASHBOARD (ANO 2025 COMPLETO) ---")
    
    # Simula a chamada que o Dashboard faz para o ano inteiro (p_month = NULL)
    try:
        cur.execute("SELECT * FROM public.get_dashboard_metrics(2025, NULL, NULL)")
        res = cur.fetchone()
        
        if res:
            print(f"Total Vendido 2025 (Dashboard): R$ {res['total_vendido_current']:,.2f}")
            print(f"Quantidade Vendida: {res['quantidade_vendida_current']:,.0f}")
            print(f"Qtd Pedidos: {res['qtd_pedidos_current']}")
        else:
            print("❌ A função get_dashboard_metrics não retornou dados para 2025.")
            
        # Agora simulando apenas JANEIRO 2025 (p_month = 1)
        print("\n--- SIMULANDO DASHBOARD (JANEIRO 2025) ---")
        cur.execute("SELECT * FROM public.get_dashboard_metrics(2025, 1, NULL)")
        res_jan = cur.fetchone()
        print(f"Total Vendido Jan/2025: R$ {res_jan['total_vendido_current']:,.2f}")

    except Exception as e:
        print(f"❌ Erro ao executar função do Dashboard: {e}")

    conn.close()

if __name__ == "__main__":
    check_dashboard_function()
