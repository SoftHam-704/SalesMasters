
import json
import psycopg2
from psycopg2 import extras
import datetime
import os
import sys

# --- Configurations ---
DATA_FILE = 'data/pedidos.json'
BATCH_SIZE = 2000

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

SCHEMA = 'remap'
TABLE = 'pedidos'

def clean_date(val):
    if val is None: return None
    s = str(val).strip()
    if not s or s == '' or s.lower() == 'nan': return None
    
    # Try parsing 'DD.MM.YYYY'
    try:
        if '.' in s:
            day, month, year = s.split('.')
            return f"{year}-{month}-{day}"
    except:
        pass
    return s

def clean_value(col, val, max_len=None):
    if val is None: return None
    
    # Identify Date Columns
    if 'data' in col or 'emissao' in col or 'dt' in col:
        res = clean_date(val)
        if res: return res
        return None # If invalid date, return None? Or risk error?
        
    s = str(val).strip()
    if s == '' or s.lower() == 'null' or s.lower() == 'nan':
         return None
         
    # Apply truncation if needed based on spec
    if max_len and len(s) > max_len:
        s = s[:max_len]
        
    return s

def get_col_specs(cur):
    cur.execute(f"""
        SELECT column_name, character_maximum_length, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
          AND table_name = '{TABLE}'
    """)
    specs = {}
    for row in cur.fetchall():
        col = row[0].lower()
        max_len = row[1]
        dtype = row[2]
        specs[col] = {'max_len': max_len}
    return specs

def import_pedidos():
    print(f"--- Starting Import V3: {TABLE} (Batch: {BATCH_SIZE}) ---")
    
    if not os.path.exists(DATA_FILE): return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 0. Specs
        col_specs = get_col_specs(cur)
        valid_cols = set(col_specs.keys())
        print(f"Valid DB Columns: {len(valid_cols)}")

        # 1. Truncate
        print(f"Truncating {SCHEMA}.{TABLE}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{TABLE} CASCADE;")
        conn.commit()

        # 2. Load JSON
        print(f"Loading JSON: {DATA_FILE}...")
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
            data = raw.get('RecordSet', []) if isinstance(raw, dict) else raw

        total_records = len(data)
        print(f"Total Records found: {total_records}")

        if not data: return

        # 3. Map Columns
        first_keys = {k.lower() for k in data[0].keys()}
        target_cols = list(first_keys.intersection(valid_cols))
        
        if not target_cols:
            print("No matching columns!")
            return

        cols_str = ','.join(target_cols)
        query = f"INSERT INTO {SCHEMA}.{TABLE} ({cols_str}) VALUES %s"

        batch = []
        success_count = 0

        for record in data:
            rec_lower = {k.lower(): v for k, v in record.items()}
            row = []
            
            for col in target_cols:
                val = rec_lower.get(col)
                spec = col_specs.get(col, {})
                max_len = spec.get('max_len')
                
                cleaned = clean_value(col, val, max_len)
                row.append(cleaned)
            
            batch.append(tuple(row))
            
            if len(batch) >= BATCH_SIZE:
                try:
                    extras.execute_values(cur, query, batch)
                    conn.commit()
                    success_count += len(batch)
                    print(f"Inserted: {success_count}/{total_records}...", end='\r')
                    batch = []
                except Exception as e:
                    print(f"\n❌ Batch Error at {success_count}: {e}")
                    # Try to sanitize batch more aggressively or fail?
                    # Let's retry row by row to identify culprit? No, too slow.
                    # Just truncate aggressively next time.
                    conn.rollback()
                    return

        if batch:
            try:
                extras.execute_values(cur, query, batch)
                conn.commit()
                success_count += len(batch)
            except Exception as e:
                print(f"\n❌ Final Batch Error: {e}")

        print(f"\n✅ DONE! Total Inserted: {success_count}")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")

if __name__ == "__main__":
    import_pedidos()
