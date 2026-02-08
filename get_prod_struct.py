
from sqlalchemy import create_engine, text

DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"

def main():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    query = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'ndsrep' AND table_name = 'cad_tabelaspre'
    """
    with engine.connect() as conn:
        res = conn.execute(text(query))
        cols = [r[0] for r in res.fetchall()]
        print(f"CAD_TABELASPRE COLS: {cols}")

    query_prod = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'ndsrep' AND table_name = 'cad_prod'
    """
    with engine.connect() as conn:
        res = conn.execute(text(query_prod))
        cols = [r[0] for r in res.fetchall()]
        print(f"CAD_PROD COLS: {cols}")

if __name__ == "__main__":
    main()
