
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')
with engine.connect() as conn:
    c = conn.execute(text("SELECT count(*) FROM ndsrep.cad_prod")).scalar()
    d = conn.execute(text("SELECT count(*) FROM ndsrep.cad_tabelaspre")).scalar()
    print(f"Products: {c}")
    print(f"Prices: {d}")
