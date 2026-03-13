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

    console.log('API Payslips - User:', user.email, 'Role:', user.role);

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    let payslips;
    if (user.role === 'admin' && employeeId) {
      payslips = await db.payslip.findMany({
        where: { employeeId },
        include: {
          employee: {
            select: { name: true, employeeId: true, department: true },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    } else if (user.role === 'admin') {
      payslips = await db.payslip.findMany({
        include: {
          employee: {
            select: { name: true, employeeId: true, department: true },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    } else {
      payslips = await db.payslip.findMany({
        where: { employeeId: user.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    }

    console.log('API Payslips - Found:', payslips.length);

    return NextResponse.json({ success: true, payslips });
  } catch (error) {
    console.error('Get payslips error:', error);
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
    const { employeeId, month, year, basicSalary, allowances, deductions, netSalary } = body;

    if (!employeeId || !month || !year || basicSalary === undefined || allowances === undefined || deductions === undefined || netSalary === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if payslip already exists
    const existingPayslip = await db.payslip.findFirst({
      where: { employeeId, month, year },
    });

    if (existingPayslip) {
      return NextResponse.json(
        { success: false, error: 'Payslip already exists for this month' },
        { status: 400 }
      );
    }

    const payslip = await db.payslip.create({
      data: {
        employeeId,
        month,
        year,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances),
        deductions: parseFloat(deductions),
        netSalary: parseFloat(netSalary),
      },
    });

    return NextResponse.json({ success: true, payslip });
  } catch (error) {
    console.error('Create payslip error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
