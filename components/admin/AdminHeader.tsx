import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, ChevronDownIcon, ShoppingCartIcon, LogOutIcon, PackageIcon, UsersIcon, AlertTriangleIcon } from '../shared/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';


interface AdminHeaderProps {
  onSwitchToUser: () => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onSwitchToUser, onLogout, notifications, onMarkAsRead }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    action();
    setIsDropdownOpen(false);
  };

  const handleBellClick = () => {
    setIsNotificationPanelOpen(prev => !prev);
    if (unreadCount > 0) {
        onMarkAsRead();
    }
  };

  const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'new-order': return <PackageIcon className="h-5 w-5 text-blue-400" />;
        case 'new-user': return <UsersIcon className="h-5 w-5 text-green-400" />;
        case 'low-stock': return <AlertTriangleIcon className="h-5 w-5 text-yellow-400" />;
        default: return <BellIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center">
        {/* Mobile sidebar toggle would go here */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-muted pl-10 pr-4 py-2 rounded-lg text-sm w-56 focus:ring-2 focus:ring-ring focus:outline-none border border-transparent focus:border-input"
          />
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <div className="relative" ref={notificationRef}>
            <button onClick={handleBellClick} className="relative text-muted-foreground hover:text-foreground">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount}
                </span>
              )}
            </button>
            {isNotificationPanelOpen && (
                 <div className="absolute right-0 mt-3 w-80 bg-card rounded-lg shadow-lg z-50 ring-1 ring-border text-sm">
                    <div className="p-3 font-semibold border-b border-border text-foreground">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className="flex items-start gap-3 p-3 border-b border-border last:border-b-0 hover:bg-accent">
                                    <div className="flex-shrink-0 mt-1">
                                      <NotificationIcon type={notif.type} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-foreground">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-muted-foreground">No new notifications.</p>
                        )}
                    </div>
                 </div>
            )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 p-1 rounded-md hover:bg-accent">
              <img 
                  src={`https://picsum.photos/seed/${currentUser?.email || 'admin'}/40/40`} 
                  alt="Admin avatar"
                  className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                  <p className="font-semibold text-sm text-foreground text-left">{currentUser?.displayName || 'Administrator'}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email || 'admin@cartify.com'}</p>
              </div>
              <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg py-1 z-50 ring-1 ring-border">
              <a 
                href="#" 
                onClick={handleMenuAction(onSwitchToUser)} 
                className="flex items-center w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                View Storefront
              </a>
              <a 
                href="#" 
                onClick={handleMenuAction(onLogout)} 
                className="flex items-center w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;