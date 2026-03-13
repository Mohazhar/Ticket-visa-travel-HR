'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Receipt, Plus, Edit, Trash2, Loader2, TrendingUp, TrendingDown, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  employee?: {
    name: string;
    employeeId: string;
  };
}

const categories = ['Office Supplies', 'Travel', 'Software', 'Marketing', 'Equipment', 'Training', 'Utilities', 'Other'];
const paymentMethods = ['Company Card', 'Cash', 'Reimbursement', 'Purchase Order', 'Bank Transfer'];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    date: '',
    category: '',
    description: '',
    amount: '',
    paymentMethod: '',
  });

  const isAdmin = user?.role === 'admin';

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const resetForm = () => {
    setFormData({
      date: '',
      category: '',
      description: '',
      amount: '',
      paymentMethod: '',
    });
    setEditingExpense(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
    });
    setDialogOpen(true);
  };

  const handleOpenView = (expense: Expense) => {
    setViewingExpense(expense);
    setViewDialogOpen(true);
  };

  const downloadExpensePdf = async () => {
    if (!viewingExpense) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header styling
    doc.setFillColor(0, 77, 152); // #004d98 (Logo Blue)
    doc.rect(0, 0, 210, 40, 'F');

    // Fetch logo
    try {
      const imgRes = await fetch('/logo.png');
      const imgBlob = await imgRes.blob();
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onloadend = () => {
          doc.addImage(reader.result as string, 'PNG', pageWidth - 70, 12, 60, 15);
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
    doc.text('Expense Document', 20, 25);

    // Reset colors for body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Details
    let currentY = 55;

    doc.setFont("helvetica", "bold");
    doc.text('Date:', 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(viewingExpense.date, 60, currentY);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text('Category:', 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(viewingExpense.category, 60, currentY);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text('Amount:', 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`$${viewingExpense.amount.toLocaleString()}`, 60, currentY);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text('Payment Method:', 20, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(viewingExpense.paymentMethod, 65, currentY);

    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.text('Description:', 20, currentY);
    doc.setFont("helvetica", "normal");
    // Handle description wrap
    const splitDesc = doc.splitTextToSize(viewingExpense.description, 170);
    doc.text(splitDesc, 20, currentY + 7);

    currentY += 10 + (splitDesc.length * 7);

    // Draw a line
    currentY += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY, 190, currentY);
    currentY += 15;

    if (viewingExpense.employee) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Employee Information', 20, currentY);
      doc.setFontSize(12);

      currentY += 10;
      doc.setFont("helvetica", "bold");
      doc.text('Name:', 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(viewingExpense.employee.name, 60, currentY);

      currentY += 10;
      doc.setFont("helvetica", "bold");
      doc.text('Employee ID:', 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(viewingExpense.employee.employeeId, 60, currentY);
    }

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Expense ID: ${viewingExpense.id}`, 20, 280);
    doc.text(`Generated exactly: ${new Date().toLocaleString()}`, 20, 285);

    doc.save(`Expense_${viewingExpense.category}_${viewingExpense.date}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          fetchExpenses();
          setDialogOpen(false);
          resetForm();
        }
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          fetchExpenses();
          setDialogOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error saving expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;

    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchExpenses();
        setDeleteDialogOpen(false);
        setDeletingExpense(null);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const downloadAllExpensesCSV = () => {
    if (filteredExpenses.length === 0) return;

    // Build standard CSV header row
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Added By (Employee ID)'];

    // Convert filtered expenses
    const rows = filteredExpenses.map(expense => [
      expense.date,
      `"${expense.category}"`,
      `"${expense.description.replace(/"/g, '""')}"`, // escape quotes natively
      expense.amount,
      `"${expense.paymentMethod}"`,
      `"${expense.employee?.name || 'N/A'} (${expense.employee?.employeeId || 'N/A'})"`
    ]);

    // Calculate Summaries for CSV
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const catTotals: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      catTotals[exp.category] = (catTotals[exp.category] || 0) + exp.amount;
    });

    const summaryRows = [
      [], // Empty row
      ['SUMMARY'],
      ['Total Expenses', totalAmount.toFixed(2)],
      [],
      ['Category-wise Breakdown'],
      ['Category', 'Total Amount']
    ];

    Object.entries(catTotals).forEach(([cat, amt]) => {
      summaryRows.push([cat, amt.toFixed(2)]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...summaryRows.map(row => row.join(','))
    ].join('\n');

    // Safely encode and trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    const categoryName = categoryFilter === 'all' ? 'All' : categoryFilter.replace(/\s+/g, '_');
    link.setAttribute('download', `ticket_visa_travel_expenses_${categoryName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate monthly summary
  const monthlySummary = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categorySummary = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const filteredExpenses = categoryFilter === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === categoryFilter);

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#004d98]">Expenses</h1>
          <p className="text-gray-500">Manage company expenses and track spending</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          <Button onClick={downloadAllExpensesCSV} variant="outline" className="border-[#004d98] text-[#004d98] hover:bg-[#004d98] hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleOpenAdd} className="bg-[#004d98] hover:bg-[#003466] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-[#004d98]">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-[#004d98]">{filteredExpenses.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[#004d98]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md col-span-1 sm:col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-2">Top Categories</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categorySummary)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([category, amount]) => (
                  <Badge key={category} variant="secondary" className="text-sm">
                    {category}: ₹{amount.toLocaleString()}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#004d98]">Monthly Summary</CardTitle>
          <CardDescription>Expense breakdown by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(monthlySummary)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([month, amount]) => {
                const [year, monthNum] = month.split('-');
                return (
                  <div key={month} className="p-3 rounded-lg bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">{monthNames[parseInt(monthNum) - 1]} {year}</p>
                    <p className="font-bold text-[#004d98]">₹{amount.toLocaleString()}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold text-[#004d98]">Expense Records</CardTitle>
            <CardDescription>All company expense records</CardDescription>
          </div>
          <div className="w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-[#004d98] text-[#004d98]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#004d98]" />
            </div>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell className="font-bold">₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      <TableCell>{expense.employee?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 text-[#004d98] border-blue-200"
                            onClick={() => handleOpenView(expense)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(expense)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                onClick={() => {
                                  setDeletingExpense(expense);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No expenses found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#004d98]">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details' : 'Enter the details for the new expense'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#004d98] hover:bg-[#003466] text-white">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingExpense ? 'Update' : 'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Ticket Visa Travel Logo" className="h-10 w-auto object-contain" />
            </div>
            <DialogTitle className="text-[#004d98] flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Expense Details
            </DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Date</p>
                  <p className="font-semibold text-gray-900">{viewingExpense.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Category</p>
                  <p className="font-semibold text-gray-900">{viewingExpense.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Payment Method</p>
                  <p className="font-semibold text-gray-900">{viewingExpense.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Amount</p>
                  <p className="font-semibold text-[#004d98] text-lg">₹{viewingExpense.amount.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Description</p>
                <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">{viewingExpense.description}</p>
              </div>

              {viewingExpense.employee && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-2">Employee Details</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900">{viewingExpense.employee.name}</span>
                    <Badge variant="outline">{viewingExpense.employee.employeeId}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-6 flex sm:justify-between items-center">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={downloadExpensePdf} className="bg-[#004d98] hover:bg-[#003466] text-white">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
