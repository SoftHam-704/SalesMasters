-- Inserting Regions based on user request (Corrected table name)
INSERT INTO regioes (reg_codigo, reg_descricao) VALUES
(1, 'CAMPO GRANDE'),
(2, 'LESTE'),
(10, 'MT'),
(11, 'GO'),
(3, 'BOLSÃO'),
(4, 'GRANDE DOURADOS'),
(5, 'NORTE'),
(6, 'PANTANAL'),
(7, 'CONE SUL'),
(8, 'SUDOESTE'),
(9, 'SUL-FRONTEIRA'),
(12, 'MA')
ON CONFLICT (reg_codigo) DO UPDATE SET reg_descricao = EXCLUDED.reg_descricao;
