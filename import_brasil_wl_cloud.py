
import pandas as pd
import psycopg2
import sys
import numpy as np
import os

# CONFIGURAÇÃO DE NUVEM (baseada no sucesso anterior)
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = 13062
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASS = "ytAyO0u043"
SCHEMA = "brasil_wl"

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def get_db_columns(cur, table_name):
    # Retrieve columns for validation
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
        AND table_name = '{table_name}'
    """)
    return {row[0].lower(): row[1] for row in cur.fetchall()}

def clean_row(row):
    cleaned = {}
    for k, v in row.items():
        if pd.isna(v):
            cleaned[k] = None
        elif isinstance(v, (np.int64, np.int32)):
            cleaned[k] = int(v)
        elif isinstance(v, (np.float64, np.float32)):
            cleaned[k] = float(v)
        else:
            cleaned[k] = v
    return cleaned

def import_sheet(cur, file_path, table_name):
    if not os.path.exists(file_path):
        print(f"⚠️ Arquivo não encontrado: {file_path}")
        return

    print(f"\n📂 Processando {file_path} -> {SCHEMA}.{table_name}")
    
    # Validação de colunas
    db_cols = get_db_columns(cur, table_name)
    if not db_cols:
        print(f"❌ Tabela {SCHEMA}.{table_name} não encontrada!")
        return

    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"❌ Erro leitura: {e}")
        return

    df.columns = [str(c).strip().lower() for c in df.columns]
    valid_cols = [c for c in df.columns if c in db_cols]
    
    print(f"   Mapeado: {len(valid_cols)} cols")
    if not valid_cols:
        return

    # Limpar tabela
    try:
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE")
        print("   🗑️ Tabela limpa.")
    except Exception as e:
        print(f"   ⚠️ Erro ao limpar: {e}")

    # Inserir
    cols_str = ', '.join(valid_cols)
    vals_str = ', '.join(['%s'] * len(valid_cols))
    query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES ({vals_str})"

    count = 0
    errors = 0
    for _, row in df.iterrows():
        try:
            row_data = clean_row(row)
            values = [row_data[c] for c in valid_cols]
            cur.execute(query, values)
            count += 1
        except Exception as e:
            errors += 1
    
    print(f"✅ Sucesso: {count} | Falhas: {errors}")

def run():
    print(f"🚀 Conectando ao Banco NUVEM para schema '{SCHEMA}'...")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Garantir Schema
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}")
        print(f"✅ Schema {SCHEMA} garantido.")

        # 2. Clonar Tabelas (Se necessário - simples check)
        # Vamos clonar do public se a tabela de clientes não existir
        cur.execute(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{SCHEMA}' AND table_name = 'clientes'")
        if not cur.fetchone():
            print("🔄 Clonando tabelas do public...")
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            """)
            tables = [r[0] for r in cur.fetchall()]
            for t in tables:
                try:
                    cur.execute(f"CREATE TABLE IF NOT EXISTS {SCHEMA}.{t} (LIKE public.{t} INCLUDING ALL)")
                except Exception as xe:
                    print(f"Erro clonando {t}: {xe}")

        # 3. Importar
        import_sheet(cur, 'data/clientes.xlsx', 'clientes')
        import_sheet(cur, 'data/produtos.xlsx', 'cad_prod')
        import_sheet(cur, 'data/pedidos.xlsx', 'pedidos')
        import_sheet(cur, 'data/itens_ped.xlsx', 'itens_ped')
        import_sheet(cur, 'data/fornecedores.xlsx', 'fornecedores')
        
        conn.close()
        print("\n🏁 FINALIZADO COM SUCESSO!")

    except Exception as e:
        print(f"\n❌ ERRO FATAL: {e}")

if __name__ == "__main__":
    run()
