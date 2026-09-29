import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import LoginModal from './components/LoginModal';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import MDDashboard from './dashboards/MDDashboard';
import GMDashboard from './dashboards/GMDashboard';
import ExecutiveDashboard from './dashboards/ExecutiveDashboard';
import SupervisorDashboard from './dashboards/SupervisorDashboard';

import HierarchyManager from './modules/HierarchyManager';
import UserManagement from './modules/UserManagement';
import WorkerManagement from './modules/WorkerManagement';
import AttendanceModule from './modules/AttendanceModule';
import DailyWorkLogModule from './modules/DailyWorkLogModule';
import IssuesModule from './modules/IssuesModule';
import DailyReportsModule from './modules/DailyReportsModule';
import BillsInvoicesModule from './modules/BillsInvoicesModule';
import AuditLogViewer from './modules/AuditLogViewer';
import SystemConfigModule from './modules/SystemConfigModule';

function MainLayout() {
  const { user, role, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2545] flex items-center justify-center text-white text-sm font-semibold">
        Restoring secure institutional session...
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'overview':
        if (role === 'SUPER_ADMIN') return <SuperAdminDashboard setActiveTab={setActiveTab} />;
        if (role === 'MD') return <MDDashboard setActiveTab={setActiveTab} />;
        if (role === 'GM') return <GMDashboard setActiveTab={setActiveTab} />;
        if (role === 'EXECUTIVE') return <ExecutiveDashboard setActiveTab={setActiveTab} />;
        if (role === 'SUPERVISOR') return <SupervisorDashboard setActiveTab={setActiveTab} />;
        return <SupervisorDashboard setActiveTab={setActiveTab} />;

      case 'hierarchy':
        return <HierarchyManager />;

      case 'users':
        return <UserManagement />;

      case 'workers':
        return <WorkerManagement />;

      case 'attendance':
        return <AttendanceModule />;

      case 'work_logs':
        return <DailyWorkLogModule />;

      case 'issues':
        return <IssuesModule />;

      case 'daily_reports':
        return <DailyReportsModule />;

      case 'bills':
        return <BillsInvoicesModule />;

      case 'audit_logs':
        return <AuditLogViewer />;

      case 'config':
        return <SystemConfigModule />;

      default:
        return <SuperAdminDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 md:ml-64 transition-all overflow-x-hidden">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
