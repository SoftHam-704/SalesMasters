/**
 * Utility for Excel operations (import/export)
 * Uses dynamic import of 'xlsx' to reduce main bundle size.
 */

/**
 * Loads the XLSX library dynamically
 */
export const loadXLSX = async () => {
    return await import('xlsx');
};

/**
 * Exports data to an Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file
 * @param {string} sheetName - Name of the worksheet
 * @param {Object} options - Additional options (column widths, etc.)
 */
export const exportToExcel = async (data, fileName, sheetName = 'Sheet1', options = {}) => {
    const XLSX = await loadXLSX();

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Apply column widths if provided
    if (options.colWidths) {
        ws['!cols'] = options.colWidths;
    }

    // Apply number formats if provided
    if (options.formats) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        options.formats.forEach(f => {
            const { colStart, colEnd, format } = f;
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = colStart; C <= colEnd; ++C) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell) cell.z = format;
                }
            }
        });
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write and save
    XLSX.writeFile(wb, fileName);
};

/**
 * Reads an Excel file and returns its content as JSON
 * @param {File} file - The file to read
 * @param {Object} options - Options for XLSX.read and XLSX.utils.sheet_to_json
 */
export const readExcelFile = async (file, options = {}) => {
    const XLSX = await loadXLSX();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, ...options.readOptions });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws, options.jsonOptions);
                resolve(jsonData);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
