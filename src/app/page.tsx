'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/hr/LoginPage';
import DashboardPage from '@/components/hr/DashboardPage';
import ApplyLeavePage from '@/components/hr/ApplyLeavePage';
import PayslipsPage from '@/components/hr/PayslipsPage';
import ExpensesPage from '@/components/hr/ExpensesPage';
import AttendancePage from '@/components/hr/AttendancePage';
import AdminPage from '@/components/hr/AdminPage';
import HRLayout from '@/components/hr/HRLayout';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'apply-leave' | 'payslips' | 'expenses' | 'admin' | 'attendance';

export default function Home() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Sync state with browser history for back button support
  useEffect(() => {
    if (!user) {
      setCurrentPage('dashboard');
      return;
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Push to history when page changes manually
  const navigateTo = (page: Page) => {
    if (page === currentPage) return;

    // Add current view to history stack
    window.history.pushState({ page }, '', '');
    setCurrentPage(page);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#004d98] mx-auto mb-4" />
          <p className="text-gray-500">Loading Ticket Visa Travel...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Render the appropriate page based on current selection
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} />;
      case 'apply-leave':
        return <ApplyLeavePage />;
      case 'payslips':
        return <PayslipsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage onNavigate={navigateTo} />;
    }
  };

  return (
    <HRLayout currentPage={currentPage} onNavigate={navigateTo}>
      {renderPage()}
    </HRLayout>
  );
}
