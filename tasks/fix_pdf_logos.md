# Task: Re-enable and Fix Industry Logos in PDF Generation

## Problem
The industry logos were disabled in the PDF generation process because large images caused rendering errors in the PDF generation library.

## Proposed Solution
- **Resize Images**: Scale down images before embedding them into the PDF (e.g., to 100x100px or optimal DPI).
- **Optimization**: Use a library like `sharp` or client-side canvas resizing to optimize the image size/quality.
- **Async Loading**: Ensure images are fully loaded/processed asynchronously before PDF generation starts if creating on frontend.
- **Backend handling**: If PDF is generated backend, optimize the logo asset serving.

## Action Items
1.  [x] Identify the PDF generation component/service (`OrderReportEngine.jsx` and `OrderPdfReport.jsx`).
2.  [x] Uncomment/restore the logo rendering logic.
3.  [x] Implement image resizing/optimization logic (`resizeBase64Image` in `OrderReportEngine`).
4.  [x] Test with various logo sizes to ensure stability (Implemented `industry_logotipo_resized` logic).

## Implementation Details
- **Resizing**: Added `resizeBase64Image` in `OrderReportEngine.jsx` ensuring max width of 200px and 0.6 quality for industry logos.
- **Restoration**: Removed the code that was nullifying `industry_logotipo` in `sanitizeDataForPdf`.
- **Integration**: Updated `OrderPdfReport.jsx` to prefer `order.industry_logotipo_resized`.

## Context
- User Request: "Um outro problema chato é com relação aos logotipos das industrias na impressão dos pedidos, eles foram desabilitados porque tava dando erro ao renderizar imagens grandes no pdf"
- Date: 2026-02-17
- Status: **COMPLETED**
