import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { LanguageToggle } from '../components/common/LanguageToggle';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/kyc')) return 'Dealer KYC Review';
    if (path.includes('/admin/inventory')) return 'FEFO Inventory & Batches';
    if (path.includes('/admin/orders')) return 'Order Operations & COD';
    return 'Super Admin Dashboard';
  };

  return (
    <div className="min-h-screen flex bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
      {/* Admin Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs / Page Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>Kisan Hit Admin</span>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {getPageTitle()}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Infrastructure indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL & Redis Healthy</span>
            </div>

            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="View Customer Storefront"
            >
              <span>View Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <ThemeToggle />
            <LanguageToggle />

            {/* User Profile & Logout */}
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                  {user?.fullName || 'Super Admin'}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
