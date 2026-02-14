# Task: CRM Module Continuation - Phase 2

## Context
Continuing the implementation of the RepCRM module for SalesMasters. The goal is to move from mock data to real-time intelligence and start the mobile check-in logic.

## Objectives
1.  **Client 360 Penetration Matrix (GAPs)**: [Done] Cross `pedidos` + `fornecedores` to identify which industries a specific client is NOT buying from.
2.  **Dashboard KPIs Integration**: [Done] Connect the `RepCrmDashboard.jsx` cards to real data from the backend.
3.  **Check-in Logic Skeleton**: [Done] Create the initial structure for capturing visits and logins with location data.

## Implementation Plan

### Phase 1: Backend - Penetration Matrix Endpoint
-   [x] Create `/api/crm/client-matrix/:id` in `backend/crm_endpoints_v2.js`.
-   [x] SQL logic to join `fornecedores` with a subquery of `pedidos` filtered by `cli_codigo`.

### Phase 2: Frontend - Client 360 Integration
-   [x] Update `RepCrmClient360.jsx` to fetch matrix data from the new endpoint.
-   [x] Replace mock array in `fetchData`.

### Phase 3: Frontend - Dashboard Data Mapping
-   [x] Update `RepCrmDashboard.jsx` to consume `stats.data` from `/reports/dashboard-summary`.
-   [x] Ensure `KpiCard` components show real values.

### Phase 4: Check-in Prototype
-   [x] Define schema (auto-create `crm_checkins`).
-   [x] Create basic endpoint in `backend/crm_endpoints_v2.js`.
-   [x] Add Check-in button to Client 360 frontend.

## Socratic Gate Questions
1.  **GAPs Definition**: Should "active" be strictly last 12 months, or should it include older history?
2.  **KPI Targets**: How should the "Month Goal" (Meta) be calculated/fetched? Fixed or from a table?
3.  **Check-in Scope**: Should it involve image capture or just GPS coordinates and timestamp?

## Verification Criteria
- [ ] Client 360 Matrix shows real active/gap industries.
- [ ] Dashboard KPIs reflect real order totals.
- [ ] Backend supports new endpoints without errors.
