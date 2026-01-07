import os
import urllib.parse
import psycopg2
from datetime import datetime
from decimal import Decimal

# Hardcoded credentials from config.py to avoid .env encoding issues
DB_USER = "postgres"
DB_PASS = "@12Pilabo"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "basesales"

encoded_pass = urllib.parse.quote_plus(DB_PASS)
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_seller_id(cur, name_part):
    # Try exact-ish match first
    cur.execute("SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_nome ILIKE %s", (f"%{name_part}%",))
    res = cur.fetchall()
    if len(res) == 1:
        return res[0][0], res[0][1]
    elif len(res) > 1:
        print(f"Multiple sellers found for '{name_part}': {res}")
        return res[0][0], res[0][1] 
    
    # Try splitting
    parts = name_part.split()
    if len(parts) > 0:
        cur.execute("SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_nome ILIKE %s", (f"%{parts[0]}%",))
        res = cur.fetchall()
        if res:
             print(f"Found partial matches for '{parts[0]}': {res}")
             for r in res:
                 if 'mascarenhas' in r[1].lower():
                     return r[0], r[1]
             return res[0][0], res[0][1]
             
    return None, None

def get_monthly_sales(cur, seller_id, year):
    print(f"Fetching sales for Seller {seller_id} Year {year}...")
    query = """
    SELECT 
        EXTRACT(MONTH FROM ped_data) as mes,
        ped_industria as industria,
        SUM(ped_totliq) as total
    FROM pedidos
    WHERE ped_vendedor = %s
      AND EXTRACT(YEAR FROM ped_data) = %s
      AND ped_situacao NOT IN ('C', 'CAN')
    GROUP BY 1, 2
    ORDER BY 2, 1
    """
    cur.execute(query, (seller_id, year))
    rows = cur.fetchall()
    
    sales_by_ind = {}
    for mes, ind, total in rows:
        if ind not in sales_by_ind:
            sales_by_ind[ind] = {}
        sales_by_ind[ind][int(mes)] = total
    return sales_by_ind

def upsert_goals(cur, seller_id, year, sales_data, percentage_increase):
    months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    
    for industry, monthly_sales in sales_data.items():
        goals = {}
        total_goal = 0
        
        print(f"  > Industry {industry}:")
        for i, month_name in enumerate(months):
            month_num = i + 1
            sales = monthly_sales.get(month_num, 0)
            if sales is None: sales = 0
            
            sales = float(sales)
            goal = sales * (1 + percentage_increase)
            goals[month_name] = goal
            total_goal += goal

        print(f"    Calculated 20{year} Goals (Total: {total_goal:.2f})")
        
        # Check if exists
        check_sql = "SELECT met_id FROM vend_metas WHERE met_vendedor = %s AND met_industria = %s AND met_ano = %s"
        cur.execute(check_sql, (seller_id, industry, year))
        exists = cur.fetchone()
        
        if exists:
            update_sql = """
            UPDATE vend_metas SET
                met_jan = %s, met_fev = %s, met_mar = %s, met_abr = %s, met_mai = %s, met_jun = %s,
                met_jul = %s, met_ago = %s, met_set = %s, met_out = %s, met_nov = %s, met_dez = %s
            WHERE met_id = %s
            """
            params = [
                goals['jan'], goals['fev'], goals['mar'], goals['abr'], goals['mai'], goals['jun'],
                goals['jul'], goals['ago'], goals['set'], goals['out'], goals['nov'], goals['dez'],
                exists[0]
            ]
            cur.execute(update_sql, params)
        else:
            insert_sql = """
            INSERT INTO vend_metas (
                met_ano, met_industria, met_vendedor,
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ) VALUES (
                %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
            """
            params = [
                year, industry, seller_id,
                goals['jan'], goals['fev'], goals['mar'], goals['abr'], goals['mai'], goals['jun'],
                goals['jul'], goals['ago'], goals['set'], goals['out'], goals['nov'], goals['dez']
            ]
            cur.execute(insert_sql, params)

def main():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Get Seller
        seller_id, seller_name = get_seller_id(cur, "Fabio Mascarenhas")
        if not seller_id:
            seller_id, seller_name = get_seller_id(cur, "Fabio")
            
        if not seller_id:
            print("Seller Fabio Mascarenhas not found!")
            return
            
        print(f"Found Seller: {seller_name} (ID: {seller_id})")
        
        years_map = [
            (2023, 2024),
            (2024, 2025),
            (2025, 2026)
        ]

        for source_year, target_year in years_map:
            print(f"\n--- Processing {source_year} Sales -> {target_year} Goals ---")
            sales_data = get_monthly_sales(cur, seller_id, source_year)
            
            if not sales_data:
                print(f"  No sales found for {source_year}. Skipping {target_year} goals generation.")
            else:
                upsert_goals(cur, seller_id, target_year, sales_data, 0.15)
             
        conn.commit()
        print("\nSUCCESS! Goals updated.")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals() and conn:
            conn.rollback()

if __name__ == "__main__":
    main()
