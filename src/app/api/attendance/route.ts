import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { autoCheckOutMissingRecords } from '@/lib/attendanceUtils';

export async function GET(request: NextRequest) {
    try {
        // Automatically check out anyone who forgot yesterday or earlier
        await autoCheckOutMissingRecords();

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const todayDate = new Date().toISOString().split('T')[0];

        // Check if looking for today's status only
        const searchParams = request.nextUrl.searchParams;
        const isToday = searchParams.get('today') === 'true';

        if (isToday) {
            const attendance = await db.attendance.findUnique({
                where: {
                    employeeId_date: {
                        employeeId: user.id,
                        date: todayDate,
                    }
                }
            });
            return NextResponse.json({ success: true, attendance });
        }

        // Otherwise, fetch records
        if (user.role === 'admin') {
            const attendances = await db.attendance.findMany({
                include: {
                    employee: {
                        select: { name: true, employeeId: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
            return NextResponse.json({ success: true, attendances });
        } else {
            const attendances = await db.attendance.findMany({
                where: { employeeId: user.id },
                orderBy: { date: 'desc' }
            });
            return NextResponse.json({ success: true, attendances });
        }

    } catch (error) {
        console.error('Attendance GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Automatically check out anyone who forgot yesterday or earlier
        await autoCheckOutMissingRecords();

        const user = await getAuthUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const todayDate = new Date().toISOString().split('T')[0];

        const existing = await db.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: user.id,
                    date: todayDate,
                }
            }
        });

        if (existing) {
            return NextResponse.json({ success: false, error: 'Already checked in today' }, { status: 400 });
        }

        const attendance = await db.attendance.create({
            data: {
                employeeId: user.id,
                date: todayDate,
                checkIn: new Date(),
                status: 'present',
            }
        });

        return NextResponse.json({ success: true, attendance });
    } catch (error) {
        console.error('Attendance POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        let body: any = {};
        try {
            const text = await request.text();
            body = text ? JSON.parse(text) : {};
        } catch (e) {
            body = {};
        }

        const { breakType } = body;
        const todayDate = new Date().toISOString().split('T')[0];

        // Using 'any' to bypass Prisma type checks during schema transitions
        const existingRecord = await (db.attendance as any).findUnique({
            where: {
                employeeId_date: {
                    employeeId: user.id,
                    date: todayDate,
                }
            }
        });

        if (!existingRecord) {
            return NextResponse.json({ success: false, error: 'Must check-in first' }, { status: 400 });
        }

        if (breakType) {
            let breaks: any[] = [];
            try {
                // Safeguard against missing or malformed break data
                const rawBreaks = existingRecord.breaks || '[]';
                breaks = typeof rawBreaks === 'string' ? JSON.parse(rawBreaks) : (rawBreaks || []);
                if (!Array.isArray(breaks)) breaks = [];
            } catch (e) {
                breaks = [];
            }

            const now = new Date();
            const activeBreakIndex = breaks.findIndex((b: any) => b.type === breakType && !b.end);

            if (activeBreakIndex !== -1) {
                breaks[activeBreakIndex].end = now;
            } else {
                breaks.push({ type: breakType, start: now });
            }

            const attendance = await (db.attendance as any).update({
                where: { id: existingRecord.id },
                data: { breaks: JSON.stringify(breaks) }
            });

            return NextResponse.json({ success: true, attendance });
        }

        // Default: Handle check-out
        const attendance = await (db.attendance as any).update({
            where: {
                employeeId_date: {
                    employeeId: user.id,
                    date: todayDate,
                }
            },
            data: {
                checkOut: new Date()
            }
        });

        return NextResponse.json({ success: true, attendance });
    } catch (error: any) {
        console.error('Attendance PUT error detail:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            success: false,
            error: error.message || 'Action failed',
            details: error.code || 'UNKNOWN_ERROR'
        }, { status: 500 });
    }
}
