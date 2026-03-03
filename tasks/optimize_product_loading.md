# Task: Optimize Product Loading for Large Datasets

## Problem
When selecting an industry (e.g., VANNUCCI) with a large number of products (90k+), the frontend attempts to load all records at once. This causes performance issues and is unnecessary for the user experience.

## Proposed Solution
- **Initial Load Limit**: Only load the first 100-500 products initially.
- **Pagination/Infinite Scroll**: Implement pagination or infinite scroll for browsing.
- **Search-First Approach**: Encourage users to search for specific products by code or name using the server-side search.
- **Backend Update**: Ensure the product list API endpoint accepts `limit` and `offset` parameters and respects them.

## Action Items
1.  Modify Backend API (`/products` or equivalent) to enforce a default limit (e.g., 50) if none is provided.
2.  Update Frontend Component (`ProductTable` or similar) to:
    - Send pagination parameters.
    - Handle "Load More" or pagination UI.
    - trigger search queries to the backend instead of filtering a massive local array.

## Context
- User Request: "notei um erro grave nosso, ao selecionar a tabela de preço da Vannucci, o sistema está trazendo todos os 90.000 registros pra ela... uns 2000 itens iniciais ta muito bom"
- Date: 2026-02-17
