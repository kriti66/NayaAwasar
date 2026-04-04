import cron from 'node-cron';
import { expireStaleRescheduleWorkflows } from '../controllers/interviewRescheduleController.js';

/**
 * Runs every hour; expires pending/countered reschedule workflows past their deadline.
 */
export function startRescheduleExpiryCron() {
    cron.schedule(
        '0 * * * *',
        async () => {
            try {
                const n = await expireStaleRescheduleWorkflows();
                if (n > 0 && process.env.NODE_ENV !== 'production') {
                    console.log(`[reschedule-expiry] processed ${n} expired workflow(s)`);
                }
            } catch (err) {
                console.error('[reschedule-expiry]', err);
            }
        },
        { timezone: 'UTC' }
    );
}
