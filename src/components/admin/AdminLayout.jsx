import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button.jsx';

const AdminLayout = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      navigate('/login');
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className="flex-1 lg:pl-64 transition-all duration-300">
        <div className="lg:hidden p-4 flex items-center justify-between glass-effect border-b border-white/10">
          <div className="text-xl font-bold gradient-text">AYExpress Admin</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;