from services.database import execute_query

def verify_columns():
    print("--- Verifying Columns ---")
    try:
        # Check pro_industria in cad_prod
        try:
            execute_query("SELECT pro_industria FROM cad_prod LIMIT 1")
            print("SUCCESS: pro_industria exists in cad_prod")
        except Exception as e:
            print(f"FAIL: pro_industria NOT found in cad_prod. Error: {e}")

        # Check ite_idproduto in itens_ped
        try:
            execute_query("SELECT ite_idproduto FROM itens_ped LIMIT 1")
            print("SUCCESS: ite_idproduto exists in itens_ped")
        except:
            print("FAIL: ite_idproduto NOT found in itens_ped. Checking ite_produto...")
            try:
                execute_query("SELECT ite_produto FROM itens_ped LIMIT 1")
                print("SUCCESS: ite_produto exists in itens_ped")
            except Exception as e:
                print(f"FAIL: ite_produto NOT found. Error: {e}")

        # Check ped_pedido vs ped_numero
        try:
            execute_query("SELECT ped_pedido FROM pedidos LIMIT 1")
            print("SUCCESS: ped_pedido exists in pedidos")
        except:
            print("FAIL: ped_pedido NOT found. Checking ped_numero...")
            execute_query("SELECT ped_numero FROM pedidos LIMIT 1")
            print("SUCCESS: ped_numero exists in pedidos")

    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    verify_columns()
