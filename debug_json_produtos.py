
import json
import re

def fix_json(file_path):
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
    
    # Fix Python booleans and None
    content = content.replace(': False', ': false').replace(': True', ': true').replace(': None', ': null')
    
    # Try to find the error at line 28477 (char 791358 approx)
    # The error was "Expecting value: line 28477 column 21"
    # Let's try to just parse it and if it fails, try to find the malformed part.
    try:
        data = json.loads(content)
        return data
    except json.JSONDecodeError as e:
        print(f"JSON Error at {e.lineno}:{e.colno} - {e.msg}")
        # Print context around the error
        lines = content.splitlines()
        start = max(0, e.lineno - 5)
        end = min(len(lines), e.lineno + 5)
        for i in range(start, end):
            prefix = ">>" if i == e.lineno - 1 else "  "
            print(f"{prefix} {i+1}: {lines[i]}")
        return None

if __name__ == "__main__":
    data = fix_json(r"e:\Sistemas_ia\SalesMasters\data\produtos.json")
    if data:
        print("Keys in first record:")
        print(data['RecordSet'][0].keys())
        print("\nSample record:")
        print(data['RecordSet'][0])
