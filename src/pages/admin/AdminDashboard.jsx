import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, Eye, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { formatCurrency } from '../../lib/utils.js';
import { useNotification } from '../../hooks/useNotification.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    // Fetch stats
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: orderCount, data: orderData } = await supabase.from('orders').select('total', { count: 'exact' });
    const { count: customerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const totalRevenue = orderData.reduce((sum, order) => sum + order.total, 0);

    setStats({
      products: productCount || 0,
      orders: orderCount || 0,
      customers: customerCount || 0,
      revenue: totalRevenue || 0,
    });

    // Fetch recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(4);
    setRecentOrders(orders || []);

    // Fetch recent products
    const { data: products } = await supabase
      .from('products')
      .select('id, title, category, image, variants(price_in_cents, inventory_quantity)')
      .order('created_at', { ascending: false })
      .limit(5);
    setTopProducts(products || []);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();

    const channel = supabase.channel('dashboard-realtime');
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          addNotification({
            type: 'info',
            title: "🎉 New Order!",
            message: `A new order (#${payload.new.id}) was just placed for ${formatCurrency(payload.new.total)}.`,
          });
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }

  }, [fetchData, addNotification]);
  
  if (loading) {
     return (
        <AdminLayout>
            <div className="flex justify-center items-center h-screen -mt-16">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
        </AdminLayout>
     )
  }

  const statsCards = [
    {
      title: 'Revenue',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      link: null, // No link for revenue
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      link: '/admin/orders',
    },
     {
      title: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/customers',
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/products',
    }
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AYExpress</title>
        <meta name="description" content="Admin dashboard for managing AYExpress e-commerce platform." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-white/70">Welcome back! Here's what's happening with your store.</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => {
              const cardContent = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-5 card-hover h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-r ${stat.color} rounded-lg p-2.5`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-white/70 text-sm">{stat.title}</p>
                </motion.div>
              );

              return stat.link ? (
                <Link to={stat.link} key={stat.title} className="block">
                  {cardContent}
                </Link>
              ) : (
                <div key={stat.title}>
                  {cardContent}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-effect rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Orders</h2>
                <Link to="/admin/orders">
                  <button className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">Order #{order.id}</p>
                      <p className="text-white/70 text-xs">{order.profiles?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                        order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-300' :
                        order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                )) : <p className="text-white/50 text-center text-sm py-4">No recent orders.</p>}
              </div>
            </motion.div>

            {/* Recent Products */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass-effect rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Products</h2>
                <Link to="/admin/products">
                  <button className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {topProducts.length > 0 ? topProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{product.title}</p>
                      <p className="text-white/70 text-xs">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{formatCurrency(product.variants[0]?.price_in_cents)}</p>
                      <p className="text-green-400 text-xs">{product.variants[0]?.inventory_quantity} in stock</p>
                    </div>
                  </div>
                )) : <p className="text-white/50 text-center text-sm py-4">No recent products.</p>}
              </div>
            </motion.div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;
