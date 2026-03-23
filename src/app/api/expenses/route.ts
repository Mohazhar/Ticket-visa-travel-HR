import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const expenses = await db.expense.findMany({
      include: {
        employee: {
          select: { name: true, employeeId: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || (user.role !== 'admin' && !user.canAddExpense)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to add expenses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, category, description, amount, paymentMethod } = body;

    if (!date || !category || !description || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const expense = await db.expense.create({
      data: {
        date,
        category,
        description,
        amount: parseFloat(amount),
        paymentMethod,
        addedBy: user.id,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
