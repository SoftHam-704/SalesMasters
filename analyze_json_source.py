import json
from datetime import datetime

JSON_PATH = r'e:\Sistemas_ia\SalesMasters\data\pedidos.json'

def analyze_json():
    try:
        print(f"Reading {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
            
        print(f"Total records in JSON: {len(records)}")
        
        jan_2026_recs = []
        total_liq = 0
        total_bruto = 0
        
        for rec in records:
            date_str = rec.get('PED_DATA')
            if not date_str: continue
            
            # Format is DD.MM.YYYY
            try:
                dt = datetime.strptime(date_str, '%d.%m.%Y')
                if dt.year == 2026 and dt.month == 1:
                    if rec.get('PED_SITUACAO') in ['P', 'F']:
                        jan_2026_recs.append(rec)
                        total_liq += float(rec.get('PED_TOTLIQ', 0))
                        total_bruto += float(rec.get('PED_TOTBRUTO', 0))
            except:
                pass
                
        print(f"JSON Jan 2026 (P/F): {len(jan_2026_recs)} records")
        print(f"JSON Total Liq: {total_liq:,.2f}")
        print(f"JSON Total Bruto: {total_bruto:,.2f}")
        
        # Group by Industry to compare
        by_ind = {}
        for r in jan_2026_recs:
            ind = r.get('PED_INDUSTRIA')
            val = float(r.get('PED_TOTLIQ', 0))
            by_ind[ind] = by_ind.get(ind, 0) + val
            
        print("\n--- JSON By Industry ---")
        for k, v in sorted(by_ind.items(), key=lambda item: item[1], reverse=True):
            print(f"Ind {k}: {v:,.2f}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_json()
