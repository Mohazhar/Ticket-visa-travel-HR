import { db } from './db';

/**
 * Automatically checks out any employees who forgot to check out on previous days.
 * Sets their check-out time to 11:59:59 PM of the day they checked in.
 */
export async function autoCheckOutMissingRecords() {
    try {
        const todayDate = new Date().toISOString().split('T')[0];

        // Find all records from previous days that don't have a check-out
        const missingCheckouts = await db.attendance.findMany({
            where: {
                checkOut: null,
                date: {
                    lt: todayDate
                }
            }
        });

        if (missingCheckouts.length === 0) return;

        console.log(`Auto-checkout: Processing ${missingCheckouts.length} missing records.`);

        // Process each record to set checkout to 11:59:59 PM of that record's date
        for (const record of missingCheckouts) {
            const checkoutTime = new Date(`${record.date}T23:59:59`);
            
            await db.attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: checkoutTime,
                    // Optionally close any open breaks as well
                    status: 'present' // Ensure status is consistent
                }
            });

            // Close any open breaks
            if (record.breaks) {
                try {
                    let breaks = JSON.parse(record.breaks);
                    if (Array.isArray(breaks)) {
                        let updated = false;
                        breaks = breaks.map((b: any) => {
                            if (!b.end) {
                                b.end = checkoutTime;
                                updated = true;
                            }
                            return b;
                        });
                        if (updated) {
                            await db.attendance.update({
                                where: { id: record.id },
                                data: { breaks: JSON.stringify(breaks) }
                            });
                        }
                    }
                } catch (e) {
                    console.error(`Failed to parse breaks for ${record.id}`, e);
                }
            }
        }
    } catch (error) {
        console.error('Error during auto-checkout:', error);
    }
}
