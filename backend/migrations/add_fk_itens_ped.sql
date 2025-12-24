-- Migration: Add foreign key constraint from itens_ped.ite_pedido to pedidos.ped_pedido
ALTER TABLE itens_ped
    ADD CONSTRAINT fk_itens_ped_pedido
    FOREIGN KEY (ite_pedido)
    REFERENCES pedidos(ped_pedido)
    ON DELETE CASCADE;
