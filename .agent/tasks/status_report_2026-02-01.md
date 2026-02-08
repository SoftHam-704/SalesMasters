# Status Report: Order Payment Field Fix

**Date:** 2026-02-01
**Task:** Fix "Payment Condition" field displaying incorrectly ("A VISTA") or not saving on Order Screen.

## ✅ Completed Actions
1.  **Identified Root Cause:**
    - Frontend (`OrderForm.jsx`) was using the legacy field name `ped_conpgto`.
    - Backend/Database expects `ped_condpag`.
    - This mismatch caused the field to fail loading existing data (showing empty/default) and saving new data.

2.  **Code Corrections:**
    - **`OrderForm.jsx`**: Replaced all occurrences of `ped_conpgto` with `ped_condpag`.
    - **`ConditionRegistrationDialog.jsx`**: Updated to read/write `ped_condpag` for client defaults.
    - **Verification**: unique search confirmed `ped_conpgto` is no longer used in the `src` folder.

3.  **Deployment:**
    - Executed `npm run build`.
    - Build completed successfully.

## ⏸️ Resume Point
**We are stopping here.** The code is fixed and built.

## 🔜 Next Steps (When Resuming)
1.  **Validation:**
    - Open the Web Application.
    - **Edit an existing order:** Confirm the "Condições" field shows the correct value from the database.
    - **Create/Edit Order:** Change the condition and Save. Verify it persists.
    - **Client Defaults:** Test the "Tornar Padrão" button to ensure it correctly captures the current payment condition.

2.  **Monitor:**
    - If any other fields show similar behavior (blank on load), we may need to check for other variable name mismatches.
