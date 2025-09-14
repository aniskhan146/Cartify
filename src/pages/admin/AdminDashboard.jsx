import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

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

      // Fetch recent orders, selecting email instead of full_name
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(4);
      setRecentOrders(orders || []);

      // Fetch top products (simplified: showing recent products)
      const { data: products } = await supabase
        .from('products')
        .select('id, title, category, image, variants(price_in_cents, inventory_quantity)')
        .order('created_at', { ascending: false })
        .limit(5);
      setTopProducts(products || []);
      
      setLoading(false);
    };

    fetchData();
  }, []);
  
  if (loading) {
     return (
        <AdminLayout>
            <div className="flex justify-center items-center h-full">
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
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
    },
     {
      title: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
    }
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AYExpress</title>
        <meta name="description" content="Admin dashboard for managing AYExpress e-commerce platform." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70">Welcome back! Here's what's happening with your store.</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-white/70 text-sm">{stat.title}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                <Link to="/admin/orders">
                  <button className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Order #{order.id}</p>
                      <p className="text-white/70 text-sm">{order.profiles?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                        order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-300' :
                        order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Products</h2>
                <Link to="/admin/products">
                  <button className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{product.title}</p>
                      <p className="text-white/70 text-sm">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(product.variants[0]?.price_in_cents)}</p>
                      <p className="text-green-400 text-sm">{product.variants[0]?.inventory_quantity} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/products" className="block">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center card-hover">
                  <Package className="h-8 w-8 text-white mx-auto mb-2" />
                  <h3 className="text-white font-semibold">Manage Products</h3>
                  <p className="text-blue-100 text-sm">Add, edit, or remove products</p>
                </div>
              </Link>
              <Link to="/admin/orders" className="block">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center card-hover">
                  <ShoppingCart className="h-8 w-8 text-white mx-auto mb-2" />
                  <h3 className="text-white font-semibold">View Orders</h3>
                  <p className="text-green-100 text-sm">Process and track orders</p>
                </div>
              </Link>
              <Link to="/admin/customers" className="block">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center card-hover">
                  <Users className="h-8 w-8 text-white mx-auto mb-2" />
                  <h3 className="text-white font-semibold">Manage Customers</h3>
                  <p className="text-purple-100 text-sm">View customer information</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;
