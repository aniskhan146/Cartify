import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Edit, Trash2, MoreVertical, Loader2, ListOrdered } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { formatCurrency } from '../../lib/utils.js';
import { getCustomersWithStats, deleteUserByAdmin } from '../../api/EcommerceApi.js';
import EditUserRoleDialog from '../../components/admin/EditUserRoleDialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "../../components/ui/dropdown-menu.jsx";


const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addAdminNotification } = useAdminNotification();
  const { user } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const fetchCustomers = useCallback(async () => {
      try {
        const data = await getCustomersWithStats();
        setCustomers(data);
      } catch (error) {
         console.error("Error fetching customers:", error);
         addAdminNotification({ category: 'Errors', title: "Failed to load customers.", message: error.message });
      } finally {
        setLoading(false);
      }
    }, [addAdminNotification]);

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

  const handleEdit = (customer) => {
    setSelectedUser(customer);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (customer) => {
    setUserToDelete(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserByAdmin(userToDelete.id);
      addAdminNotification({ category: 'Customers', title: 'User Deleted', message: `${userToDelete.email} has been deleted.` });
      setUserToDelete(null);
      fetchCustomers(); // Refresh list
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Deletion Failed', message: error.message });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <title>User Management - Admin - AYExpress</title>
        <meta name="description" content="Manage users in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
              <p className="text-white/70">View, edit, and manage user accounts</p>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-effect rounded-xl p-4"
          >
            <div className="relative">
              <label htmlFor="customer-search" className="sr-only">Search users by email</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
              <input
                type="text"
                id="customer-search"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </motion.div>

          {/* Customers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
                      <th className="text-left p-4 text-white font-semibold">User</th>
                      <th className="text-left p-4 text-white font-semibold">Join Date</th>
                      <th className="text-left p-4 text-white font-semibold">Orders</th>
                      <th className="text-left p-4 text-white font-semibold">Total Spent</th>
                      <th className="text-left p-4 text-white font-semibold">Role</th>
                      <th className="text-center p-4 text-white font-semibold">Actions</th>
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
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white text-xs">
                              {customer.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-white font-medium">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white/80">{new Date(customer.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white/80">{customer.order_count} orders</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-semibold">{formatCurrency(customer.total_spent)}</span>
                        </td>
                        <td className="p-4">
                          <span className={`capitalize px-3 py-1 rounded-full text-xs ${getStatusColor(customer.role)}`}>
                            {customer.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-white/10" disabled={customer.id === user.id}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild className="cursor-pointer">
                                  <Link to={`/admin/orders?customer_email=${encodeURIComponent(customer.email)}`}>
                                    <ListOrdered className="mr-2 h-4 w-4" />
                                    <span>View Orders</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEdit(customer)} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit Role</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => confirmDelete(customer)} className="text-red-400 focus:text-red-300 focus:bg-red-400/10 cursor-pointer">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete User</span>
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-white/70 text-sm"
          >
            <p>Showing {filteredCustomers.length} of {customers.length} users</p>
          </motion.div>
        </div>

        <EditUserRoleDialog 
          user={selectedUser}
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          onSuccess={fetchCustomers}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the account for "{userToDelete?.email}" and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete User</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </AdminLayout>
    </>
  );
};

export default AdminCustomers;