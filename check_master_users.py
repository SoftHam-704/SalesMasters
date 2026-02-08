
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/salesmasters_master')

def check():
    with engine.connect() as conn:
        print('--- USUARIOS EM MASTER ---')
        res = conn.execute(text('SELECT id, nome, email, empresa_id FROM usuarios WHERE nome ILIKE \'%PAOLA%\'')).fetchall()
        for row in res:
            print(f'ID: {row[0]}, Nome: {row[1]}, Email: {row[2]}, Empresa ID: {row[3]}')

if __name__ == "__main__":
    check()
