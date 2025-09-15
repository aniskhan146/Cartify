import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Tags, LogOut, X, Bell, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/options', icon: ClipboardList, label: 'Product Options' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { href: '/admin/brands', icon: Tags, label: 'Brands' },
];

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-6">
        <Link to="/admin" className="text-2xl font-bold gradient-text">
          AYExpress
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white"
          aria-label="Close navigation menu"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname.startsWith(item.href) && (item.href !== '/admin' || location.pathname === '/admin')
                ? 'bg-purple-500/20 text-purple-200 font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 glass-effect border-r border-white/10 flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 glass-effect border-r border-white/10">
        {sidebarContent}
      </div>
    </>
  );
};

export default AdminSidebar;
