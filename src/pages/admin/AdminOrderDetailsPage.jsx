import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, XCircle, Home, Truck, CheckCircle, CreditCard, User, Mail, Calendar, Hash } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { getOrderDetails } from '../../api/EcommerceApi.js';
import { formatCurrency } from '../../lib/utils.js';
import { useNotification } from '../../hooks/useNotification.jsx';

const AdminOrderDetailsPage = () => {
    const { id: orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addNotification } = useNotification();

    const fetchOrder = useCallback(async () => {
        try {
            const data = await getOrderDetails(orderId);
            setOrder(data);
        } catch (err) {
            setError(err.message || 'Failed to load order details.');
            addNotification({ type: 'error', title: 'Loading Error', message: err.message });
        } finally {
            setLoading(false);
        }
    }, [orderId, addNotification]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="text-center text-red-400 p-8 glass-effect rounded-2xl">
                    <XCircle className="mx-auto h-16 w-16 mb-4" />
                    <p className="text-xl font-bold mb-2">Error Loading Order</p>
                    <p>{error}</p>
                    <Link to="/admin/orders" className="mt-4 inline-block text-purple-300 hover:text-purple-200">
                        &larr; Back to Orders
                    </Link>
                </div>
            </AdminLayout>
        );
    }
    
    if (!order) return null;

    const { shipping_address: address } = order;
    const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = order.total - subtotal;

    const getStatusInfo = (status) => {
        const statuses = {
            'Processing': { icon: <Loader2 className="h-4 w-4 animate-spin"/>, color: 'bg-yellow-500/20 text-yellow-300' },
            'Shipped': { icon: <Truck className="h-4 w-4"/>, color: 'bg-blue-500/20 text-blue-300' },
            'Completed': { icon: <CheckCircle className="h-4 w-4"/>, color: 'bg-green-500/20 text-green-300' },
            'Pending': { icon: <Loader2 className="h-4 w-4"/>, color: 'bg-gray-500/20 text-gray-300' }
        };
        return statuses[status] || statuses['Pending'];
    }
    const statusInfo = getStatusInfo(order.status);

    return (
        <>
            <Helmet>
                <title>Admin: Order #{order.id} - AYExpress</title>
                <meta name="description" content={`Admin view for order #${order.id}.`} />
            </Helmet>
            <AdminLayout>
                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to="/admin/orders" className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors mb-6">
                            <ArrowLeft size={16} />
                            Back to All Orders
                        </Link>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <Hash className="text-purple-400" />
                                    Order Details
                                </h1>
                                <p className="text-white/70">Order ID: {order.id}</p>
                            </div>
                            <div className={`text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                                {statusInfo.icon}
                                <span>{order.status}</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-effect rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Order Items ({order.order_items.length})</h2>
                                <div className="space-y-4">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                                            <img
                                                src={item.variants.products.image}
                                                alt={item.variants.products.title}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-white">{item.variants.products.title}</p>
                                                <p className="text-sm text-purple-300">{item.variants.title}</p>
                                                <p className="text-sm text-white/70">{formatCurrency(item.price)} x {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-effect rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Financial Summary</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-white/80"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between text-white/80"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
                                    <div className="border-t border-white/20 mt-2 pt-2 flex justify-between text-lg font-bold text-white"><span>Grand Total</span><span>{formatCurrency(order.total)}</span></div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="h-fit space-y-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-effect rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User size={20} /> Customer</h2>
                                <div className="space-y-1 text-white/90">
                                    <p>{address.first_name} {address.last_name}</p>
                                    <p className="flex items-center gap-2 text-sm text-white/70"><Mail size={14} />{order.profiles?.email || 'N/A'}</p>
                                </div>
                            </motion.div>
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-effect rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Home size={20} /> Shipping Address</h2>
                                <div className="space-y-1 text-white/90">
                                    <p>{address.first_name} {address.last_name}</p>
                                    <p>{address.address}</p>
                                    <p>{address.city}, {address.zip_code}</p>
                                </div>
                            </motion.div>
                             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-effect rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><CreditCard size={20} /> Payment & Date</h2>
                                <div className="space-y-2 text-white/90">
                                    <p className="flex items-center gap-2">
                                        {order.payment_method === 'cod' ? <Truck className="h-5 w-5 text-blue-300"/> : <CreditCard className="h-5 w-5 text-green-300"/>}
                                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                                    </p>
                                    <p className="flex items-center gap-2 text-sm text-white/70">
                                        <Calendar size={14} />
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
};

export default AdminOrderDetailsPage;