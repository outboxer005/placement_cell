import csvParser from 'csv-parser';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';

export interface StudentRow {
    username: string;  // Registration ID
    password: string;  // Plain text password
}

export interface ParseResult {
    success: boolean;
    data: StudentRow[];
    errors: Array<{ row: number; field: string; message: string }>;
}

/**
 * Parse CSV file buffer into student credentials
 * Expected columns: Username, Password (or variations)
 */
export async function parseCSV(buffer: Buffer): Promise<ParseResult> {
    const results: StudentRow[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];

    return new Promise((resolve) => {
        const stream = Readable.from(buffer);
        let rowNumber = 0;

        stream
            .pipe(csvParser())
            .on('data', (row: any) => {
                rowNumber++;
                try {
                    const student = normalizeStudentRow(row);
                    if (!student.username || !student.password) {
                        errors.push({
                            row: rowNumber,
                            field: !student.username ? 'username' : 'password',
                            message: 'Both Username and Password are required'
                        });
                    } else {
                        results.push(student);
                    }
                } catch (error: any) {
                    errors.push({ row: rowNumber, field: 'unknown', message: error.message || 'Parse error' });
                }
            })
            .on('end', () => {
                resolve({ success: errors.length === 0, data: results, errors });
            })
            .on('error', (error) => {
                errors.push({ row: 0, field: 'file', message: error.message || 'CSV parse failed' });
                resolve({ success: false, data: results, errors });
            });
    });
}

/**
 * Parse Excel file buffer into student credentials
 * Expected columns: Username, Password (or variations)
 */
export async function parseExcel(buffer: Buffer): Promise<ParseResult> {
    const results: StudentRow[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return { success: false, data: [], errors: [{ row: 0, field: 'file', message: 'No worksheet found' }] };
        }

        const headers: string[] = [];
        let headerFound = false;

        worksheet.eachRow((row, rowNumber) => {
            if (!headerFound) {
                // Assume the first non-empty row is the header row
                const rowValues = row.values as (string | number | null | undefined)[];
                if (rowValues.some(v => v !== null && v !== undefined && String(v).trim() !== '')) {
                    row.eachCell((cell) => {
                        headers.push(String(cell.value || '').trim().toLowerCase());
                    });
                    headerFound = true;
                }
                return;
            }

            // Process data rows after header is found
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value;
                }
            });

            try {
                const student = normalizeStudentRow(rowData);
                if (!student.username || !student.password) {
                    errors.push({
                        row: rowNumber,
                        field: !student.username ? 'username' : 'password',
                        message: 'Both Username and Password are required'
                    });
                } else {
                    results.push(student);
                }
            } catch (error: any) {
                errors.push({ row: rowNumber, field: 'unknown', message: error.message || 'Parse error' });
            }
        });

        return { success: errors.length === 0, data: results, errors };
    } catch (error: any) {
        return {
            success: false,
            data: results,
            errors: [{ row: 0, field: 'file', message: error.message || 'Excel parse failed' }],
        };
    }
}

/**
 * Normalize a row from CSV or Excel into standard StudentRow format
 * Looks for: username, password (case-insensitive, various column names)
 */
function normalizeStudentRow(raw: any): StudentRow {
    // Handle different possible column names for username
    const username = findValue(raw, [
        'username', 'user name', 'user_name',
        'regdid', 'regd_id', 'regd id',
        'registration id', 'registration_id', 'registrationid',
        'student id', 'student_id', 'studentid',
        'roll number', 'roll_number', 'rollnumber',
        'university reg no', 'reg no'
    ]);

    // Handle different possible column names for password
    const password = findValue(raw, [
        'password', 'pass', 'pwd',
        'student password', 'student_password'
    ]);

    return {
        username: String(username || '').trim(),
        password: String(password || '').trim(),
    };
}

/**
 * Find value from object with multiple possible key names (case-insensitive)
 */
function findValue(obj: any, keys: string[]): any {
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
        // Try case-insensitive match
        const matchingKey = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
        if (matchingKey && obj[matchingKey] !== undefined && obj[matchingKey] !== null && obj[matchingKey] !== '') {
            return obj[matchingKey];
        }
    }
    return undefined;
}
