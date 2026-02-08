
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/salesmasters_master')

# CNPJ da NDS
CNPJ = "18976342000107"

sql = text("""
    UPDATE public.empresas 
    SET bloqueio_ativo = 'S' 
    WHERE cnpj = :cnpj
""")

try:
    with engine.connect() as conn:
        conn.execute(sql, {"cnpj": CNPJ})
        conn.commit()
        print(f"✅ Bloqueio Ativo (Habilita BI) setado para 'S' para o CNPJ {CNPJ}")
except Exception as e:
    print(f"❌ Erro ao atualizar empresa: {e}")
