from services.database_native import db
import json

def check_indices():
    tables = ['pedidos']
    results = {}
    for table in tables:
        indices = db.execute_query(f"SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '{table}'")
        results[table] = indices
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    check_indices()
