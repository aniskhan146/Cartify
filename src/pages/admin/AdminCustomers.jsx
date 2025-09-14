import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Mail, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { getCustomersWithStats } from '@/api/EcommerceApi';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchCustomers = useCallback(async () => {
      try {
        const data = await getCustomersWithStats();
        setCustomers(data);
      } catch (error) {
         console.error("Error fetching customers:", error);
         toast({ variant: "destructive", title: "Failed to load customers." });
      } finally {
        setLoading(false);
      }
    }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchCustomers();
    
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Profiles change received!', payload);
        fetchCustomers();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchCustomers]);


  const filteredCustomers = customers.filter(customer =>
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewCustomer = (customerId) => {
    toast({
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300';
      case 'user':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <>
      <Helmet>
        <title>Customers Management - Admin - AYExpress</title>
        <meta name="description" content="Manage customers in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
              <p className="text-white/70">View and manage your customer base</p>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
              <input
                type="text"
                placeholder="Search customers by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </motion.div>

          {/* Customers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
                      <th className="text-left p-6 text-white font-semibold">Customer</th>
                      <th className="text-left p-6 text-white font-semibold">Join Date</th>
                      <th className="text-left p-6 text-white font-semibold">Orders</th>
                      <th className="text-left p-6 text-white font-semibold">Total Spent</th>
                      <th className="text-left p-6 text-white font-semibold">Role</th>
                      <th className="text-left p-6 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white">
                              {customer.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-white font-medium">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-white/80">{new Date(customer.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-white/80">{customer.order_count} orders</span>
                        </td>
                        <td className="p-6">
                          <span className="text-white font-semibold">{formatCurrency(customer.total_spent)}</span>
                        </td>
                        <td className="p-6">
                          <span className={`capitalize px-3 py-1 rounded-full text-xs ${getStatusColor(customer.role)}`}>
                            {customer.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCustomer(customer.id)}
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-white/70"
          >
            <p>Showing {filteredCustomers.length} of {customers.length} customers</p>
          </motion.div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminCustomers;
