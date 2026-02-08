import pandas as pd
import psycopg2
from psycopg2 import extras
import numpy as np
import os

# --- Configurations ---
DATA_DIR = 'data/'
DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

SCHEMA = 'remap'

# --- Table Mapping ---
# Files to tables mapping
FILES_MAP = {
    'cidades.xlsx': 'cidades',
    'clientes.xlsx': 'clientes',
    'fornecedores.xlsx': 'fornecedores',
    'grupos.xlsx': 'grupos',
    'transportadora.xlsx': 'transportadora',
    'vendedores.xlsx': 'vendedores'
}

# Column rename mapping (only for mismatch cases)
COL_MAPPINGS = {
    'transportadora': {
        'CODIGO': 'tra_codigo',
        'NOME': 'tra_nome',
        'ENDERECO': 'tra_endereco',
        'BAIRRO': 'tra_bairro',
        'CIDADE': 'tra_cidade',
        'CEP': 'tra_cep',
        'UF': 'tra_uf',
        'CONTATO': 'tra_contato',
        'EMAIL': 'tra_email',
        'TELEFONE1': 'tra_fone',
        'CNPJ': 'tra_cgc',
        'IEST': 'tra_inscricao'
    }
}

def clean_data(df):
    """
    Replace NaN with None for SQL NULL insertion.
    Convert dates if necessary.
    """
    df = df.replace({np.nan: None})
    
    # Force convert known date columns if pandas didn't catch them
    # (Optional, add logic if needed based on errors)
    return df

def get_db_columns(cur, table_name):
    cur.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
          AND table_name = '{table_name}'
    """)
    return {row[0] for row in cur.fetchall()}

def import_table(conn, file_name, table_name):
    print(f"\n>>> Processing {file_name} -> {SCHEMA}.{table_name}")
    
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"Skipping: File not found {file_path}")
        return

    try:
        # 1. Read Excel
        df = pd.read_excel(file_path)
        print(f"Loaded {len(df)} rows from Excel.")
        
        if df.empty:
            print("Empty dataframe. Skipping.")
            return

        # 2. Rename columns
        # First, apply specific mapping if exists
        if table_name in COL_MAPPINGS:
            df.rename(columns=COL_MAPPINGS[table_name], inplace=True)
        
        # Then, try checking if lowercase matches db columns
        # We need to know valid DB columns first
        cur = conn.cursor()
        valid_cols = get_db_columns(cur, table_name)
        
        # Standardize DF columns: lowercase
        df.columns = [c.lower() for c in df.columns]
        
        # 3. Filter columns: Keep only those that exist in DB
        cols_to_insert = [c for c in df.columns if c in valid_cols]
        
        if not cols_to_insert:
            print(f"ERROR: No matching columns found for {table_name}!")
            print(f"Excel Cols (lower): {list(df.columns)}")
            print(f"DB Cols: {valid_cols}")
            return
            
        final_df = df[cols_to_insert]
        final_df = clean_data(final_df)
        
        data_tuples = [tuple(x) for x in final_df.to_numpy()]
        cols_str = ','.join(cols_to_insert)
        
        # 4. Bulk Insert
        query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES %s"
        
        extras.execute_values(cur, query, data_tuples)
        print(f"SUCCESS: Inserted {len(data_tuples)} rows into {table_name}")
        
        cur.close()

    except Exception as e:
        print(f"ERROR importing {table_name}: {e}")
        # import traceback
        # traceback.print_exc()

def main():
    print("--- STARTING IMPORT ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        
        for file_name, table_name in FILES_MAP.items():
            import_table(conn, file_name, table_name)
            
        print("\n--- IMPORT COMPLETED ---")
        conn.close()
        
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    main()
