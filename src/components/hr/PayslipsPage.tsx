'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign, Download, Eye, Loader2 } from 'lucide-react';

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
    department: string;
  };
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const res = await fetch('/api/payslips');
        const data = await res.json();
        if (data.success) {
          setPayslips(data.payslips);
        }
      } catch (err) {
        console.error('Error fetching payslips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, []);

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setDialogOpen(true);
  };

  const handleDownloadPDF = async (payslip: Payslip) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(0, 77, 152); // #004d98 (Logo Blue)
    doc.rect(0, 0, 210, 40, 'F');

    // Fetch and Draw logo
    try {
      const imgRes = await fetch('/logo.png');
      const imgBlob = await imgRes.blob();
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onloadend = () => {
          doc.addImage(reader.result as string, 'PNG', 14, 12, 60, 15);
          resolve(null);
        };
        reader.readAsDataURL(imgBlob);
      });
    } catch (e) {
      console.error("Could not add logo to PDF:", e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text('PAYSLIP', 180, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    // Company Info
    let currentY = 55;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Company: Ticket Visa Travel', 20, currentY);

    currentY += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Month: ${monthNames[payslip.month - 1]} ${payslip.year}`, 20, currentY);

    currentY += 7;
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, currentY);

    // Employee Details section
    currentY += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('EMPLOYEE DETAILS', 22, currentY + 6);

    currentY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (user) {
      doc.text(`Employee ID: ${user.employeeId}`, 20, currentY);
      doc.text(`Name: ${user.name}`, 110, currentY);
      currentY += 7;
      doc.text(`Department: ${user.department}`, 20, currentY);
      doc.text(`Designation: ${user.designation}`, 110, currentY);
    }

    // Earnings Section
    currentY += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('EARNINGS', 22, currentY + 6);

    currentY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('Basic Salary:', 20, currentY);
    doc.text(`Rs. ${payslip.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    currentY += 7;
    doc.text('Allowances:', 20, currentY);
    doc.text(`Rs. ${payslip.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text('Gross Earnings:', 20, currentY);
    doc.text(`Rs. ${(payslip.basicSalary + payslip.allowances).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    // Deductions Section
    currentY += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, currentY, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('DEDUCTIONS', 22, currentY + 6);

    currentY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('Total Deductions:', 20, currentY);
    doc.text(`Rs. ${payslip.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    // Net Salary Section
    currentY += 25;
    doc.setFillColor(0, 77, 152); // #004d98
    doc.rect(20, currentY, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('NET SALARY:', 25, currentY + 8);
    doc.text(`Rs. ${payslip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 185, currentY + 8, { align: 'right' });

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('This is a computer-generated payslip and does not require a signature.', 105, 280, { align: 'center' });

    doc.save(`Payslip_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`);
  };

  const totalEarnings = payslips.reduce((acc, p) => acc + p.basicSalary + p.allowances, 0);
  const totalDeductions = payslips.reduce((acc, p) => acc + p.deductions, 0);
  const totalNetSalary = payslips.reduce((acc, p) => acc + p.netSalary, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004d98]">Payslips</h1>
        <p className="text-gray-500">View and download your salary slips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deductions</p>
                <p className="text-2xl font-bold text-red-500">₹{totalDeductions.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Salary (Total)</p>
                <p className="text-2xl font-bold text-[#004d98]">₹{totalNetSalary.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#004d98]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#004d98]">Salary History</CardTitle>
          <CardDescription>Your monthly payslip records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#004d98]" />
            </div>
          ) : payslips.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-medium">{monthNames[payslip.month - 1]}</TableCell>
                      <TableCell>{payslip.year}</TableCell>
                      <TableCell>₹{payslip.basicSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">+₹{payslip.allowances.toLocaleString()}</TableCell>
                      <TableCell className="text-red-500">-₹{payslip.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₹{payslip.netSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(payslip)}
                            className="border-[#004d98] text-[#004d98] hover:bg-[#004d98] hover:text-white"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
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

      {/* Payslip Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#004d98]">Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="Ticket Visa Travel Logo" className="h-10 w-auto object-contain" />
              </div>
              <div className="text-center p-4 bg-[#004d98] text-white rounded-lg">
                <p className="text-sm opacity-80">{monthNames[selectedPayslip.month - 1]} {selectedPayslip.year}</p>
                <p className="text-3xl font-bold mt-1">₹{selectedPayslip.netSalary.toLocaleString()}</p>
                <p className="text-sm opacity-80">Net Salary</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Basic Salary</span>
                  <span className="font-medium">₹{selectedPayslip.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Allowances</span>
                  <span className="font-medium text-green-600">+₹{selectedPayslip.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Deductions</span>
                  <span className="font-medium text-red-500">-₹{selectedPayslip.deductions.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => handleDownloadPDF(selectedPayslip)}
                className="w-full bg-[#004d98] hover:bg-[#003466] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Payslip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
