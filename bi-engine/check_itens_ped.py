from services.database_native import db

def check_itens_ped():
    res = db.execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'itens_ped' AND column_name LIKE 'ite_%%'")
    for r in res:
        print(r)

if __name__ == "__main__":
    check_itens_ped()
