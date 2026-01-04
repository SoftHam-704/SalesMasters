"""
Add new columns to vendedores table:
- ven_dtadmissao (Date)
- ven_dtdemissao (Date)  
- ven_status (char(1)) - A=Ativo, I=Inativo
- ven_cumpremetas (char(1)) - S=Sim, N=Não
"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"
engine = create_engine(DB_URL)

alter_sql = """
-- Adicionar novos campos na tabela vendedores
ALTER TABLE vendedores 
ADD COLUMN IF NOT EXISTS ven_dtadmissao DATE,
ADD COLUMN IF NOT EXISTS ven_dtdemissao DATE,
ADD COLUMN IF NOT EXISTS ven_status CHAR(1) DEFAULT 'A',
ADD COLUMN IF NOT EXISTS ven_cumpremetas CHAR(1) DEFAULT 'S';

-- Comentários nos campos
COMMENT ON COLUMN vendedores.ven_dtadmissao IS 'Data de admissão do vendedor';
COMMENT ON COLUMN vendedores.ven_dtdemissao IS 'Data de demissão do vendedor';
COMMENT ON COLUMN vendedores.ven_status IS 'Status: A=Ativo, I=Inativo';
COMMENT ON COLUMN vendedores.ven_cumpremetas IS 'Cumpre metas: S=Sim, N=Não';
"""

print("🔄 Adicionando novos campos na tabela vendedores...")

try:
    with engine.connect() as conn:
        conn.execute(text(alter_sql))
        conn.commit()
        print("✅ Campos adicionados com sucesso!")
        
        # Verify the columns exist
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'vendedores' 
            AND column_name IN ('ven_dtadmissao', 'ven_dtdemissao', 'ven_status', 'ven_cumpremetas')
            ORDER BY column_name
        """))
        
        print("\n📊 Colunas verificadas:")
        for row in result:
            print(f"   {row[0]}: {row[1]} (default: {row[2]})")
            
except Exception as e:
    print(f"❌ Erro: {e}")
