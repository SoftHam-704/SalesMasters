from services.database_native import db

def check_schemas():
    schemas = db.execute_query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')")
    for s in schemas:
        schema = s['schema_name']
        try:
            count = db.execute_one(f"SELECT count(*) FROM {schema}.pedidos")
            print(f"Schema: {schema:15} | Pedidos: {count['count']}")
        except:
            pass

if __name__ == "__main__":
    check_schemas()
