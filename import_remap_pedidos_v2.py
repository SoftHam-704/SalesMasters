
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
    return s # return as-is if fails, let postgres complain? or better null?

def clean_value(col, val):
    if val is None: return None
    
    # Identify Date Columns
    if 'data' in col or 'emissao' in col or 'dt' in col:
        res = clean_date(val)
        if res: return res
        
    s = str(val).strip()
    if s == '' or s.lower() == 'null' or s.lower() == 'nan':
         return None
         
    return val

def import_pedidos():
    print(f"--- Starting Import: {TABLE} (Batch: {BATCH_SIZE}) ---")
    
    if not os.path.exists(DATA_FILE):
        print(f"File not found: {DATA_FILE}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 0. Truncate
        print(f"Truncating {SCHEMA}.{TABLE}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{TABLE} CASCADE;")
        conn.commit()

        # 1. Get Valid Columns
        cur.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = '{SCHEMA}' 
              AND table_name = '{TABLE}'
        """)
        valid_cols = {row[0].lower() for row in cur.fetchall()}
        print(f"Valid DB Columns: {len(valid_cols)}")

        # 2. Load JSON
        # The file has a root "RecordSet" array based on 'head' output
        print(f"Loading JSON: {DATA_FILE}...")
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
            
        if isinstance(raw, dict) and 'RecordSet' in raw:
            data = raw['RecordSet']
        elif isinstance(raw, list):
            data = raw
        else:
            print("Unknown JSON structure. Expected list or dict with RecordSet.")
            return

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

        # 4. Process Batch
        batch = []
        count = 0
        success_count = 0

        for record in data:
            # Map values
            rec_lower = {k.lower(): v for k, v in record.items()}
            row = []
            
            for col in target_cols:
                val = rec_lower.get(col)
                row.append(clean_value(col, val))
            
            batch.append(tuple(row))
            count += 1
            
            if len(batch) >= BATCH_SIZE:
                try:
                    extras.execute_values(cur, query, batch)
                    conn.commit()
                    success_count += len(batch)
                    print(f"Inserted: {success_count}/{total_records}...", end='\r')
                    batch = []
                except Exception as e:
                    print(f"\n❌ Batch Error at {success_count}: {e}")
                    conn.rollback() 
                    # If strict, break. If lenient, continue?
                    # Strict for now to catch schema mismatches early
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
