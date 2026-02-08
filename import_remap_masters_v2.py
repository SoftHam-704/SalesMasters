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

FILES_MAP = {
    'cidades.xlsx': 'cidades',
    'clientes.xlsx': 'clientes',
    'fornecedores.xlsx': 'fornecedores',
    'grupos.xlsx': 'grupos',
    'transportadora.xlsx': 'transportadora',
    'vendedores.xlsx': 'vendedores'
}

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
    return df.where(pd.notnull(df), None)

def get_valid_columns(cur, table_name):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{SCHEMA}' AND table_name = '{table_name}'")
    return {row[0].lower() for row in cur.fetchall()}

def process_dataframe(df, table_name):
    # Standardize column names
    df.columns = [c.lower() for c in df.columns]
    
    # Specific Logic for Clientes
    if table_name == 'clientes':
        # Ensure cli_nomred is populated
        if 'cli_nomred' not in df.columns:
            if 'cli_nome' in df.columns:
                print("Filling missing cli_nomred with cli_nome...")
                df['cli_nomred'] = df['cli_nome']
        else:
            # Fill NaNs in cli_nomred with cli_nome
            df['cli_nomred'] = df['cli_nomred'].fillna(df['cli_nome'])
            
    # Specific Logic for Fornecedores
    if table_name == 'fornecedores':
        # Ensure for_nomered is populated
        if 'for_nomered' not in df.columns:
            if 'for_nome' in df.columns:
                print("Filling missing for_nomered with for_nome...")
                df['for_nomered'] = df['for_nome']
        else:
             df['for_nomered'] = df['for_nomered'].fillna(df['for_nome'])

    return df

def import_table(conn, file_name, table_name):
    print(f"\n--- Processing {file_name} -> {SCHEMA}.{table_name} ---")
    
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"Skipping: File not found {file_path}")
        return

    try:
        cur = conn.cursor()
        
        # 1. Truncate Table First
        print(f"Truncating table {SCHEMA}.{table_name}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE;")
        
        # 2. Read Excel
        df = pd.read_excel(file_path)
        print(f"Loaded {len(df)} rows from Excel.")
        
        if df.empty:
            print("Empty dataframe. Skipping.")
            return

        # 3. Rename columns if mapping exists
        if table_name in COL_MAPPINGS:
            df.rename(columns=COL_MAPPINGS[table_name], inplace=True)
        
        # 4. Standardize & Fix Data
        df = process_dataframe(df, table_name)
        
        # 5. Filter Valid Columns
        valid_cols = get_valid_columns(cur, table_name)
        cols_to_insert = [c for c in df.columns if c in valid_cols]
        
        if not cols_to_insert:
            print(f"ERROR: No matching columns found for {table_name}!")
            return
            
        final_df = df[cols_to_insert]
        final_df = clean_data(final_df)
        
        # 6. Bulk Insert
        data_tuples = [tuple(x) for x in final_df.to_numpy()]
        cols_str = ','.join(cols_to_insert)
        query = f"INSERT INTO {SCHEMA}.{table_name} ({cols_str}) VALUES %s"
        
        extras.execute_values(cur, query, data_tuples)
        print(f"SUCCESS: Inserted {len(data_tuples)} rows into {table_name}")
        
        cur.close()

    except Exception as e:
        print(f"ERROR importing {table_name}: {e}")
        # import traceback
        # traceback.print_exc()

def main():
    print("--- STARTING IMPORT (WITH FIXES) ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        
        # Order matters due to FKs? Usually not for masters, but let's be safe
        # Cidades first, then others
        ordered_files = ['cidades.xlsx', 'transportadora.xlsx', 'grupos.xlsx', 'vendedores.xlsx', 'fornecedores.xlsx', 'clientes.xlsx']
        
        for f in ordered_files:
            if f in FILES_MAP:
                import_table(conn, f, FILES_MAP[f])
            
        print("\n--- ALL IMPORTS COMPLETED ---")
        conn.close()
        
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    main()
