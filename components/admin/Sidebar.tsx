import React from 'react';
import { LayoutDashboardIcon, PackageIcon, ListOrderedIcon, UsersIcon, BarChart3Icon, SettingsIcon, ShoppingCartIcon, BotIcon, ClipboardIcon } from '../shared/icons';

type AdminPage = 'dashboard' | 'products' | 'categories' | 'variant-options' | 'orders' | 'users' | 'analytics' | 'storefront-settings' | 'ai-assistant' | 'settings';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: AdminPage) => void;
  onSwitchToUser: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onSwitchToUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'categories', label: 'Categories', icon: ListOrderedIcon },
    { id: 'variant-options', label: 'Variant Options', icon: ClipboardIcon },
    { id: 'products', label: 'Products', icon: PackageIcon },
    { id: 'storefront-settings', label: 'Storefront', icon: ShoppingCartIcon },
    { id: 'orders', label: 'Orders', icon: ListOrderedIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3Icon },
    { id: 'ai-assistant', label: 'AI Assistant', icon: BotIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const NavLink: React.FC<{item: typeof navItems[0]}> = ({ item }) => {
    const isActive = activePage === item.id;
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setActivePage(item.id as AdminPage);
            }}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
        >
            <item.icon className="h-5 w-5 mr-3" />
            <span className="font-medium text-sm">{item.label}</span>
        </a>
    );
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-muted/40 border-r border-border hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">AYExpress</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => <NavLink key={item.id} item={item} />)}
      </nav>
      <div className="px-4 py-6 border-t border-border">
         <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onSwitchToUser();
            }}
            className="flex items-center px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            <span className="font-medium text-sm">View Storefront</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;