import { NextResponse } from 'next/server';
import { autoCheckOutMissingRecords } from '@/lib/attendanceUtils';

/**
 * Endpoint for cron jobs to trigger auto-checkout.
 * Can be called by Vercel Cron, GitHub Actions, or any external scheduler.
 */
export async function GET(request: Request) {
    // Optional: Add simple secret key check for security if desired
    // const { searchParams } = new URL(request.url);
    // if (searchParams.get('key') !== process.env.CRON_SECRET) {
    //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        await autoCheckOutMissingRecords();
        return NextResponse.json({ 
            success: true, 
            message: 'Auto-checkout cleanup completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron auto-checkout error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to perform auto-checkout' 
        }, { status: 500 });
    }
}
