import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster.jsx';
import { CartProvider } from './hooks/useCart.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import StorePage from './pages/StorePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Navbar from './components/Navbar.jsx';
import ShoppingCart from './components/ShoppingCart.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import { isSupabaseConfigured } from './lib/supabase.js';

const MissingEnvBanner = () => (
    <div className="bg-red-800 text-white p-3 text-center fixed top-0 left-0 right-0 z-[2000] shadow-lg">
        <p className="font-bold">Configuration Error: Supabase Keys Missing</p>
        <p className="text-sm">The application cannot connect to the database. Please add <strong>VITE_SUPABASE_DATABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment secrets.</p>
    </div>
);


function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        {!isSupabaseConfigured && <MissingEnvBanner />}
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
            <Navbar setIsCartOpen={setIsCartOpen} />
            <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;