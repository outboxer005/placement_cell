import * as XLSX from 'xlsx';

export type FieldConfig = {
    key: string;
    label: string;
    defaultSelected?: boolean;
    transform?: (value: any) => any;
};

/**
 * Export data to Excel file with selected fields
 */
export function exportToExcel(
    data: any[],
    filename: string,
    selectedFields: FieldConfig[]
) {
    if (!data || data.length === 0) {
        throw new Error('No data to export');
    }

    // Transform data to include only selected fields
    const exportData = data.map(row => {
        const transformedRow: any = {};
        selectedFields.forEach(field => {
            const value = getNestedValue(row, field.key);
            transformedRow[field.label] = field.transform
                ? field.transform(value)
                : value ?? '';
        });
        return transformedRow;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = selectedFields.map(field => ({
        wch: Math.max(field.label.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate file name with date
    const date = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fullFilename);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Common data transformers
 */
export const transformers = {
    boolean: (value: any) => value ? 'Yes' : 'No',
    date: (value: any) => value ? new Date(value).toLocaleDateString() : '',
    number: (value: any) => value != null ? Number(value) : '',
    array: (value: any[]) => Array.isArray(value) ? value.join(', ') : '',
    currency: (value: any) => value || '-',
};
