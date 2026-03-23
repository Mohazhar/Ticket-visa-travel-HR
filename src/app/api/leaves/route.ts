import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    let leaves;
    if (user.role === 'admin' && employeeId) {
      leaves = await db.leave.findMany({
        where: { employeeId },
        include: {
          employee: {
            select: { name: true, employeeId: true, department: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'admin') {
      leaves = await db.leave.findMany({
        include: {
          employee: {
            select: { name: true, employeeId: true, department: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      leaves = await db.leave.findMany({
        where: { employeeId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, leaves });
  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leaveType, fromDate, toDate, reason, employeeId } = body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isAdmin = user.role === 'admin';
    const targetEmployeeId = isAdmin && employeeId ? employeeId : user.id;
    const finalStatus = isAdmin && employeeId ? 'approved' : 'pending';

    const leave = await db.leave.create({
      data: {
        employeeId: targetEmployeeId,
        leaveType,
        fromDate,
        toDate,
        reason,
        status: finalStatus,
      },
    });

    if (finalStatus === 'pending') {
      // Notify all admins about the new leave request
      const admins = await db.employee.findMany({
        where: { role: 'admin' },
      });

      if (admins.length > 0) {
        const notifications = admins.map((admin) => ({
          userId: admin.id,
          title: 'New Leave Request',
          message: `${user.name} has applied for ${leaveType} leave from ${fromDate} to ${toDate}.`,
          type: 'leave_request',
        }));

        await db.notification.createMany({
          data: notifications,
        });
      }
    } else {
      // Notify the employee that an admin added leave for them
      await db.notification.create({
        data: {
          userId: targetEmployeeId,
          title: 'Leave Added',
          message: `An admin has logged ${leaveType} leave for you from ${fromDate} to ${toDate}. Reason: ${reason}`,
          type: 'leave_update',
        }
      });
    }

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error('Create leave error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
