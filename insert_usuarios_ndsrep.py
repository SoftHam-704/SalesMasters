
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales')

# Usuários conforme a imagem
usuarios = [
    {
        "nome": "HAMILTON",
        "sobrenome": "SILVA",
        "senha": "123",
        "grupo": "GP01",
        "master": True,
        "gerencia": True,
        "usuario": "hamilton"
    },
    {
        "nome": "FABIOLA",
        "sobrenome": "NANTES",
        "senha": "123",
        "grupo": None,
        "master": True,
        "gerencia": True,
        "usuario": "fabiola"
    },
    {
        "nome": "VIVIAN",
        "sobrenome": "NANTES",
        "senha": "123",
        "grupo": None,
        "master": True,
        "gerencia": True,
        "usuario": "vivian"
    },
    {
        "nome": "TELEMARKETING",
        "sobrenome": "NDS", # Adicionando um sobrenome padrão já que é NOT NULL
        "senha": "123",
        "grupo": None,
        "master": True,
        "gerencia": True,
        "usuario": "telemarketing"
    },
    {
        "nome": "PAOLA",
        "sobrenome": "BEVILACQUA",
        "senha": "123",
        "grupo": None,
        "master": True,
        "gerencia": True,
        "usuario": "paola"
    }
]

sql = """
    INSERT INTO ndsrep.user_nomes (nome, sobrenome, senha, grupo, master, gerencia, usuario)
    VALUES (:nome, :sobrenome, :senha, :grupo, :master, :gerencia, :usuario)
    ON CONFLICT (codigo) DO NOTHING; -- Código é serial, mas o insert não especifica
"""

# Como não temos uma constraint UNIQUE óbvia além do ID, vamos usar o 'usuario' se existisse, 
# mas vou usar uma lógica de "delete e insert" ou "check existence"
try:
    with engine.connect() as conn:
        for u in usuarios:
            # Check if user exists by login (usuario)
            check_sql = text("SELECT codigo FROM ndsrep.user_nomes WHERE usuario = :usuario")
            existing_id = conn.execute(check_sql, {"usuario": u["usuario"]}).scalar()
            
            if existing_id:
                # Update
                update_sql = text("""
                    UPDATE ndsrep.user_nomes SET
                        nome = :nome,
                        sobrenome = :sobrenome,
                        senha = :senha,
                        grupo = :grupo,
                        master = :master,
                        gerencia = :gerencia
                    WHERE codigo = :id
                """)
                u_params = u.copy()
                u_params["id"] = existing_id
                conn.execute(update_sql, u_params)
                print(f"✅ Usuário atualizado: {u['usuario']}")
            else:
                # Insert
                insert_sql = text("""
                    INSERT INTO ndsrep.user_nomes (nome, sobrenome, senha, grupo, master, gerencia, usuario)
                    VALUES (:nome, :sobrenome, :senha, :grupo, :master, :gerencia, :usuario)
                """)
                conn.execute(insert_sql, u)
                print(f"✅ Usuário cadastrado: {u['usuario']}")
        
        conn.commit()
except Exception as e:
    print(f"❌ Erro ao cadastrar usuários: {e}")
