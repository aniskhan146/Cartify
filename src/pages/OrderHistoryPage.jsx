import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Loader2, ListOrdered } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { formatCurrency } from '../lib/utils.js';

const OrderHistoryPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at, total, status, order_items(id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      setLoading(true);
      fetchOrders(user.id).finally(() => setLoading(false));

      const channel = supabase
        .channel(`user-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Order change received!', payload);
            fetchOrders(user.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading, navigate, fetchOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-300';
      case 'Processing': return 'bg-yellow-500/20 text-yellow-300';
      case 'Shipped': return 'bg-blue-500/20 text-blue-300';
      case 'Pending':
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 text-white animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Orders - AYExpress</title>
          <meta name="description" content="Your order history at AYExpress." />
        </Helmet>
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-effect rounded-2xl p-12"
              >
                <ShoppingBag className="h-24 w-24 text-white/50 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">You have no orders yet</h1>
                <p className="text-white/70 mb-8">All your future orders will appear here.</p>
                <Link to="/store">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Orders - AYExpress</title>
        <meta name="description" content="View your order history at AYExpress." />
      </Helmet>
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-4">My Orders</h1>
              <p className="text-white/70">Here's a list of all your past orders.</p>
            </motion.div>

            <div className="space-y-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-effect rounded-2xl p-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                             <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                {order.status}
                             </span>
                             <span className="text-white/50 text-sm">
                                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                             </span>
                        </div>
                        <h2 className="text-xl font-bold text-white">Order #{order.id}</h2>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-white/70">Total Amount</p>
                        <p className="text-2xl font-bold text-purple-300">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 my-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white/70">
                        <ListOrdered className="h-5 w-5" />
                        <span>{order.order_items.length} items</span>
                    </div>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        View Details
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
    </>
  );
};

export default OrderHistoryPage;