import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import DashboardHome from './DashboardHome';
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';
import OrderManagement from './OrderManagement';
import UserManagement from './UserManagement';
import Settings from './Settings';
import AnalyticsPage from './AnalyticsPage';
import AiAssistantPage from './AiAssistantPage';
import StorefrontSettings from './StorefrontSettings';
import { useAuth } from '../../contexts/AuthContext';
import { onProductsValueChange, saveProduct, onAllOrdersValueChange, onAllUsersAndRolesValueChange } from '../../services/databaseService';
import type { Product, Order, UserRoleInfo, Notification } from '../../types';
import { formatCurrency } from '../shared/utils';

type AdminPage = 'dashboard' | 'products' | 'categories' | 'storefront-settings' | 'orders' | 'users' | 'analytics' | 'ai-assistant' | 'settings';

interface AdminDashboardProps {
  onSwitchToUser: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToUser }) => {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const { logout } = useAuth();
  
  // State for products and filtering lifted to the parent dashboard
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // State for Product Form Modal (lifted from ProductManagement)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState('');

  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevData = useRef<{ users: UserRoleInfo[], orders: (Order & {userId: string})[], products: Product[] }>({ users: [], orders: [], products: [] });
  const isInitialized = useRef({ users: false, orders: false, products: false });
  const notifiedLowStockProducts = useRef<Set<string>>(new Set());

  // Combined product listener for both product list and low-stock notifications
  useEffect(() => {
    const unsubscribe = onProductsValueChange((products) => {
        setAllProducts(products); // Update product list for the management page

        if (!isInitialized.current.products) {
            products.forEach(p => {
                // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                if (totalStock <= 10) notifiedLowStockProducts.current.add(p.id);
            });
            isInitialized.current.products = true;
            return;
        }

        products.forEach(product => {
            // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            if (totalStock <= 10 && !notifiedLowStockProducts.current.has(product.id)) {
                const newNotif: Notification = {
                    id: `${Date.now()}-stock-${product.id}`,
                    type: 'low-stock',
                    // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
                    message: `"${product.name}" has only ${totalStock} items left.`,
                    timestamp: Date.now(),
                    read: false,
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep last 20
                notifiedLowStockProducts.current.add(product.id);
            // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
            } else if (totalStock > 10 && notifiedLowStockProducts.current.has(product.id)) {
                notifiedLowStockProducts.current.delete(product.id);
            }
        });
    });
    return () => unsubscribe();
  }, []);

  // New Users Listener
  useEffect(() => {
      const unsubscribe = onAllUsersAndRolesValueChange((users) => {
          if (!isInitialized.current.users) {
              prevData.current.users = users;
              isInitialized.current.users = true;
              return;
          }

          if (users.length > prevData.current.users.length) {
              const newUsers = users.filter(u => !prevData.current.users.some(pu => pu.uid === u.uid));
              newUsers.forEach(user => {
                  const newNotif: Notification = {
                      id: `${Date.now()}-user-${user.uid}`,
                      type: 'new-user',
                      message: `New user signed up: ${user.email}`,
                      timestamp: Date.now(),
                      read: false,
                  };
                  setNotifications(prev => [newNotif, ...prev].slice(0, 20));
              });
          }
          prevData.current.users = users;
      });
      return () => unsubscribe();
  }, []);

  // New Orders Listener
  useEffect(() => {
      const unsubscribe = onAllOrdersValueChange((orders) => {
          if (!isInitialized.current.orders) {
              prevData.current.orders = orders;
              isInitialized.current.orders = true;
              return;
          }
          
          if (orders.length > prevData.current.orders.length) {
              const newOrders = orders.filter(o => !prevData.current.orders.some(po => po.id === o.id));
              newOrders.forEach(order => {
                  const newNotif: Notification = {
                      id: `${Date.now()}-order-${order.id}`,
                      type: 'new-order',
                      message: `New order #${order.id.substring(0, 6)} placed for ${formatCurrency(order.total)}.`,
                      timestamp: Date.now(),
                      read: false,
                  };
                   setNotifications(prev => [newNotif, ...prev].slice(0, 20));
              });
          }
          prevData.current.orders = orders;
      });
      return () => unsubscribe();
  }, []);

  useEffect(() => {
    // When switching away from the products page, reset all filters
    if (activePage !== 'products') {
      setSearchQuery('');
      setStatusFilter('all');
      setCategoryFilter(null);
    }
  }, [activePage]);
  
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        const matchesStatus = 
            statusFilter === 'all' ||
            // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
            (statusFilter === 'inStock' && totalStock > 0) ||
            // FIX: Property 'stock' does not exist on type 'Product'. Use total stock from variants.
            (statusFilter === 'outOfStock' && totalStock === 0);
        
        const matchesSearch = 
            !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [allProducts, searchQuery, statusFilter, categoryFilter]);

  const handleViewCategoryProducts = (categoryName: string) => {
    setCategoryFilter(categoryName);
    setActivePage('products');
  };

  // Handlers for Product Form Modal
  const openFormModal = (
      mode: 'add' | 'edit',
      product: Product | null = null,
      prefillData: Partial<Product> = {}
  ) => {
      setModalMode(mode);
      const initialData = mode === 'edit' && product ? product : null;
      // The `id` is crucial. If prefillData doesn't have an id, and initialData is null, it should be an empty string for a new product.
      const combinedId = initialData?.id || prefillData.id || '';
      const combinedData = { ...initialData, ...prefillData, id: combinedId };
      setCurrentProduct(combinedData as Product); // Cast as Product, acknowledging it might be partial initially
      setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
      setIsFormModalOpen(false);
      setCurrentProduct(null);
      setFormError('');
  };

  const handleFormSubmit = async (formData: Omit<Product, 'id'>, productId?: string) => {
      setFormError('');
      try {
          await saveProduct(formData, productId);
          closeFormModal();
          return true;
      } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Failed to save product.');
          return false;
      }
  };


  const handleLogout = async () => {
    try {
      await logout();
      onSwitchToUser(); // Switch to user view after logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  const handleMarkNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'products':
        return <ProductManagement 
            products={filteredProducts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onClearCategoryFilter={() => setCategoryFilter(null)}
            // Modal Props
            isFormModalOpen={isFormModalOpen}
            modalMode={modalMode}
            currentProduct={currentProduct}
            formError={formError}
            openFormModal={openFormModal}
            closeFormModal={closeFormModal}
            onFormSubmit={handleFormSubmit}
        />;
      case 'categories':
        return <CategoryManagement onViewCategoryProducts={handleViewCategoryProducts} />;
      case 'storefront-settings':
        return <StorefrontSettings />;
      case 'orders':
        return <OrderManagement />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'ai-assistant':
        return <AiAssistantPage 
                  viewContext={{ products: filteredProducts }}
                  openProductModal={openFormModal}
               />;
      case 'settings':
        return <Settings />;
      default:
        return <div className="p-8"><h1 className="text-2xl font-bold">Coming Soon</h1><p>This page is under construction.</p></div>;
    }
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onSwitchToUser={onSwitchToUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
            onSwitchToUser={onSwitchToUser} 
            onLogout={handleLogout} 
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationsAsRead}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/40 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
