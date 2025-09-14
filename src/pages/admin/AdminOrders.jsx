import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Eye, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { updateOrderStatus } from '@/api/EcommerceApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchOrders = useCallback(async () => {
      let query = supabase
        .from('orders')
        .select('id, created_at, total, status, profiles(email), order_items(id)');

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast({ variant: "destructive", title: "Failed to load orders." });
      } else {
        setOrders(data);
      }
      setLoading(false);
    }, [statusFilter, toast]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();

    const channel = supabase.channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          console.log('New order received!', payload);
          toast({
              title: "🎉 New Order Received!",
              description: "A new order has been placed and added to the list.",
          });
          setOrders(currentOrders => [payload.new, ...currentOrders]);
          fetchOrders(); // Re-fetch to get all data correctly
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, [statusFilter, toast, fetchOrders]);

  const filteredOrders = orders.filter(order => {
    const customer = order.profiles;
    return (customer?.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
           order.id.toString().includes(searchTerm);
  });

  const handleViewOrder = (orderId) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus);
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o)
        );
        toast({
            title: "Status Updated",
            description: `Order #${orderId} has been updated to ${newStatus}.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update order status.",
        });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-300';
      case 'Processing': return 'bg-yellow-500/20 text-yellow-300';
      case 'Shipped': return 'bg-blue-500/20 text-blue-300';
      case 'Pending':
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const orderStatuses = ['Processing', 'Shipped', 'Completed', 'Pending'];

  return (
    <>
      <Helmet>
        <title>Orders Management - Admin - AYExpress</title>
        <meta name="description" content="Manage orders in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
            <p className="text-white/70">Manage and track customer orders</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Status</option>
                  {orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Orders Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-effect rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              {loading ? (
                  <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-6 text-white font-semibold">Order ID</th>
                      <th className="text-left p-6 text-white font-semibold">Customer</th>
                      <th className="text-left p-6 text-white font-semibold">Date</th>
                      <th className="text-left p-6 text-white font-semibold">Items</th>
                      <th className="text-left p-6 text-white font-semibold">Total</th>
                      <th className="text-left p-6 text-white font-semibold">Status</th>
                      <th className="text-left p-6 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-6">
                          <span className="text-white font-medium">#{order.id}</span>
                        </td>
                        <td className="p-6">
                          <div>
                            <p className="text-white font-medium">{order.profiles?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-white/80">{new Date(order.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-white/80">{order.order_items.length} items</span>
                        </td>
                        <td className="p-6">
                          <span className="text-white font-semibold">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="p-6">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className={`px-3 py-1 h-auto rounded-full text-xs ${getStatusColor(order.status)}`}>
                                {order.status}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {orderStatuses.map(status => (
                                <DropdownMenuItem key={status} onSelect={() => handleUpdateStatus(order.id, status)}>
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order.id)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-white/70"
          >
            <p>Showing {filteredOrders.length} of {orders.length} orders</p>
          </motion.div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminOrders;
