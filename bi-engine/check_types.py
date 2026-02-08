from services.database_native import db

def check_types():
    try:
        res = db.execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'itens_ped' AND column_name LIKE 'ite_%%'")
        print("--- itens_ped ---")
        for r in res: print(r)
        
        res = db.execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cad_prod' AND column_name LIKE 'pro_%%'")
        print("\n--- cad_prod ---")
        for r in res: print(r)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_types()
