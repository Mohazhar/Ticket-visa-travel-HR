import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.employee.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const passSarah = await bcrypt.hash('sarah123', 10);
  const passMichael = await bcrypt.hash('michael123', 10);
  const passEmily = await bcrypt.hash('emily123', 10);
  const passDavid = await bcrypt.hash('david123', 10);

  // Create admin user
  const admin = await prisma.employee.create({
    data: {
      employeeId: 'EMP001',
      name: 'John Admin',
      email: 'admin@ticketvisatravel.com',
      password: adminPassword,
      designation: 'HR Manager',
      department: 'Human Resources',
      role: 'admin',
      leaveBalance: JSON.stringify({ annual: 20, sick: 15, personal: 5 }),
    },
  });

  // Create employees
  const employee1 = await prisma.employee.create({
    data: {
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@ticketvisatravel.com',
      password: passSarah,
      designation: 'Software Engineer',
      department: 'Engineering',
      role: 'employee',
      leaveBalance: JSON.stringify({ annual: 15, sick: 10, personal: 5 }),
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      employeeId: 'EMP003',
      name: 'Michael Chen',
      email: 'michael.chen@ticketvisatravel.com',
      password: passMichael,
      designation: 'Product Designer',
      department: 'Design',
      role: 'employee',
      leaveBalance: JSON.stringify({ annual: 12, sick: 8, personal: 3 }),
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      employeeId: 'EMP004',
      name: 'Emily Davis',
      email: 'emily.davis@ticketvisatravel.com',
      password: passEmily,
      designation: 'Marketing Specialist',
      department: 'Marketing',
      role: 'employee',
      leaveBalance: JSON.stringify({ annual: 14, sick: 9, personal: 4 }),
    },
  });

  const employee4 = await prisma.employee.create({
    data: {
      employeeId: 'EMP005',
      name: 'David Wilson',
      email: 'david.wilson@ticketvisatravel.com',
      password: passDavid,
      designation: 'Finance Analyst',
      department: 'Finance',
      role: 'employee',
      leaveBalance: JSON.stringify({ annual: 16, sick: 11, personal: 6 }),
    },
  });

  // Create sample leaves
  await prisma.leave.createMany({
    data: [
      {
        employeeId: employee1.id,
        leaveType: 'annual',
        fromDate: '2024-01-15',
        toDate: '2024-01-17',
        reason: 'Family vacation',
        status: 'approved',
      },
      {
        employeeId: employee2.id,
        leaveType: 'sick',
        fromDate: '2024-02-05',
        toDate: '2024-02-06',
        reason: 'Doctor appointment and recovery',
        status: 'approved',
      },
      {
        employeeId: employee3.id,
        leaveType: 'personal',
        fromDate: '2024-02-20',
        toDate: '2024-02-20',
        reason: 'Personal errands',
        status: 'pending',
      },
      {
        employeeId: employee4.id,
        leaveType: 'annual',
        fromDate: '2024-03-01',
        toDate: '2024-03-05',
        reason: 'Travel plans',
        status: 'pending',
      },
      {
        employeeId: employee1.id,
        leaveType: 'sick',
        fromDate: '2024-03-10',
        toDate: '2024-03-11',
        reason: 'Flu symptoms',
        status: 'rejected',
      },
    ],
  });

  // Create sample payslips
  await prisma.payslip.createMany({
    data: [
      {
        employeeId: admin.id,
        month: 1,
        year: 2024,
        basicSalary: 8000,
        allowances: 1500,
        deductions: 800,
        netSalary: 8700,
      },
      {
        employeeId: admin.id,
        month: 2,
        year: 2024,
        basicSalary: 8000,
        allowances: 1500,
        deductions: 800,
        netSalary: 8700,
      },
      {
        employeeId: employee1.id,
        month: 1,
        year: 2024,
        basicSalary: 6000,
        allowances: 1000,
        deductions: 600,
        netSalary: 6400,
      },
      {
        employeeId: employee1.id,
        month: 2,
        year: 2024,
        basicSalary: 6000,
        allowances: 1200,
        deductions: 600,
        netSalary: 6600,
      },
      {
        employeeId: employee2.id,
        month: 1,
        year: 2024,
        basicSalary: 5500,
        allowances: 800,
        deductions: 550,
        netSalary: 5750,
      },
      {
        employeeId: employee2.id,
        month: 2,
        year: 2024,
        basicSalary: 5500,
        allowances: 900,
        deductions: 550,
        netSalary: 5850,
      },
      {
        employeeId: employee3.id,
        month: 1,
        year: 2024,
        basicSalary: 5000,
        allowances: 700,
        deductions: 500,
        netSalary: 5200,
      },
      {
        employeeId: employee4.id,
        month: 1,
        year: 2024,
        basicSalary: 5800,
        allowances: 850,
        deductions: 580,
        netSalary: 6070,
      },
    ],
  });

  // Create sample expenses
  await prisma.expense.createMany({
    data: [
      {
        date: '2024-01-10',
        category: 'Office Supplies',
        description: 'Stationery and printing materials',
        amount: 250.00,
        paymentMethod: 'Company Card',
        addedBy: admin.id,
      },
      {
        date: '2024-01-15',
        category: 'Travel',
        description: 'Client meeting travel expenses',
        amount: 450.00,
        paymentMethod: 'Reimbursement',
        addedBy: admin.id,
      },
      {
        date: '2024-01-20',
        category: 'Software',
        description: 'Annual software licenses renewal',
        amount: 1200.00,
        paymentMethod: 'Company Card',
        addedBy: admin.id,
      },
      {
        date: '2024-02-05',
        category: 'Marketing',
        description: 'Social media advertising campaign',
        amount: 800.00,
        paymentMethod: 'Company Card',
        addedBy: admin.id,
      },
      {
        date: '2024-02-12',
        category: 'Equipment',
        description: 'New laptops for engineering team',
        amount: 3500.00,
        paymentMethod: 'Purchase Order',
        addedBy: admin.id,
      },
      {
        date: '2024-02-25',
        category: 'Training',
        description: 'Online courses for team development',
        amount: 600.00,
        paymentMethod: 'Company Card',
        addedBy: admin.id,
      },
    ],
  });

  console.log('\n--- SYSTEM CREDENTIALS ---');
  console.log('Admin User: admin@ticketvisatravel.com / admin123\n');
  console.log('--- EMPLOYEE CREDENTIALS ---');
  console.log('Sarah Johnson: sarah.johnson@ticketvisatravel.com / sarah123');
  console.log('Michael Chen: michael.chen@ticketvisatravel.com / michael123');
  console.log('Emily Davis: emily.davis@ticketvisatravel.com / emily123');
  console.log('David Wilson: david.wilson@ticketvisatravel.com / david123');
  console.log('----------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
