import crypto from 'crypto';

/**
 * Generate password from date of birth (format: DDMMYYYY)
 * Example: 08-07-2005 -> 08072005
 */
export function generatePasswordFromDOB(dob: string): string {
    if (!dob) throw new Error('DOB is required for password generation');

    try {
        // Parse date in format YYYY-MM-DD
        const dateMatch = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return `${day}${month}${year}`;
        }

        // If already in DDMMYYYY format
        if (/^\d{8}$/.test(dob)) {
            return dob;
        }

        throw new Error('Invalid DOB format');
    } catch (error) {
        throw new Error('Failed to generate password from DOB');
    }
}

/**
 * Generate a random secure password
 */
export function generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';

    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }

    return password;
}

/**
 * Generate password for a student
 * Priority: 1) Use DOB if available, 2) Generate random password
 */
export function generateStudentPassword(dob?: string): string {
    if (dob) {
        try {
            return generatePasswordFromDOB(dob);
        } catch {
            // Fall back to random if DOB parsing fails
        }
    }

    return generateRandomPassword(8);
}
