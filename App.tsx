import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import UserPanel from './components/user/UserPanel';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import AuthModal from './components/auth/AuthModal';
import { seedDatabaseIfNeeded } from './services/seedService';
import NotificationContainer from './components/shared/NotificationContainer';

type View = 'user' | 'adminLogin' | 'adminDashboard';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('user');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    seedDatabaseIfNeeded();
  }, []); // Runs once on initial app load

  const renderContent = () => {
    switch (view) {
      case 'adminLogin':
        return <AdminLogin onLoginSuccess={() => setView('adminDashboard')} onSwitchToUser={() => setView('user')} />;
      case 'adminDashboard':
        return <AdminDashboard onSwitchToUser={() => setView('user')} />;
      case 'user':
      default:
        return (
          <UserPanel
            onSwitchToAdminLogin={() => setView('adminLogin')}
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
        );
    }
  };

  return (
    <>
      {renderContent()}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
              <NotificationContainer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;