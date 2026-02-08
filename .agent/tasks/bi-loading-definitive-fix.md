# Task: BI Loading Definitive Fix

## 📋 Objective
Resolve the persistent BI Intelligence page loading issues and the new "30000ms timeout" errors (ECONNABORTED) definitively.

## 🛠️ Tech Stack
- **Frontend**: React (Axios/Fetch)
- **Backend (Node.js)**: API Gateway / Proxy
- **BI Engine (Python)**: FastAPI
- **Database**: PostgreSQL (Tenant Schemas)

## 🔍 Diagnosis (Current State)
- Multiple endpoints are timing out at 30s.
- Tenant: `23929353000176`.
- Previous errors were 500 (Internal Server Error) after code changes.
- Current errors are ECONNABORTED (Timeout).

## 📝 Roadmap

### Phase 1: Investigation & Root Cause Analysis
- [x] Check logs for `bi-engine` (Python) and `backend` (Node.js).
- [x] Verify database connection health and potential locks.
- [x] Use `debugger` agent to trace the execution of failing endpoints.
- [x] Check if the `retry` logic implemented in `database.py` is causing a loop or resource exhaustion.

### Phase 2: Implementation (Fixes)
- [x] Optimize/Fix database interaction in `bi-engine`.
- [x] Improve error handling to fail fast instead of hanging.
- [x] Ensure `lru_cache` removal didn't cause excessive DB load (restore cache with TTL if needed).
- [x] Adjust proxy timeouts if the volume of data truly requires more than 30s (unlikely for dashboard summary).

### Phase 3: Verification
- [ ] Test the BI page with the diagnostic-enhanced code.
- [ ] Use `test-engineer` to verify endpoint performance.

## 👥 Agents Assigned
- `orchestrator`: Coordination and synthesis.
- `debugger`: Root cause analysis of timeouts.
- `backend-specialist`: Implementation of fixes in Python/Node.js.
- `performance-optimizer`: Query and response time optimization.

## 🏁 Success Criteria
- BI page loads correctly and consistently for all tenants.
- No "timeout" or "500" errors in the console.
- Dashboards display data accurately without manual refresh.
