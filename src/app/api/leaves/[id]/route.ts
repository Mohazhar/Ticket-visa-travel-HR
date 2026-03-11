import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedLeave = await db.leave.update({
      where: { id },
      data: { status },
      include: { employee: true }
    });

    // Notify the employee about the decision
    await db.notification.create({
      data: {
        userId: updatedLeave.employeeId,
        title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${updatedLeave.leaveType} leave from ${updatedLeave.fromDate} to ${updatedLeave.toDate} has been ${status}.`,
        type: 'leave_status',
      }
    });

    // Update leave balance if approved
    if (status === 'approved') {
      const employee = updatedLeave.employee;

      if (employee) {
        const leaveBalance = JSON.parse(employee.leaveBalance);
        const startDate = new Date(updatedLeave.fromDate);
        const endDate = new Date(updatedLeave.toDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (leaveBalance[updatedLeave.leaveType] !== undefined) {
          leaveBalance[updatedLeave.leaveType] = Math.max(0, leaveBalance[updatedLeave.leaveType] - days);
        }

        await db.employee.update({
          where: { id: updatedLeave.employeeId },
          data: { leaveBalance: JSON.stringify(leaveBalance) },
        });
      }
    }

    return NextResponse.json({ success: true, leave: updatedLeave });
  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Optional: Re-imburse leave balance if a previously approved leave is deleted.
    // However, often deleting is purely an admin override action.
    await db.leave.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete leave error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
