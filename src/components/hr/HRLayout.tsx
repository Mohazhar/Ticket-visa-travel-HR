'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CalendarDays,
  DollarSign,
  Receipt,
  Users,
  Menu,
  LogOut,
  X,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

type Page = 'dashboard' | 'apply-leave' | 'payslips' | 'expenses' | 'admin' | 'attendance';

interface HRLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'apply-leave' as Page, label: 'Apply Leave', icon: CalendarDays },
  { id: 'payslips' as Page, label: 'Payslips', icon: DollarSign },
  { id: 'expenses' as Page, label: 'Expenses', icon: Receipt },
  { id: 'attendance' as Page, label: 'Attendance', icon: Clock },
];

const adminNavItems = [
  { id: 'admin' as Page, label: 'Admin Panel', icon: Users },
];

interface NavContentProps {
  currentPage: Page;
  userRole: string | undefined;
  userName: string | undefined;
  userDesignation: string | undefined;
  userId: string | undefined;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

function NavContent({ currentPage, userRole, userName, userDesignation, userId, onNavigate, onLogout }: NavContentProps) {
  const [navProfilePhoto, setNavProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const savedPhoto = localStorage.getItem(`profile_photo_${userId}`);
      if (savedPhoto) setNavProfilePhoto(savedPhoto);
    }
  }, [userId]);
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[#004d98]/20">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="Ticket Visa Travel Logo" className="h-10 w-auto object-contain" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${currentPage === item.id
              ? 'bg-[#004d98] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {userRole === 'admin' && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-6">Admin</p>
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${currentPage === item.id
                  ? 'bg-[#004d98] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gray-50">
          <Avatar className="w-9 h-9 bg-[#004d98]">
            {navProfilePhoto ? (
              <img src={navProfilePhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="bg-[#004d98] text-white text-sm">
                {userName?.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userDesignation}</p>
          </div>
          <NotificationsDropdown onNavigate={onNavigate} />
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full text-gray-600 hover:text-red-600 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function HRLayout({ children, currentPage, onNavigate }: HRLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          {currentPage !== 'dashboard' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#004d98] mr-1"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <img src="/logo.png" alt="Ticket Visa Travel Logo" className="h-8 w-auto object-contain" />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <NavContent
              currentPage={currentPage}
              userRole={user?.role}
              userName={user?.name}
              userDesignation={user?.designation}
              userId={user?.id}
              onNavigate={handleNavigate}
              onLogout={logout}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:block">
        <div className="h-full bg-white border-r border-gray-200">
          <NavContent
            currentPage={currentPage}
            userRole={user?.role}
            userName={user?.name}
            userDesignation={user?.designation}
            userId={user?.id}
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0">
        <div className="min-h-screen">
          {currentPage !== 'dashboard' && (
            <div className="hidden lg:flex p-4 border-b border-gray-200 bg-white sticky top-0 z-30 items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-[#004d98] flex items-center gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </Button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
