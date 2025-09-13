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
import VariantOptionManagement from './VariantOptionManagement';
import BrandManagement from './BrandManagement';
import { useAuth } from '../../contexts/AuthContext';
import { onProductsValueChange, saveProduct, onAllOrdersValueChange, onAllUsersAndRolesValueChange, onCategoriesValueChange, onBrandsChange } from '../../services/databaseService';
import type { Product, Order, UserRoleInfo, Notification, Category, Brand } from '../../types';
import { formatCurrency } from '../shared/utils';

type AdminPage = 'dashboard' | 'products' | 'categories' | 'variant-options' | 'brands' | 'storefront-settings' | 'orders' | 'users' | 'analytics' | 'ai-assistant' | 'settings';

interface AdminDashboardProps {
  onSwitchToUser: () => void;
}

// Helper to get all sub-category IDs for filtering
const getAllSubCategoryIds = (categoryId: string, categories: Category[]): string[] => {
    let ids: string[] = [categoryId];
    const directSubcategories = categories.filter(c => c.parentId === categoryId);
    directSubcategories.forEach(sub => {
        ids = [...ids, ...getAllSubCategoryIds(sub.id, categories)];
    });
    return ids;
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToUser }) => {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const { logout } = useAuth();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState('');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevData = useRef<{ users: UserRoleInfo[], orders: (Order & {userId: string})[], products: Product[] }>({ users: [], orders: [], products: [] });
  const isInitialized = useRef({ users: false, orders: false, products: false });
  const notifiedLowStockProducts = useRef<Set<string>>(new Set());
  
  useEffect(() => {
      const unsubCategories = onCategoriesValueChange(setAllCategories);
      const unsubBrands = onBrandsChange(setAllBrands);
      return () => {
        unsubCategories();
        unsubBrands();
      }
  }, []);

  useEffect(() => {
    const unsubscribe = onProductsValueChange((products) => {
        setAllProducts(products);

        if (!isInitialized.current.products) {
            products.forEach(p => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                if (totalStock <= 10) notifiedLowStockProducts.current.add(p.id);
            });
            isInitialized.current.products = true;
            return;
        }

        products.forEach(product => {
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            if (totalStock <= 10 && !notifiedLowStockProducts.current.has(product.id)) {
                const newNotif: Notification = {
                    id: `${Date.now()}-stock-${product.id}`,
                    type: 'low-stock',
                    message: `"${product.name}" has only ${totalStock} items left.`,
                    timestamp: Date.now(),
                    read: false,
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                notifiedLowStockProducts.current.add(product.id);
            } else if (totalStock > 10 && notifiedLowStockProducts.current.has(product.id)) {
                notifiedLowStockProducts.current.delete(product.id);
            }
        });
    });
    return () => unsubscribe();
  }, []);

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
    if (activePage !== 'products') {
      setSearchQuery('');
      setStatusFilter('all');
      setCategoryFilter(null);
    }
  }, [activePage]);
  
  const filteredProducts = useMemo(() => {
    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    return allProducts.filter(product => {
        // Since categoryFilter is a name string, we proceed with name-based filtering.
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'inStock' && totalStock > 0) ||
            (statusFilter === 'outOfStock' && totalStock === 0);
        
        const productCategoryName = product.category.toLowerCase() || '';
        const matchesSearch = 
            !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            productCategoryName.includes(searchQuery.toLowerCase());
            
        return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [allProducts, searchQuery, statusFilter, categoryFilter, allCategories]);

  const handleViewCategoryProducts = (categoryName: string) => {
    const category = allCategories.find(c => c.name === categoryName);
    if(category){
        setCategoryFilter(category.name);
        setActivePage('products');
    }
  };

  const openFormModal = (
      mode: 'add' | 'edit',
      product: Product | null = null,
      prefillData: Partial<Product> = {}
  ) => {
      setModalMode(mode);
      const initialData = mode === 'edit' && product ? product : null;
      const combinedId = initialData?.id || prefillData.id || '';
      const combinedData = { ...initialData, ...prefillData, id: combinedId };
      setCurrentProduct(combinedData as Product);
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
      onSwitchToUser();
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
        return <DashboardHome allCategories={allCategories} />;
      case 'products':
        return <ProductManagement 
            products={filteredProducts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onClearCategoryFilter={() => setCategoryFilter(null)}
            allCategories={allCategories}
            allBrands={allBrands}
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
      case 'variant-options':
        return <VariantOptionManagement />;
      case 'brands':
        return <BrandManagement />;
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