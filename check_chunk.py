
filepath = r"e:\Sistemas_ia\SalesMasters\data\pedidos.json"
with open(filepath, 'r', encoding='utf-8') as f:
    data = f.read()

pos = 791356
print("Chunk: {!r}".format(data[pos-50:pos+50]))
