import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
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
    const { name, email, designation, department, role, canAddExpense, leaveBalance, password } = body;

    const updateData: Record<string, unknown> = {
      name,
      email,
      designation,
      department,
      role,
      canAddExpense,
    };

    if (leaveBalance) {
      updateData.leaveBalance = JSON.stringify(leaveBalance);
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        leaveBalance: JSON.parse(employee.leaveBalance),
      },
    });
  } catch (error) {
    console.error('Update employee error:', error);
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

    // Delete related records first
    await db.expense.deleteMany({ where: { addedBy: id } });
    await db.payslip.deleteMany({ where: { employeeId: id } });
    await db.leave.deleteMany({ where: { employeeId: id } });
    await db.attendance.deleteMany({ where: { employeeId: id } });
    await db.notification.deleteMany({ where: { userId: id } });

    // Delete employee
    await db.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
