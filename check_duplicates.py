
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

def check_duplicates():
    with engine.connect() as conn:
        print("Checking for duplicates in ndsrep.cad_prod...")
        
        # Check by Industry + Original Code
        sql1 = text("""
            SELECT pro_industria, pro_codprod, COUNT(*) 
            FROM ndsrep.cad_prod 
            GROUP BY pro_industria, pro_codprod 
            HAVING COUNT(*) > 1
        """)
        res1 = conn.execute(sql1).fetchall()
        print(f"Duplicates (Industry + Original Code): {len(res1)}")
        if len(res1) > 0:
            for r in res1[:5]:
                print(f"   - Ind: {r[0]}, Cod: {r[1]}, Count: {r[2]}")

        # Check by Industry + Normalized Code
        sql2 = text("""
            SELECT pro_industria, pro_codigonormalizado, COUNT(*) 
            FROM ndsrep.cad_prod 
            GROUP BY pro_industria, pro_codigonormalizado 
            HAVING COUNT(*) > 1
        """)
        res2 = conn.execute(sql2).fetchall()
        print(f"Duplicates (Industry + Normalized Code): {len(res2)}")
        if len(res2) > 0:
            for r in res2[:5]:
                print(f"   - Ind: {r[0]}, CodNorm: {r[1]}, Count: {r[2]}")
                
        # Total count
        total = conn.execute(text("SELECT COUNT(*) FROM ndsrep.cad_prod")).scalar()
        print(f"Total Products: {total}")

if __name__ == "__main__":
    check_duplicates()
