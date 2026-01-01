-- Inserir usuário modelo para testes
INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia) 
VALUES ('Admin', 'Sistema', 'admin', '123456', 'Administradores', true, true)
ON CONFLICT DO NOTHING;

-- Inserir mais alguns usuários para teste
INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia  ) 
VALUES 
    ('João', 'Silva', 'joao.silva', '123456', 'Vendedores', false, false),
    ('Maria', 'Santos', 'maria.santos', '123456', 'Vendedores', false, false),
    ('Pedro', 'Oliveira', 'pedro.oliveira', '123456', 'Gerentes', false, true)
ON CONFLICT DO NOTHING;

-- Mostrar os usuários criados
SELECT codigo, nome, sobrenome, usuario, grupo, master, gerencia 
FROM user_nomes 
ORDER BY codigo;
