
import pandas as pd
import psycopg2
import sys
import numpy as np
import os

# Config
DB_HOST = "localhost"
DB_NAME = "basesales"
DB_USER = "postgres"
DB_PASS = "postgres"
SCHEMA = "brasil_wl"

def get_db_columns(cur, table_name):
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
        AND table_name = '{table_name}'
    """)
    return {row[0].lower(): row[1] for row in cur.fetchall()}

def clean_row(row):
    # Convert numpy types to python native types
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



# sys.stdout.reconfigure(encoding='utf-8')

def import_sheet(cur, file_path, table_name, pk_field=None):
    if not os.path.exists(file_path):
        print(f"⚠️ Arquivo não encontrado: {file_path}")
        return

    print(f"\n📂 Processando {file_path} -> {SCHEMA}.{table_name}")
    
    try:
        # Limpar tabela antes
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE")
        print(f"   🗑️  Tabela {table_name} limpa.")
    except Exception as e:
        print(f"   ⚠️  Aviso ao limpar tabela: {e}")

    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"❌ Erro ao ler Excel: {e}")
        return

    # Normalizar colunas do Excel para lowercase
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Obter colunas válidas do banco
    db_cols = get_db_columns(cur, table_name)
    if not db_cols:
        print(f"❌ Tabela {SCHEMA}.{table_name} não encontrada ou sem colunas!")
        return
        
    # Interseção de colunas
    valid_cols = [c for c in df.columns if c in db_cols]
    print(f"   Colunas mapeadas: {len(valid_cols)}/{len(df.columns)}")
    
    if not valid_cols:
        print("❌ Nenhuma coluna compatível encontrada.")
        return

    # Preparar Query
    cols_str = ', '.join(valid_cols)
    vals_str = ', '.join(['%s'] * len(valid_cols))
    query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES ({vals_str})"
    
    # Inserção
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
            # print(f"Erro na linha {_}: {e}") # Verbose
    
    print(f"✅ Importados: {count} | Erros: {errors}")

def run():
    print(f"🚀 Iniciando importação para o schema '{SCHEMA}' no host '{DB_HOST}'...")
    

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            client_encoding="LATIN1"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Verificar se schema existe
        cur.execute(f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{SCHEMA}'")
        if not cur.fetchone():
            print(f"❌ ERRO GRAVE: Schema '{SCHEMA}' não existe! Rode o script de criação primeiro.")
            return

        # 1. Clientes
        import_sheet(cur, 'data/clientes.xlsx', 'clientes')
        
        # 2. Produtos (cad_prod) -- Mapeamento especial geralmente necessario se nomes diferirem
        # Verificando se produtos.xlsx mapeia para cad_prod ou produtos
        # O excel tem PRO_CODIGO, a tabela costuma ser cad_prod no sistema salesmasters
        import_sheet(cur, 'data/produtos.xlsx', 'cad_prod')
        
        # 3. Pedidos
        import_sheet(cur, 'data/pedidos.xlsx', 'pedidos')
        
        # 4. Itens
        import_sheet(cur, 'data/itens_ped.xlsx', 'itens_ped')
        
        # 5. Fornecedores
        import_sheet(cur, 'data/fornecedores.xlsx', 'fornecedores')

        conn.close()
        print("\n🏁 Processo finalizado!")


    except Exception as e:
        # Safe error printing
        err_msg = str(e)
        try:
            print(f"\n❌ ERRO DE CONEXÃO/GERAL: {err_msg}")
        except:
            print(f"\n❌ ERRO DE CONEXÃO/GERAL: {repr(e)}")

if __name__ == "__main__":
    run()
