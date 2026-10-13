import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  useBodyScrollLock(mobileOpen);

  const { user, logout } = useAuth();

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/kyc', label: 'Dealer KYC Review', icon: ShieldCheck },
    { to: '/admin/inventory', label: 'FEFO Inventory', icon: Boxes },
    { to: '/admin/orders', label: 'Orders & Payments', icon: ShoppingBag },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 border-r border-zinc-800">
      
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-800">
        <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
          <Logo variant={collapsed ? 'icon' : 'compact'} size="sm" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-black text-sm text-emerald-400">Admin Portal</span>
              <span className="text-[10px] text-zinc-400">Kisan Hit</span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button (desktop) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`
              }
              title={collapsed ? link.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer & Store Quick-Switch */}
      <div className="p-3 border-t border-zinc-800 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40 transition-colors"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>View Farmer Store</span>}
        </Link>

        <div className="p-2.5 rounded-xl bg-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase">Super Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } flex-shrink-0 sticky top-0 h-screen z-30`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

