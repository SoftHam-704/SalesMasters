
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')
query = """
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'ndsrep' 
    AND table_name = 'pedidos'
"""
with engine.connect() as conn:
    res = conn.execute(text(query))
    for r in res.fetchall():
        print(f"{r[0]} ({r[1]})")
