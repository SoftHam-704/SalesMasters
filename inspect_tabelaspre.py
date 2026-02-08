
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

print("--- COLUNAS DE ndsrep.cad_tabelaspre ---")
query_cols = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'ndsrep' AND table_name = 'cad_tabelaspre'
"""
with engine.connect() as conn:
    res = conn.execute(text(query_cols))
    cols = [r[0] for r in res.fetchall()]
    print(cols)

print("\n--- TRIGGERS DE ndsrep.cad_tabelaspre ---")
query_trgs = """
    SELECT tgname, pg_get_triggerdef(oid) 
    FROM pg_trigger 
    WHERE tgrelid = 'ndsrep.cad_tabelaspre'::regclass
"""
with engine.connect() as conn:
    res = conn.execute(text(query_trgs))
    for r in res.fetchall():
        print(f"Trigger: {r[0]}\nDef: {r[1]}\n")
