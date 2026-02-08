
import json

filepath = r"e:\Sistemas_ia\SalesMasters\data\pedidos.json"
try:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = f.read()
    
    # Error was at char 791356
    pos = 791356
    print("Char at pos {}: {!r}".format(pos, data[pos:pos+20]))
    print("Char before pos {}: {!r}".format(pos, data[pos-20:pos]))
except Exception as e:
    print(e)
