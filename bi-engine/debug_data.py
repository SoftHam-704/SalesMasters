import sys
import os

# Adiciona diretório atual ao path para importar módulos
sys.path.append(os.getcwd())

try:
    from services.database import execute_query
    print("Conectado ao módulo DB.")
    
    # Check Pedidos
    print("Consultando Pedidos...")
    df_ped = execute_query("SELECT MIN(ped_data) as primeira, MAX(ped_data) as ultima, COUNT(*) as total FROM pedidos")
    print("PEDIDOS:", df_ped.to_dict('records'))

    # Check totals for 2025 (P/F)
    df_totals = execute_query("SELECT SUM(ped_totliq) as valor, COUNT(*) as qtd FROM pedidos WHERE EXTRACT(YEAR FROM ped_data) = 2025 AND ped_situacao IN ('P', 'F')")
    print("TOTALS 2025:", df_totals.to_dict('records'))

    # List columns cad_prod
    df_cols = execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'cad_prod'")
    print("COLUMNS CAD_PROD:", df_cols['column_name'].tolist())

    # List columns pedidos
    df_cols_ped = execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos'")
    print("COLUMNS PEDIDOS:", df_cols_ped['column_name'].tolist())

    # List columns itens_ped
    df_cols_items = execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'itens_ped'")
    print("COLUMNS ITENS_PED:", df_cols_items['column_name'].tolist())

    # List columns vw_produtos_precos
    df_cols_vw = execute_query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vw_produtos_precos'")
    print("COLUMNS VW_PRECOS:", df_cols_vw['column_name'].tolist())

    # List all tables
    df_tables = execute_query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    print("ALL TABLES:", df_tables['table_name'].tolist())

except Exception as e:
    print(f"Erro: {e}")
