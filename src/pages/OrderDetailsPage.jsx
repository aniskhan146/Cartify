import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, XCircle, Home, Truck, CheckCircle, CreditCard, Cog, PackageCheck, Check } from 'lucide-react';
import { getOrderDetails } from '../api/EcommerceApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency } from '../lib/utils.js';

const OrderStatusTracker = ({ currentStatus }) => {
    const statuses = ['Processing', 'Shipped', 'Completed'];
    const statusConfig = {
        'Processing': { icon: <Cog size={24} />, text: 'Your order is being processed.' },
        'Shipped': { icon: <Truck size={24} />, text: 'Your order has been shipped.' },
        'Completed': { icon: <PackageCheck size={24} />, text: 'Your order is complete.' },
        'Pending': { icon: <Cog size={24} />, text: 'Your order is pending.' }
    };

    let currentStatusIndex = statuses.indexOf(currentStatus);
    // Handle 'Pending' status like 'Processing' for the tracker UI
    if (currentStatus === 'Pending' || currentStatusIndex === -1) {
        currentStatusIndex = 0;
    }

    return (
        <div className="w-full">
            <div className="flex items-center">
                {statuses.map((status, index) => {
                    const isCompleted = currentStatusIndex >= index;
                    const isLastStep = index === statuses.length - 1;

                    return (
                        <React.Fragment key={status}>
                            <div className="flex flex-col items-center text-center z-10 w-1/3">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500
                                        ${isCompleted ? 'bg-purple-500 border-purple-400 text-white' : 'bg-slate-800 border-slate-600 text-white/50'}
                                    `}
                                >
                                    {isCompleted ? <Check size={28} /> : statusConfig[status].icon}
                                </div>
                                <p className={`mt-2 text-sm font-medium transition-colors duration-500 ${isCompleted ? 'text-white' : 'text-white/50'}`}>
                                    {status}
                                </p>
                            </div>

                            {!isLastStep && (
                                <div className="flex-grow h-1 bg-slate-600 relative mx-2">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-purple-500 transition-all duration-500"
                                        style={{ width: currentStatusIndex > index ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <p className="text-center text-sm text-white/70 mt-4">
                {statusConfig[currentStatus]?.text || 'Your order status is being updated.'}
            </p>
        </div>
    );
};


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
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Order #{order.id}</h1>
                                <p className="text-white/70">
                                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-effect rounded-2xl p-6 mb-8"
                        >
                            <OrderStatusTracker currentStatus={order.status} />
                        </motion.div>


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