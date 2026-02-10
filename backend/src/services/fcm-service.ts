import * as admin from 'firebase-admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
    if (firebaseInitialized) {
        return;
    }

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

        if (!fs.existsSync(resolvedPath)) {
            console.log('ℹ️ Firebase service account file not found. Push notifications disabled.');
            return;
        }

        // Check if service account file exists
        const serviceAccount = require(resolvedPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized');
    } catch (error: any) {
        console.error('⚠️ Firebase Admin SDK initialization failed:', error.message);
        console.log('   Push notifications will not be sent.');
    }
}

/**
 * Send push notification to a single device token
 */
export async function sendPushNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> {
    if (!firebaseInitialized) {
        console.log('Firebase not initialized, skipping push notification');
        return false;
    }

    try {
        const message: admin.messaging.Message = {
            token: deviceToken,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    channelId: 'placement_channel',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        await admin.messaging().send(message);
        console.log(`✅ Push notification sent to device`);
        return true;
    } catch (error: any) {
        // Handle invalid token errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.log(`⚠️ Invalid device token, should be removed from database`);
        } else {
            console.error('❌ Failed to send push notification:', error.message);
        }
        return false;
    }
}

/**
 * Send push notifications to multiple students
 */
export async function sendPushToStudents(
    db: SupabaseClient,
    studentIds: number[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
    if (!firebaseInitialized || studentIds.length === 0) {
        return { sent: 0, failed: 0 };
    }

    try {
        // Fetch device tokens for these students
        const { data: tokens, error } = await db
            .from('device_tokens')
            .select('device_token, student_id')
            .in('student_id', studentIds);

        if (error) {
            console.error('Failed to fetch device tokens:', error.message);
            return { sent: 0, failed: 0 };
        }

        if (!tokens || tokens.length === 0) {
            console.log('No device tokens found for students');
            return { sent: 0, failed: 0 };
        }

        console.log(`Sending push notifications to ${tokens.length} devices`);

        let sent = 0;
        let failed = 0;
        const invalidTokens: string[] = [];

        // Send to each device token
        for (const tokenRecord of tokens) {
            const success = await sendPushNotification(
                tokenRecord.device_token,
                title,
                body,
                data
            );

            if (success) {
                sent++;
                // Update last_used_at for successful sends
                await db
                    .from('device_tokens')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('device_token', tokenRecord.device_token);
            } else {
                failed++;
                invalidTokens.push(tokenRecord.device_token);
            }
        }

        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
            await db.from('device_tokens').delete().in('device_token', invalidTokens);
            console.log(`Removed ${invalidTokens.length} invalid device tokens`);
        }

        console.log(`Push notification results: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    } catch (error: any) {
        console.error('Error sending push notifications:', error.message);
        return { sent: 0, failed: 0 };
    }
}

/**
 * Send push notification to a single student
 */
export async function sendPushToStudent(
    db: SupabaseClient,
    studentId: number,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> {
    const result = await sendPushToStudents(db, [studentId], title, body, data);
    return result.sent > 0;
}
