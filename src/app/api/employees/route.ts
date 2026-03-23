import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const employees = await db.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        designation: true,
        department: true,
        role: true,
        canAddExpense: true,
        leaveBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedEmployees = employees.map((emp) => ({
      ...emp,
      leaveBalance: JSON.parse(emp.leaveBalance),
    }));

    return NextResponse.json({ success: true, employees: formattedEmployees });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, name, email, password, designation, department, role, canAddExpense, leaveBalance } = body;

    if (!employeeId || !name || !email || !password || !designation || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingEmployee = await db.employee.findFirst({
      where: {
        OR: [{ employeeId }, { email }],
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee ID or email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await db.employee.create({
      data: {
        employeeId,
        name,
        email,
        password: hashedPassword,
        designation,
        department,
        role: role || 'employee',
        canAddExpense: canAddExpense || false,
        leaveBalance: JSON.stringify(leaveBalance || { annual: 15, sick: 10, personal: 5 }),
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
        department: employee.department,
        role: employee.role,
        canAddExpense: employee.canAddExpense,
        leaveBalance: JSON.parse(employee.leaveBalance),
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
