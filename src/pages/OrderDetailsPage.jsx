import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, XCircle, Home, Truck, CheckCircle, CreditCard } from 'lucide-react';
import { getOrderDetails } from '../api/EcommerceApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency } from '../lib/utils.js';

const OrderDetailsPage = () => {
    const { id: orderId } = useParams();
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await getOrderDetails(orderId);
                // Security check: ensure the user owns the order or is an admin
                if (user && (data.user_id === user.id || isAdmin())) {
                    setOrder(data);
                } else {
                    setError("You don't have permission to view this order.");
                }
            } catch (err) {
                setError(err.message || 'Failed to load order details.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrder();
        }
    }, [orderId, user, isAdmin]);

    if (loading) {
        return (
            <div className="pt-24 pb-16 flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="pt-24 pb-16 max-w-screen-xl mx-auto text-center">
                <div className="text-red-400 p-8 glass-effect rounded-2xl">
                    <XCircle className="mx-auto h-16 w-16 mb-4" />
                    <p className="text-xl font-bold mb-2">Error Loading Order</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }
    
    if (!order) {
        return null; // Should be handled by loading/error states
    }

    const { shipping_address: address } = order;
    const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = order.total - subtotal;
    
    const getStatusInfo = (status) => {
        const statuses = {
            'Processing': { icon: <Loader2 className="h-5 w-5 animate-spin"/>, text: 'Your order is being processed.' },
            'Shipped': { icon: <Truck className="h-5 w-5"/>, text: 'Your order has been shipped.' },
            'Completed': { icon: <CheckCircle className="h-5 w-5 text-green-400"/>, text: 'Your order is complete.' },
            'Pending': { icon: <Loader2 className="h-5 w-5"/>, text: 'Your order is pending.' }
        };
        return statuses[status] || statuses['Pending'];
    }

    const statusInfo = getStatusInfo(order.status);

    return (
        <>
            <Helmet>
                <title>Order #{order.id} - AYExpress</title>
                <meta name="description" content={`Details for order #${order.id}.`} />
            </Helmet>
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-screen-lg mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Link to={isAdmin() ? "/admin/orders" : "/orders"} className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors mb-6">
                            <ArrowLeft size={16} />
                            {isAdmin() ? 'Back to All Orders' : 'Back to My Orders'}
                        </Link>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Order #{order.id}</h1>
                                <p className="text-white/70">
                                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-lg font-semibold flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
                                {statusInfo.icon}
                                <span>{order.status}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Items and Summary */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="glass-effect rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-4">Order Items ({order.order_items.length})</h2>
                                    <div className="space-y-4">
                                        {order.order_items.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <img
                                                    src={item.variants.products.image}
                                                    alt={item.variants.products.title}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white">{item.variants.products.title}</p>
                                                    <p className="text-sm text-white/70">{item.variants.title}</p>
                                                    <p className="text-sm text-white/70">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-effect rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-white/80"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                        <div className="flex justify-between text-white/80"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
                                        <div className="border-t border-white/20 mt-2 pt-2 flex justify-between text-lg font-bold text-white"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                                    </div>
                                </div>
                            </div>
                            {/* Shipping & Payment Details */}
                            <div className="h-fit space-y-6">
                                <div className="glass-effect rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Home size={20} /> Shipping Address</h2>
                                    <div className="space-y-1 text-white/90">
                                        <p>{address.first_name} {address.last_name}</p>
                                        <p>{address.address}</p>
                                        <p>{address.city}, {address.zip_code}</p>
                                    </div>
                                </div>
                                 <div className="glass-effect rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><CreditCard size={20} /> Payment Method</h2>
                                    <div className="space-y-1 text-white/90">
                                        {order.payment_method === 'cod' ? (
                                            <p className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-300"/> Cash on Delivery</p>
                                        ) : (
                                            <p className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-green-300"/> Credit Card</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default OrderDetailsPage;
