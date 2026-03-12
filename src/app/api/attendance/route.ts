import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
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

        const body = await request.json().catch(() => ({}));
        const { breakType } = body;
        const todayDate = new Date().toISOString().split('T')[0];

        const existingRecord = await db.attendance.findUnique({
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
                breaks = JSON.parse((existingRecord as any).breaks || '[]');
                if (!Array.isArray(breaks)) breaks = [];
            } catch (e) {
                breaks = [];
            }
            const now = new Date();

            // Find an active (unended) break of the same type
            const activeBreakIndex = breaks.findIndex((b: any) => b.type === breakType && !b.end);

            if (activeBreakIndex !== -1) {
                // End the break
                breaks[activeBreakIndex].end = now;
            } else {
                // Start a new break
                breaks.push({
                    type: breakType,
                    start: now
                });
            }

            const attendance = await (db.attendance as any).update({
                where: { id: existingRecord.id },
                data: { breaks: JSON.stringify(breaks) }
            });

            return NextResponse.json({ success: true, attendance });
        }

        // Default: Handle check-out
        const attendance = await db.attendance.update({
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
    } catch (error) {
        console.error('Attendance PUT error detail:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Action failed'
        }, { status: 500 });
    }
}
