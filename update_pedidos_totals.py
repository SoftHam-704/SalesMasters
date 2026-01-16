from sqlalchemy import create_engine, text

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "rimef"

def main():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    print(f"Atualizando totais na tabela {SCHEMA}.pedidos...")
    
    sql = f"""
    UPDATE {SCHEMA}.pedidos p
    SET 
      ped_totliq = COALESCE(sub.sum_liq, 0),
      ped_totbruto = COALESCE(sub.sum_bruto, 0)
    FROM (
      SELECT 
        ite_pedido, 
        ite_industria, 
        SUM(ite_totliquido) as sum_liq, 
        SUM(ite_totbruto) as sum_bruto
      FROM {SCHEMA}.itens_ped
      GROUP BY ite_pedido, ite_industria
    ) sub
    WHERE p.ped_pedido = sub.ite_pedido AND p.ped_industria = sub.ite_industria;
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            conn.commit()
            print(f"✅ Atualização concluída! Linhas afetadas: {result.rowcount}")
            
    except Exception as e:
        print(f"❌ Erro ao atualizar: {e}")

if __name__ == "__main__":
    main()
