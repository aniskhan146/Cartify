import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useToast } from '../../components/ui/use-toast.js';
import { Bell, User, ShoppingCart, AlertTriangle, Copy, Trash2, Inbox } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog.jsx";

const AdminNotifications = () => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useAdminNotification();
  const { toast } = useToast();
  
  const getIconForType = (category) => {
    switch (category) {
        case 'Orders': return <ShoppingCart className="h-6 w-6 text-green-400 flex-shrink-0" />;
        case 'Customers': return <User className="h-6 w-6 text-blue-400 flex-shrink-0" />;
        case 'Errors': return <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />;
        default: return <Bell className="h-6 w-6 text-gray-400 flex-shrink-0" />;
    }
  };

  const handleCopy = (message) => {
    navigator.clipboard.writeText(message);
    toast({
      title: 'Copied to clipboard!',
      description: 'The notification message has been copied.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Notifications - Admin - AYExpress</title>
        <meta name="description" content="View all system notifications in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="max-w-screen-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Bell className="h-8 w-8 text-purple-300"/>
              Admin Notifications
            </h1>
            <p className="text-white/70">System alerts for orders, customers, and errors.</p>
          </motion.div>

          <div className="flex justify-end gap-2 mb-6">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                   <Button variant="outline" onClick={markAllAsRead}>Mark all as read</Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2"/>
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your admin notifications. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearNotifications}>Clear Notifications</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center text-gray-400 p-12 glass-effect rounded-2xl"
              >
                <Inbox size={64} className="mx-auto mb-4 text-white/50" />
                <h2 className="text-2xl font-bold text-white mb-2">All Clear!</h2>
                <p>You have no new notifications.</p>
              </motion.div>
            ) : (
              notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`glass-effect rounded-2xl p-6 transition-all ${!n.read ? 'border-purple-500/50 border' : 'border-transparent'}`}
                >
                  <div className="flex items-start gap-4">
                    {getIconForType(n.category)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg text-white">{n.title}</p>
                          <p className="text-sm text-white/50 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(n.message)} className="text-white/70 hover:text-white" aria-label="Copy message">
                           <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-base text-white/80 mt-3 whitespace-pre-wrap">{n.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminNotifications;