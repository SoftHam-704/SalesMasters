# Task: Enhance CRM-Rep (Bertolini & Others)

## Context
The user wants to resume development of the "CRM-Rep" module. This module was initially conceived for "Bertolini" (engineering projects) but is intended to be a general solution for representatives of various brands.
The goal is to provide a CRM dashboard and tools for representatives to manage their portfolio, opportunities (funnel), and daily activities.

## Current State
- The frontend has a `RepCrmDashboard.jsx` component.
- The dashboard is currently failing to load statistics, returning a **500 Internal Server Error** on the endpoint `/api/reports/dashboard-summary`.
- A "Project" mode (`isProjetos`) exists in the code to switch between "Engineering Specialist" and standard views.

## Objectives
1.  **Fix Dashboard Stability**: Resolve the 500 error on `/api/reports/dashboard-summary`.
2.  **Verify Data Access**: Ensure the representative (e.g., "Hamilton") handles the correct schema/data context.
3.  **Enhance Features**:
    -   Validate "Project" mode features (Lead pipeline, etc.).
    -   Implement/Verify "WhatsApp Automation" if still required (mentioned in previous conversations).

## Action Items
1.  [ ] Investigate and fix `get_dashboard_metrics` function in the database (likely missing/broken in tenant schema).
2.  [ ] Verify `RepCrmDashboard` loads correctly after backend fix.
3.  [ ] Review "Project Mode" specific requirements with the user.
