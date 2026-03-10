'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, UserPlus, Check, X, Loader2, FileText, DollarSign, Trash2, Edit, Download, Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
  leaveBalance: {
    annual: number;
    sick: number;
    personal: number;
  };
}

interface Leave {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  employee?: {
    name: string;
    employeeId: string;
    department: string;
  };
}

interface Payslip {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  employee?: {
    name: string;
    employeeId: string;
  };
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  employee?: {
    name: string;
    employeeId: string;
  };
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const departments = ['Engineering', 'Design', 'Marketing', 'Finance', 'Human Resources', 'Operations', 'Sales'];

export default function AdminPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialogs
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [deleteEmployeeDialogOpen, setDeleteEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Forms
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    designation: '',
    department: '',
    role: 'employee',
    annualLeave: '15',
    sickLeave: '10',
    personalLeave: '5',
  });

  const [payslipForm, setPayslipForm] = useState({
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    basicSalary: '',
    allowances: '',
    deductions: '',
  });

  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      const [empRes, leaveRes, payslipRes, attRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/leaves'),
        fetch('/api/payslips'),
        fetch('/api/attendance')
      ]);

      const empData = await empRes.json();
      const leaveData = await leaveRes.json();
      const payslipData = await payslipRes.json();
      const attData = await attRes.json();

      if (empData.success) setEmployees(empData.employees);
      if (leaveData.success) setLeaves(leaveData.leaves);
      if (payslipData.success) setPayslips(payslipData.payslips);
      if (attData.success) {
        setAttendances(attData.attendances);
      }

      const todayRes = await fetch('/api/attendance?today=true');
      const todayData = await todayRes.json();
      if (todayData.success) {
        setTodayAttendance(todayData.attendance);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetEmployeeForm = () => {
    setEmployeeForm({
      employeeId: '',
      name: '',
      email: '',
      password: '',
      designation: '',
      department: '',
      role: 'employee',
      annualLeave: '15',
      sickLeave: '10',
      personalLeave: '5',
    });
    setEditingEmployee(null);
  };

  const handleOpenAddEmployee = () => {
    resetEmployeeForm();
    setEmployeeDialogOpen(true);
  };

  const handleOpenEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      password: '',
      designation: employee.designation,
      department: employee.department,
      role: employee.role,
      annualLeave: employee.leaveBalance.annual.toString(),
      sickLeave: employee.leaveBalance.sick.toString(),
      personalLeave: employee.leaveBalance.personal.toString(),
    });
    setEmployeeDialogOpen(true);
  };

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        employeeId: employeeForm.employeeId,
        name: employeeForm.name,
        email: employeeForm.email,
        ...(employeeForm.password && { password: employeeForm.password }),
        designation: employeeForm.designation,
        department: employeeForm.department,
        role: employeeForm.role,
        leaveBalance: {
          annual: parseInt(employeeForm.annualLeave),
          sick: parseInt(employeeForm.sickLeave),
          personal: parseInt(employeeForm.personalLeave),
        },
      };

      if (editingEmployee) {
        const res = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          fetchData();
          setEmployeeDialogOpen(false);
          resetEmployeeForm();
        } else {
          alert(`Error: ${data.error || 'Failed to update employee'}`);
        }
      } else {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, password: employeeForm.password || 'employee123' }),
        });
        const data = await res.json();
        if (data.success) {
          fetchData();
          setEmployeeDialogOpen(false);
          resetEmployeeForm();
        } else {
          alert(`Error: ${data.error || 'Failed to create employee'}`);
        }
      }
    } catch (err) {
      console.error('Error saving employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      const res = await fetch(`/api/employees/${deletingEmployee.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setDeleteEmployeeDialogOpen(false);
        setDeletingEmployee(null);
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating leave:', err);
    }
  };

  const generatePayslipPDF = async (payslip: Payslip) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Fetch and Draw logo
    try {
      const imgRes = await fetch('/logo.png');
      const imgBlob = await imgRes.blob();
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onloadend = () => {
          doc.addImage(reader.result as string, 'PNG', pageWidth / 2 - 30, 6, 60, 15);
          resolve(null);
        };
        reader.readAsDataURL(imgBlob);
      });
    } catch (e) {
      console.error("Could not add logo to PDF:", e);
    }

    // Header
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Official Payslip', pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    // Employee Details
    doc.text(`Employee Name: ${payslip.employee?.name || 'N/A'}`, 14, 45);
    doc.text(`Employee ID: ${payslip.employee?.employeeId || 'N/A'}`, 14, 52);
    doc.text(`Month/Year: ${monthNames[payslip.month - 1]} ${payslip.year}`, 14, 59);

    // Salary Details Table
    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Amount (₹)']],
      body: [
        ['Basic Salary', payslip.basicSalary.toLocaleString()],
        ['Allowances', `+ ${payslip.allowances.toLocaleString()}`],
        ['Deductions', `- ${payslip.deductions.toLocaleString()}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
      styles: { fontSize: 11, cellPadding: 5 },
    });

    // Net Salary
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Salary: ₹${payslip.netSalary.toLocaleString()}`, 14, finalY + 15);

    doc.save(`Payslip_${payslip.employee?.name?.replace(/\s+/g, '_')}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`);
  };

  const handleOpenEditPayslip = (payslip: Payslip) => {
    setEditingPayslip(payslip);
    setPayslipForm({
      employeeId: payslip.employee?.employeeId || '', // Just a string ID works here, but Select needs corresponding ID
      month: payslip.month.toString(),
      year: payslip.year.toString(),
      basicSalary: payslip.basicSalary.toString(),
      allowances: payslip.allowances.toString(),
      deductions: payslip.deductions.toString(),
    });
    // Set explicit id since the Select component uses the relation ID, not employeeId property
    if (payslip.employee) {
      const emp = employees.find(e => e.employeeId === payslip.employee!.employeeId);
      if (emp) {
        setPayslipForm(prev => ({ ...prev, employeeId: emp.id }));
      }
    }
    setPayslipDialogOpen(true);
  };

  const resetPayslipForm = () => {
    setEditingPayslip(null);
    setPayslipForm({
      employeeId: '',
      month: '',
      year: new Date().getFullYear().toString(),
      basicSalary: '',
      allowances: '',
      deductions: '',
    });
  };

  const handleSubmitPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        employeeId: payslipForm.employeeId,
        month: parseInt(payslipForm.month),
        year: parseInt(payslipForm.year),
        basicSalary: parseFloat(payslipForm.basicSalary),
        allowances: parseFloat(payslipForm.allowances),
        deductions: parseFloat(payslipForm.deductions),
        netSalary: parseFloat(payslipForm.basicSalary) + parseFloat(payslipForm.allowances) - parseFloat(payslipForm.deductions),
      };

      if (editingPayslip) {
        const res = await fetch(`/api/payslips/${editingPayslip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          fetchData();
          setPayslipDialogOpen(false);
          resetPayslipForm();
        } else {
          console.error('Error updating payslip:', data.error);
          alert(data.error || 'Failed to update payslip');
        }
      } else {
        const res = await fetch('/api/payslips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          fetchData();
          setPayslipDialogOpen(false);
          resetPayslipForm();
        } else {
          console.error('Error creating payslip:', data.error);
          alert(data.error || 'Failed to update payslip');
        }
      }
    } catch (err) {
      console.error('Error handling payslip:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch('/api/attendance', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.attendance);
        fetchData(); // Refresh list to show online status instantly
      }
    } catch (error) {
      console.error('Check in error:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch('/api/attendance', { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.attendance);
        fetchData(); // Refresh list to remove online status instantly
      }
    } catch (error) {
      console.error('Check out error:', error);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-md max-w-md mx-auto mt-20">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don&apos;t have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header and Personal Attendance */}
      <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#ea580c]">Admin Panel</h1>
          <p className="text-gray-500">Manage employees, leaves, and payslips</p>
        </div>

        <Card className="border border-orange-100 shadow-sm md:min-w-[320px]">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center whitespace-nowrap">
              <span className="text-sm font-medium text-gray-500 mr-4">My Attendance</span>
              <Badge variant={todayAttendance ? (todayAttendance.checkOut ? "secondary" : "default") : "outline"} className={todayAttendance && !todayAttendance.checkOut ? "bg-green-500 hover:bg-green-600 border-0" : ""}>
                {!todayAttendance ? 'Not Checked In' : (!todayAttendance.checkOut ? 'Currently Working' : 'Checked Out')}
              </Badge>
            </div>

            <div className="flex justify-around items-center">
              {!todayAttendance ? (
                <Button size="sm" onClick={handleCheckIn} className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              ) : !todayAttendance.checkOut ? (
                <div className="w-full flex gap-3">
                  <div className="flex-1 text-center bg-gray-50 rounded px-2 py-1.5 border border-gray-100 font-medium text-gray-700 text-sm flex items-center justify-center">
                    {new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Button size="sm" onClick={handleCheckOut} variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" disabled variant="outline" className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Shift Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-[#ea580c]">{employees.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#ea580c]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Leaves</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingLeaves.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payslips</p>
                <p className="text-2xl font-bold text-green-600">{payslips.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="flex overflow-x-auto w-full justify-start sm:grid sm:grid-cols-4 mb-4 hide-scrollbar">
          <TabsTrigger value="employees" className="min-w-[120px]">Employees</TabsTrigger>
          <TabsTrigger value="leaves" className="min-w-[120px]">Leave Requests</TabsTrigger>
          <TabsTrigger value="payslips" className="min-w-[120px]">Payslips</TabsTrigger>
          <TabsTrigger value="attendance" className="min-w-[120px]">Attendance</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#ea580c]">Employee Management</CardTitle>
                <CardDescription>Manage all employee records</CardDescription>
              </div>
              <Button onClick={handleOpenAddEmployee} className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Leave Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                              {employee.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              A:{employee.leaveBalance.annual} S:{employee.leaveBalance.sick} P:{employee.leaveBalance.personal}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditEmployee(employee)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingEmployee(employee);
                                  setDeleteEmployeeDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leaves">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#ea580c]">Leave Requests</CardTitle>
              <CardDescription>Approve or reject employee leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
                </div>
              ) : leaves.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{leave.employee?.name}</p>
                              <p className="text-xs text-gray-500">{leave.employee?.department}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{leave.leaveType}</TableCell>
                          <TableCell>{leave.fromDate}</TableCell>
                          <TableCell>{leave.toDate}</TableCell>
                          <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                leave.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : leave.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {leave.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleLeaveAction(leave.id, 'approved')}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => handleLeaveAction(leave.id, 'rejected')}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No leave requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#ea580c]">Payslip Management</CardTitle>
                <CardDescription>Upload and manage employee payslips</CardDescription>
              </div>
              <Button onClick={() => setPayslipDialogOpen(true)} className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                <DollarSign className="w-4 h-4 mr-2" />
                Upload Payslip
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
                </div>
              ) : payslips.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Allowances</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((payslip) => (
                        <TableRow key={payslip.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payslip.employee?.name}</p>
                              <p className="text-xs text-gray-500">{payslip.employee?.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{monthNames[payslip.month - 1]} {payslip.year}</TableCell>
                          <TableCell>₹{payslip.basicSalary.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">+₹{payslip.allowances.toLocaleString()}</TableCell>
                          <TableCell className="text-red-500">-₹{payslip.deductions.toLocaleString()}</TableCell>
                          <TableCell className="font-bold">₹{payslip.netSalary.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditPayslip(payslip)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generatePayslipPDF(payslip)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No payslips found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <div>
                <CardTitle className="text-lg font-semibold text-[#ea580c]">Attendance Records</CardTitle>
                <CardDescription>View all employee check-in and check-out logs</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">{attendances.filter(a => !a.checkOut).length} Online</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
                </div>
              ) : attendances.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.employee?.name}</p>
                              <p className="text-xs text-gray-500">{record.employee?.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</TableCell>
                          <TableCell>
                            <Badge variant={record.checkOut ? "secondary" : "default"} className={!record.checkOut ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : ""}>
                              <div className="flex items-center gap-1.5">
                                {!record.checkOut && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
                                {record.checkOut ? 'Checked Out' : 'Online / Working'}
                              </div>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={(open) => { setEmployeeDialogOpen(open); if (!open) resetEmployeeForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ea580c]">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee details' : 'Enter the details for the new employee'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={employeeForm.employeeId}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                  placeholder="EMP001"
                  required
                  disabled={!!editingEmployee}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={employeeForm.role}
                  onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password {editingEmployee && '(leave blank to keep current)'}</Label>
              <Input
                type="password"
                value={employeeForm.password}
                onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                placeholder={editingEmployee ? '••••••••' : 'Enter password'}
                required={!editingEmployee}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={employeeForm.department}
                  onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={employeeForm.designation}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                  placeholder="Software Engineer"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Leave Balance</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Annual</Label>
                  <Input
                    type="number"
                    value={employeeForm.annualLeave}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, annualLeave: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Sick</Label>
                  <Input
                    type="number"
                    value={employeeForm.sickLeave}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, sickLeave: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Personal</Label>
                  <Input
                    type="number"
                    value={employeeForm.personalLeave}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, personalLeave: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEmployeeDialogOpen(false); resetEmployeeForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingEmployee ? 'Update' : 'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={(open) => { setPayslipDialogOpen(open); if (!open) resetPayslipForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#ea580c]">
              {editingPayslip ? 'Edit Payslip' : 'Upload Payslip'}
            </DialogTitle>
            <DialogDescription>
              {editingPayslip ? 'Update employee payslip details' : 'Create a new payslip for an employee'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayslip} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={payslipForm.employeeId}
                onValueChange={(value) => setPayslipForm({ ...payslipForm, employeeId: value })}
                disabled={!!editingPayslip}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={payslipForm.month}
                  onValueChange={(value) => setPayslipForm({ ...payslipForm, month: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={payslipForm.year}
                  onChange={(e) => setPayslipForm({ ...payslipForm, year: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  value={payslipForm.basicSalary}
                  onChange={(e) => setPayslipForm({ ...payslipForm, basicSalary: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Allowances</Label>
                <Input
                  type="number"
                  value={payslipForm.allowances}
                  onChange={(e) => setPayslipForm({ ...payslipForm, allowances: e.target.value })}
                  placeholder="500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deductions</Label>
                <Input
                  type="number"
                  value={payslipForm.deductions}
                  onChange={(e) => setPayslipForm({ ...payslipForm, deductions: e.target.value })}
                  placeholder="200"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Net Salary:</span>
                <span className="font-bold">
                  ₹{payslipForm.basicSalary && payslipForm.allowances && payslipForm.deductions
                    ? (parseFloat(payslipForm.basicSalary) + parseFloat(payslipForm.allowances) - parseFloat(payslipForm.deductions)).toLocaleString()
                    : '0'}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayslipDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingPayslip ? 'Update' : 'Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <AlertDialog open={deleteEmployeeDialogOpen} onOpenChange={setDeleteEmployeeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingEmployee?.name}? This will also delete all their leaves, payslips, and expenses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}