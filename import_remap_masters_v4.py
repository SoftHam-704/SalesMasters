import pandas as pd
import psycopg2
from psycopg2 import extras
import numpy as np
import os
import datetime

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
    'transportadora.xlsx': 'transportadora',
    'grupos.xlsx': 'grupos',
    'vendedores.xlsx': 'vendedores',
    'fornecedores.xlsx': 'fornecedores',
    'clientes.xlsx': 'clientes'
}

COL_MAPPINGS = {
    'transportadora': {
        'CODIGO': 'tra_codigo', 'NOME': 'tra_nome', 'ENDERECO': 'tra_endereco',
        'BAIRRO': 'tra_bairro', 'CIDADE': 'tra_cidade', 'CEP': 'tra_cep',
        'UF': 'tra_uf', 'CONTATO': 'tra_contato', 'EMAIL': 'tra_email',
        'TELEFONE1': 'tra_fone', 'CNPJ': 'tra_cgc', 'IEST': 'tra_inscricao'
    }
}

# --- Helpers ---
def safe_str(val, max_len=None):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    s = str(val).strip()
    if s.endswith('.0'): s = s[:-2]
    if max_len and len(s) > max_len: s = s[:max_len]
    return s

def safe_date(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    try:
        dt = pd.to_datetime(val, errors='coerce')
        if pd.isna(dt): return None
        return dt.date()
    except:
        return None

def safe_int(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return None
    try:
        return int(float(val))
    except:
        return None

def process_dataframe(df, table_name):
    # Standardize column names
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # --- TABLE SPECIFIC LOGIC ---
    
    if table_name == 'clientes':
        # NomRed Fallback
        if 'cli_nomred' not in df.columns and 'cli_nome' in df.columns:
            df['cli_nomred'] = df['cli_nome']
        elif 'cli_nomred' in df.columns:
            df['cli_nomred'] = df['cli_nomred'].fillna(df['cli_nome'])
            
        # Dates
        for col in ['cli_datacad', 'cli_dtnasc', 'cli_dtultcomp']:
            if col in df.columns:
                df[col] = df[col].apply(safe_date)
        
        # UF (Char 2)
        if 'cli_uf' in df.columns:
            df['cli_uf'] = df['cli_uf'].apply(lambda x: safe_str(x, 2))

    elif table_name == 'fornecedores':
        # NomRed Fallback
        if 'for_nomered' not in df.columns and 'for_nome' in df.columns:
            df['for_nomered'] = df['for_nome']
        elif 'for_nomered' in df.columns:
            df['for_nomered'] = df['for_nomered'].fillna(df['for_nome'])
            
        # Large Numbers as Strings
        for col in ['for_cgc', 'for_inscricao', 'for_fone', 'for_fone2', 'for_cep']:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: safe_str(x))
                
        # UF (Char 2)
        if 'for_uf' in df.columns:
            df['for_uf'] = df['for_uf'].apply(lambda x: safe_str(x, 2))

    elif table_name == 'vendedores':
        # UF & Status (Char 2/1)
        if 'ven_uf' in df.columns:
            df['ven_uf'] = df['ven_uf'].apply(lambda x: safe_str(x, 2))
        if 'ven_status' in df.columns:
            df['ven_status'] = df['ven_status'].apply(lambda x: safe_str(x, 1))

    # --- GENERAL CLEANUP ---
    # Replace all NaNs with None for SQL NULL compatibility
    # Using object dtype ensures None is preserved
    df = df.astype(object).where(pd.notnull(df), None)
    
    return df

def get_valid_columns(cur, table_name):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{SCHEMA}' AND table_name = '{table_name}'")
    return {row[0].lower() for row in cur.fetchall()}

def import_master(conn, file_name, table_name):
    print(f"\n--- Processing {file_name} -> {SCHEMA}.{table_name} ---")
    file_path = os.path.join(DATA_DIR, file_name)
    
    if not os.path.exists(file_path):
        print(f"Skipping: {file_name} not found")
        return

    try:
        # 1. Truncate
        cur = conn.cursor()
        print(f"Truncating {SCHEMA}.{table_name}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{table_name} CASCADE;")
        
        # 2. Read Excel
        df = pd.read_excel(file_path)
        if df.empty:
            print("Empty Excel. Skipping.")
            return

        # 3. Rename Map
        if table_name in COL_MAPPINGS:
            df.rename(columns=COL_MAPPINGS[table_name], inplace=True)
            
        # 4. Clean & Transform
        df = process_dataframe(df, table_name)
        
        # 5. Filter Columns
        valid_cols = get_valid_columns(cur, table_name)
        input_cols = [c for c in df.columns if c in valid_cols]
        
        if not input_cols:
            print(f"ERROR: No matching columns for {table_name}!")
            return

        final_df = df[input_cols]
        # Final safety check for NaNs -> None
        final_df = final_df.where(pd.notnull(final_df), None)
        
        # 6. Bulk Insert
        data = [tuple(x) for x in final_df.to_numpy()]
        cols = ','.join(input_cols)
        query = f"INSERT INTO {SCHEMA}.{table_name} ({cols}) VALUES %s"
        
        extras.execute_values(cur, query, data)
        print(f"SUCCESS: Inserted {len(data)} rows into {table_name}")
        cur.close()

    except Exception as e:
        print(f"ERROR importing {table_name}: {e}")

if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        
        # Execution Order
        files = ['cidades.xlsx', 'transportadora.xlsx', 'grupos.xlsx', 'vendedores.xlsx', 'fornecedores.xlsx', 'clientes.xlsx']
        
        for f in files:
            if f in FILES_MAP:
                import_master(conn, f, FILES_MAP[f])
                
        conn.close()
        print("\n--- ALL IMPORTS COMPLETED ---")
        
    except Exception as e:
        print(f"Fatal DB Error: {e}")
