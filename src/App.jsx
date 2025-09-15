import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster.jsx';
import { CartProvider } from './hooks/useCart.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { WishlistProvider } from './hooks/useWishlist.jsx';
import { NotificationProvider } from './hooks/useNotification.jsx';
import { AdminNotificationProvider } from './hooks/useAdminNotification.jsx'; // Import the new provider
import Navbar from './components/Navbar.jsx';
import ShoppingCart from './components/ShoppingCart.jsx';
import { isSupabaseConfigured } from './lib/supabase.js';

const MissingEnvBanner = () => (
    <div className="bg-red-800 text-white p-3 text-center fixed top-0 left-0 right-0 z-[2000] shadow-lg">
        <p className="font-bold">Configuration Error: Supabase Keys Missing</p>
        <p className="text-sm">The application cannot connect to the database. Please add <strong>VITE_SUPABASE_DATABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment secrets.</p>
    </div>
);

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
    </div>
);

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const StorePage = lazy(() => import('./pages/StorePage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage.jsx'));
const NotificationPage = lazy(() => import('./pages/NotificationPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminOrderDetailsPage = lazy(() => import('./pages/admin/AdminOrderDetailsPage.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands.jsx'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications.jsx'));


function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <AuthProvider>
      <NotificationProvider>
        <AdminNotificationProvider>
          <CartProvider>
            <WishlistProvider>
              {!isSupabaseConfigured && <MissingEnvBanner />}
              <Router>
                <div className="min-h-screen bg-background text-foreground">
                  <Navbar setIsCartOpen={setIsCartOpen} />
                  <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
                  <main className="pt-16">
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/store" element={<StorePage />} />
                        <Route path="/product/:id" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/success" element={<SuccessPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/orders" element={<OrderHistoryPage />} />
                        <Route path="/order/:id" element={<OrderDetailsPage />} />
                        <Route path="/notifications" element={<NotificationPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/order/:id" element={<AdminOrderDetailsPage />} />
                        <Route path="/admin/customers" element={<AdminCustomers />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/brands" element={<AdminBrands />} />
                        <Route path="/admin/notifications" element={<AdminNotifications />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <Toaster />
                </div>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AdminNotificationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;