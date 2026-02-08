from services.database_native import db

def inspect():
    query = "SELECT proname, oidvectortypes(proargtypes) FROM pg_proc WHERE proname LIKE 'fn_%%'"
    res = db.execute_query(query)
    for row in res:
        print(row)

if __name__ == "__main__":
    inspect()
