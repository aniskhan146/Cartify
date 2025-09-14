import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import { Menu, Bell, CheckCircle, User, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.jsx"

const getIconForType = (type) => {
    switch (type) {
        case 'Orders': return <ShoppingCart className="h-5 w-5 text-green-400 flex-shrink-0" />;
        case 'Customers': return <User className="h-5 w-5 text-blue-400 flex-shrink-0" />;
        case 'Errors': return <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />;
        default: return <CheckCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />;
    }
};

const AdminHeader = ({ setSidebarOpen }) => {
    const { user } = useAuth();
    const { notifications, unreadCount, markAllAsRead } = useAdminNotification();

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between lg:justify-end gap-4 border-b border-white/10 bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white"
                aria-label="Open navigation menu"
            >
                <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-white/80 hover:text-white">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 md:w-96">
                        <DropdownMenuLabel className="flex justify-between items-center">
                        <span>Admin Notifications</span>
                        {notifications.length > 0 && (
                            <Button variant="link" className="p-0 h-auto text-xs text-purple-300" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
                            Mark all as read
                            </Button>
                        )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                            <DropdownMenuItem disabled className="text-center justify-center text-white/70">
                            No new notifications
                            </DropdownMenuItem>
                        ) : (
                            notifications.map(n => (
                            <DropdownMenuItem key={n.id} asChild>
                                <Link to="/admin/notifications" className={`flex items-start gap-3 w-full cursor-pointer focus:bg-white/10 ${!n.read ? 'bg-white/5' : ''}`}>
                                {getIconForType(n.category)}
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold text-sm text-white truncate">{n.title}</p>
                                    <p className="text-xs text-white/70 line-clamp-2">{n.message}</p>
                                </div>
                                </Link>
                            </DropdownMenuItem>
                            ))
                        )}
                        </div>
                        {notifications.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                            <Link to="/admin/notifications" className="w-full flex justify-center text-purple-300 font-semibold cursor-pointer hover:!text-purple-200">
                                View All Notifications
                            </Link>
                            </DropdownMenuItem>
                        </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-right">
                    <p className="text-sm font-medium text-white">{user?.user_metadata?.full_name || user?.email}</p>
                    <p className="text-xs text-purple-300 capitalize">{user?.role}</p>
                </div>
            </div>
        </header>
    );
};


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
      
      <div className="flex flex-col flex-1 lg:pl-64 transition-all duration-300">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;