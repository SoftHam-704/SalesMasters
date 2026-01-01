from services.data_fetcher import fetch_metas_progresso
import pandas as pd

def test_goals():
    try:
        ano = 2025
        print(f"Testing Goals Scroller for {ano}...")
        df = fetch_metas_progresso(ano)
        print("--- RESULT HEAD ---")
        print(df.head())
        print("\n--- FULL DF ---")
        print(df)
        
        # Check logic locally
        if not df.empty:
            for _, row in df.iterrows():
                sales = row['total_vendas']
                goal = row['total_meta']
                pct = (sales / goal * 100) if goal > 0 else 0
                print(f"{row['industria']}: Sales={sales}, Goal={goal}, Pct={pct:.1f}%")
        else:
            print("No data found.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_goals()
