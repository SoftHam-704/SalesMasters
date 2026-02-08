
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

# --- Columns Mapping ---
# Adjust types and names as needed 
def get_columns(cur):
    cur.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' 
          AND table_name = '{TABLE}'
    """)
    return {row[0].lower() for row in cur.fetchall()}

def clean_value(val):
    if val is None: return None
    if isinstance(val, str):
        val = val.strip()
        if val == '' or val.lower() == 'nan': return None
    return val

def import_pedidos():
    print(f"--- Starting Import: {TABLE} (Batch: {BATCH_SIZE}) ---")
    
    if not os.path.exists(DATA_FILE):
        print(f"File not found: {DATA_FILE}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False # Use transaction for safety
        cur = conn.cursor()
        
        # 1. Truncate Table
        print(f"Truncating {SCHEMA}.{TABLE}...")
        cur.execute(f"TRUNCATE TABLE {SCHEMA}.{TABLE} CASCADE;")
        conn.commit()

        # 2. Get Valid Columns
        valid_cols = get_columns(cur)
        print(f"Valid DB Columns: {len(valid_cols)}")

        # 3. Stream JSON (Loading fully might require memory, relying on user machine ram)
        # Using json.load for simplicity. If file > 500MB, consider ijson.
        print(f"Loading JSON: {DATA_FILE}...")
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f) # Expecting list of dicts

        total_records = len(data)
        print(f"Total Records found: {total_records}")

        batch = []
        count = 0
        success_count = 0
        
        # Determine shared columns from first record (hope schema is consistent)
        if not data:
            print("Empty JSON.")
            return

        # Prepare columns based on first available record keys that match DB
        first_keys = {k.lower() for k in data[0].keys()}
        target_cols = list(first_keys.intersection(valid_cols))
        
        if not target_cols:
            print("No matching columns found!")
            print(f"JSON Key sample: {list(data[0].keys())[:10]}")
            return

        cols_str = ','.join(target_cols)
        query = f"INSERT INTO {SCHEMA}.{TABLE} ({cols_str}) VALUES %s"

        for record in data:
            # Create a tuple map based on target_cols
            # Standardize record keys to lower for lookup
            rec_lower = {k.lower(): v for k, v in record.items()}
            
            row = []
            for col in target_cols:
                row.append(clean_value(rec_lower.get(col)))
            
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
                    conn.rollback() # Rollback only this transaction if needed or abort?
                    # Let's abort to be safe or skip? Abort is safer.
                    return

        # Remaining batch
        if batch:
            extras.execute_values(cur, query, batch)
            conn.commit()
            success_count += len(batch)
        
        print(f"\n✅ DONE! Total Inserted: {success_count}")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")

if __name__ == "__main__":
    import_pedidos()
