import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Eye, Loader2, CreditCard, Truck, MoreVertical, Mail } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useNotification } from '../../hooks/useNotification.jsx';
import { supabase } from '../../lib/supabase.js';
import { formatCurrency } from '../../lib/utils.js';
import { updateOrderStatus } from '../../api/EcommerceApi.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu.jsx";

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(null); // Holds the ID of the order being resent
  const { addNotification } = useNotification();
  
  const fetchOrders = useCallback(async () => {
      let query = supabase
        .from('orders')
        .select('id, created_at, total, status, payment_method, profiles(email), order_items(id)');

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        addNotification({ type: "error", title: "Failed to load orders.", message: error.message });
      } else {
        setOrders(data);
      }
      setLoading(false);
    }, [statusFilter, addNotification]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();

    const channel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
             addNotification({
              type: "info",
              title: "🎉 New Order Received!",
              message: "A new order has been placed and added to the list.",
            });
          }
          fetchOrders();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, [statusFilter, addNotification, fetchOrders]);

  const filteredOrders = orders.filter(order => {
    const customer = order.profiles;
    return (customer?.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
           order.id.toString().includes(searchTerm);
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus);
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o)
        );
        addNotification({
            type: "success",
            title: "Status Updated",
            message: `Order #${orderId} has been updated to ${newStatus}.`,
        });
    } catch (error) {
        addNotification({
            type: "error",
            title: "Update Failed",
            message: error.message || "Could not update order status.",
        });
    }
  };

  const handleResendConfirmation = async (orderId) => {
    setIsResending(orderId);
    try {
        const { error } = await supabase.functions.invoke('send-order-confirmation', {
            body: { orderId },
        });
        if (error) throw error;
        addNotification({
            type: "success",
            title: "Email Sent!",
            message: `Confirmation for order #${orderId} has been resent.`,
        });
    } catch (error) {
        console.error("Failed to resend confirmation email:", error);
        addNotification({
            type: "error",
            title: "Failed to Send Email",
            message: "There was an issue resending the confirmation email.",
        });
    } finally {
        setIsResending(null);
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
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
            <p className="text-white/70">Manage and track customer orders</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-xl p-4"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <label htmlFor="order-search" className="sr-only">Search by order ID or customer email</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  id="order-search"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="glass-effect rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              {loading ? (
                  <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-white font-semibold">Order ID</th>
                      <th className="text-left p-4 text-white font-semibold">Customer</th>
                      <th className="text-left p-4 text-white font-semibold">Date</th>
                      <th className="text-left p-4 text-white font-semibold">Items</th>
                      <th className="text-left p-4 text-white font-semibold">Total</th>
                      <th className="text-left p-4 text-white font-semibold">Payment</th>
                      <th className="text-left p-4 text-white font-semibold">Status</th>
                      <th className="text-center p-4 text-white font-semibold">Actions</th>
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
                        <td className="p-4">
                          <span className="text-white font-medium">#{order.id}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">{order.profiles?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white/80">{new Date(order.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white/80">{order.order_items.length} items</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-semibold">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="p-4">
                          {order.payment_method === 'cod' ? (
                            <span className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                <Truck className="h-3 w-3" />
                                COD
                            </span>
                          ) : (
                             <span className="flex items-center gap-2 text-xs text-white/80">
                                <CreditCard className="h-3 w-3" />
                                Card
                            </span>
                          )}
                        </td>
                        <td className="p-4">
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
                        <td className="p-4 text-center">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-white/10">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to={`/admin/order/${order.id}`} className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" />
                                        <span>View Details</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => handleResendConfirmation(order.id)}
                                    disabled={isResending === order.id}
                                    className="cursor-pointer"
                                >
                                    {isResending === order.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    <span>Resend Confirmation</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
            className="text-center text-white/70 text-sm"
          >
            <p>Showing {filteredOrders.length} of {orders.length} orders</p>
          </motion.div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminOrders;