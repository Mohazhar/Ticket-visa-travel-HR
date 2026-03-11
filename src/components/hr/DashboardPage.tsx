'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, DollarSign, Clock, TrendingUp, Building2, Mail, Award, Users, FileText, CheckCircle, Camera, Upload, X, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Progress } from '@/components/ui/progress';

interface Leave {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt: string;
  employee?: {
    name: string;
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
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage({ onNavigate }: { onNavigate: (page: 'dashboard' | 'apply-leave' | 'payslips' | 'expenses' | 'attendance' | 'admin') => void }) {
  const { user } = useAuth();
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [hrStats, setHrStats] = useState({ totalEmployees: 0, pendingLeaves: 0, totalPayslips: 0, approvedLeaves: 0 });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Photo uploading/camera state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set the photo if there's one stored in localStorage on load
  useEffect(() => {
    if (user?.id) {
      const savedPhoto = localStorage.getItem(`profile_photo_${user.id}`);
      if (savedPhoto) setProfilePhoto(savedPhoto);
    }
  }, [user]);

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setProfilePhoto(imageSrc);
      try {
        localStorage.setItem(`profile_photo_${user?.id}`, imageSrc);
      } catch (e) {
        console.warn('Storage quota exceeded, photo will not persist:', e);
      }
      setIsCameraOpen(false);
    }
  }, [webcamRef, user?.id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        try {
          localStorage.setItem(`profile_photo_${user?.id}`, base64String);
        } catch (e) {
          console.warn('Storage quota exceeded, uploading photo will not persist:', e);
          alert('Image is too large and exceeds local browser storage. It will not persist upon reload. Please use a smaller image under 3mb.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const fetchPromises = [
          fetch('/api/leaves'),
          fetch('/api/payslips'),
          fetch('/api/attendance?today=true')
        ];

        if (user.role === 'admin') {
          fetchPromises.push(fetch('/api/employees'));
        }

        const responses = await Promise.all(fetchPromises);
        const leavesData = await responses[0].json();
        const payslipsData = await responses[1].json();
        const attendanceData = await responses[2].json();

        if (attendanceData.success) {
          setTodayAttendance(attendanceData.attendance);
        }

        if (user.role === 'admin') {
          const empData = await responses[3].json();
          if (empData.success && leavesData.success && payslipsData.success) {
            setHrStats({
              totalEmployees: empData.employees.length,
              pendingLeaves: leavesData.leaves.filter((l: Leave) => l.status === 'pending').length,
              approvedLeaves: leavesData.leaves.filter((l: Leave) => l.status === 'approved').length,
              totalPayslips: payslipsData.payslips.length,
            });
            setRecentLeaves(leavesData.leaves.slice(0, 5)); // show latest 5 leaves for HR
            setRecentEmployees(empData.employees.slice(0, 5)); // show latest 5 employees
          }
        } else {
          if (leavesData.success) {
            setRecentLeaves(leavesData.leaves.slice(0, 3));
          }
          if (payslipsData.success && payslipsData.payslips.length > 0) {
            setLatestPayslip(payslipsData.payslips[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const res = await fetch('/api/attendance', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.attendance);
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
      }
    } catch (error) {
      console.error('Check out error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  if (!user) return null;

  // -----------------------------------------------------------------
  // HR / ADMIN DASHBOARD
  // -----------------------------------------------------------------
  if (user.role === 'admin') {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#ea580c]">HR Overview</h1>
          <p className="text-gray-500">Welcome to the management dashboard, {user.name}.</p>
        </div>

        {/* HR Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-[#ea580c]">{hrStats.totalEmployees}</p>
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
                  <p className="text-sm text-gray-500">Pending Leave Requests</p>
                  <p className="text-2xl font-bold text-orange-600">{hrStats.pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved Leaves</p>
                  <p className="text-2xl font-bold text-green-600">{hrStats.approvedLeaves}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Payslips Issued</p>
                  <p className="text-2xl font-bold text-[#ea580c]">{hrStats.totalPayslips}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leave Requests (System-wide) */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#ea580c]">Recent Company Leaves</CardTitle>
                <CardDescription>Latest leave applications from all employees</CardDescription>
              </div>
              <Button onClick={() => onNavigate('admin')} variant="outline" size="sm" className="hidden sm:flex">
                Manage Leaves
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ) : recentLeaves.length > 0 ? (
                <div className="space-y-4">
                  {recentLeaves.map((leave) => (
                    <div key={leave.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{leave.employee?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{leave.leaveType} Leave • {leave.fromDate} to {leave.toDate}</p>
                      </div>
                      <Badge className={getStatusColor(leave.status)}>{leave.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent leave requests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Panel: HR Quick Actions & Attendance */}
          <div className="flex flex-col gap-6">
            {/* HR Quick Actions Sidebar */}
            <Card className="border-0 shadow-md flex flex-col h-max">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-[#ea580c]">HR Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <Button
                  onClick={() => onNavigate('admin')}
                  className="w-full flex justify-start gap-3 bg-[#ea580c] hover:bg-[#c2410c] text-white"
                >
                  <Users className="w-5 h-5" />
                  Manage Employees
                </Button>
                <Button
                  onClick={() => onNavigate('admin')}
                  variant="outline"
                  className="w-full flex justify-start gap-3 border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c]/5"
                >
                  <FileText className="w-5 h-5" />
                  Review Leaves
                </Button>
                <Button
                  onClick={() => onNavigate('admin')}
                  variant="outline"
                  className="w-full flex justify-start gap-3 border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c]/5"
                >
                  <DollarSign className="w-5 h-5" />
                  Issue Payslips
                </Button>
              </CardContent>
            </Card>

            {/* HR Daily Attendance Card */}
            <Card className="border-0 shadow-md h-max">
              <CardHeader className="pb-3 border-b border-gray-100 mb-3">
                <CardTitle className="text-lg font-semibold text-[#ea580c]">My Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <Badge variant={todayAttendance ? (todayAttendance.checkOut ? "secondary" : "default") : "outline"} className={todayAttendance && !todayAttendance.checkOut ? "bg-green-500 hover:bg-green-600" : ""}>
                      {!todayAttendance ? 'Not Checked In' : (!todayAttendance.checkOut ? 'Currently Working' : 'Checked Out')}
                    </Badge>
                  </div>

                  {todayAttendance && (
                    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Time In</span>
                        <span className="text-sm font-medium text-gray-700">{new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {todayAttendance.checkOut && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Time Out</span>
                          <span className="text-sm font-medium text-gray-700">{new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-center text-xs text-gray-500 mb-2">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {!todayAttendance ? (
                    <Button onClick={handleCheckIn} className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white">
                      <LogIn className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  ) : !todayAttendance.checkOut ? (
                    <Button onClick={handleCheckOut} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                      <LogOut className="w-4 h-4 mr-2" />
                      Check Out
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Attendance Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Employee Directory Preview */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#ea580c]">Employee Directory Preview</CardTitle>
              <CardDescription>Recently added employees</CardDescription>
            </div>
            <Button onClick={() => onNavigate('admin')} variant="outline" size="sm" className="hidden sm:flex">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ) : recentEmployees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentEmployees.map((emp) => {
                  const savedPhoto = localStorage.getItem(`profile_photo_${emp.id}`);
                  return (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
                      <Avatar className="w-12 h-12 border border-gray-100">
                        {savedPhoto ? (
                          <img src={savedPhoto} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-[#ea580c] text-white">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#ea580c] truncate">{emp.name}</p>
                        <p className="text-xs text-gray-500 truncate">{emp.designation}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{emp.department}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No employees found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // EMPLOYEE DASHBOARD
  // -----------------------------------------------------------------
  const totalLeaveBalance = user.leaveBalance ? user.leaveBalance.annual + user.leaveBalance.sick + user.leaveBalance.personal : 0;
  const maxLeaveBalance = 30;
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Unique Employee Profile Banner */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${user.name}'s profile`} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-white text-[#ea580c] text-3xl font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Overlay for uploading changing photo */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 border-4 border-transparent">
                <button onClick={() => fileInputRef.current?.click()} className="text-white hover:text-orange-300 transition-colors p-1" title="Upload Photo">
                  <Upload className="w-5 h-5" />
                </button>
                <button onClick={() => setIsCameraOpen(true)} className="text-white hover:text-orange-300 transition-colors p-1" title="Take a Photo">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
              <p className="text-orange-100 mb-4">{user.designation}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-orange-50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-200" />
                  <span>{user.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-200" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-200" />
                  <span>ID: {user.employeeId}</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px h-20 bg-white/20 mx-4"></div>

            {/* Quick Balance Summary for right side of banner */}
            <div className="text-center sm:text-right w-full sm:w-auto mt-4 sm:mt-0 p-4 sm:p-0 bg-white/10 sm:bg-transparent rounded-xl">
              <p className="text-sm text-orange-100 mb-1">Total Leave Balance</p>
              <p className="text-4xl font-bold text-white mb-2">{totalLeaveBalance} <span className="text-base font-normal">days left</span></p>
              <Progress value={(totalLeaveBalance / maxLeaveBalance) * 100} className="h-2 bg-orange-900/50 [&>div]:bg-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leave Balances Details */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 border-b border-gray-100 mb-3">
            <CardTitle className="text-lg font-semibold text-[#ea580c]">Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">Annual</span>
              </div>
              <span className="text-xl font-bold text-[#ea580c]">{user.leaveBalance?.annual || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-md">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">Sick</span>
              </div>
              <span className="text-xl font-bold text-[#ea580c]">{user.leaveBalance?.sick || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">Personal</span>
              </div>
              <span className="text-xl font-bold text-[#ea580c]">{user.leaveBalance?.personal || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Latest Payslip Summary */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 border-b border-gray-100 mb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#ea580c]">Latest Payslip</CardTitle>
              <CardDescription>
                {latestPayslip ? `${monthNames[latestPayslip.month - 1]} ${latestPayslip.year}` : 'No payslip available'}
              </CardDescription>
            </div>
            <DollarSign className="w-5 h-5 text-[#ea580c]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ) : latestPayslip ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500">Month</span>
                  <span className="font-semibold text-gray-900">{monthNames[latestPayslip.month - 1]} {latestPayslip.year}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500">Gross</span>
                  <span className="text-gray-900 flex items-center">
                    <span className="text-xs mr-1 opacity-50">Rs.</span> {(latestPayslip.basicSalary + latestPayslip.allowances).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500">Net Salary</span>
                  <span className="font-bold text-[#ea580c] flex items-center">
                    <span className="text-xs mr-1 opacity-50">Rs.</span> {latestPayslip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button onClick={() => onNavigate('payslips')} variant="outline" className="w-full mt-2 text-[#ea580c] border-[#ea580c] hover:bg-orange-50">
                  View Full Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No payslips generated yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Attendance Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 border-b border-gray-100 mb-3">
            <CardTitle className="text-lg font-semibold text-[#ea580c]">Daily Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <Badge variant={todayAttendance ? (todayAttendance.checkOut ? "secondary" : "default") : "outline"} className={todayAttendance && !todayAttendance.checkOut ? "bg-green-500 hover:bg-green-600" : ""}>
                  {!todayAttendance ? 'Not Checked In' : (!todayAttendance.checkOut ? 'Currently Working' : 'Checked Out')}
                </Badge>
              </div>

              {todayAttendance && (
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Time In</span>
                    <span className="text-sm font-medium text-gray-700">{new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {todayAttendance.checkOut && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Time Out</span>
                      <span className="text-sm font-medium text-gray-700">{new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 text-center text-xs text-gray-500 mb-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              {!todayAttendance ? (
                <Button onClick={handleCheckIn} className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              ) : !todayAttendance.checkOut ? (
                <Button onClick={handleCheckOut} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              ) : (
                <Button disabled variant="outline" className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Attendance Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Leave Requests */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 border-b border-gray-100 mb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#ea580c]">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : recentLeaves.length > 0 ? (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm capitalize">{leave.leaveType} Leave</span>
                    <Badge className={getStatusColor(leave.status)}>{leave.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{leave.fromDate} to {leave.toDate}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions (Full width grid) */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-8 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button onClick={() => onNavigate('apply-leave')} variant="outline" className="h-auto py-6 flex-col gap-3 bg-white shadow-sm border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c] transition-all">
          <CalendarDays className="w-8 h-8 text-orange-500" />
          <span className="font-medium">Apply Leave</span>
        </Button>
        <Button onClick={() => onNavigate('attendance')} variant="outline" className="h-auto py-6 flex-col gap-3 bg-white shadow-sm border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c] transition-all">
          <Clock className="w-8 h-8 text-orange-500" />
          <span className="font-medium">My Attendance</span>
        </Button>
        <Button onClick={() => onNavigate('payslips')} variant="outline" className="h-auto py-6 flex-col gap-3 bg-white shadow-sm border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c] transition-all">
          <DollarSign className="w-8 h-8 text-green-500" />
          <span className="font-medium">View Payslips</span>
        </Button>
        <Button onClick={() => onNavigate('expenses')} variant="outline" className="h-auto py-6 flex-col gap-3 bg-white shadow-sm border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c] transition-all">
          <TrendingUp className="w-8 h-8 text-purple-500" />
          <span className="font-medium">Expenses</span>
        </Button>
      </div>

      {/* Camera Modal overlay */}
      {
        isCameraOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="max-w-md w-full border-0 shadow-2xl bg-white overflow-hidden">
              <CardHeader className="bg-[#ea580c] text-white flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-bold">Take Profile Photo</CardTitle>
                  <CardDescription className="text-orange-200">Please align your face in the camera frame</CardDescription>
                </div>
                <button onClick={() => setIsCameraOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </CardHeader>
              <div className="relative bg-black h-80 w-full flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 bg-gray-50 flex justify-center gap-4">
                <Button onClick={() => setIsCameraOpen(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={capturePhoto} className="flex-1 bg-[#ea580c] hover:bg-[#c2410c] text-white">Capture Photo</Button>
              </div>
            </Card>
          </div>
        )
      }
    </div >
  );
}
