import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, XCircle, Home, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { getOrderDetails } from '../api/EcommerceApi.js';
import { formatCurrency } from '../lib/utils.js';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Could not find the specified order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 text-white animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-2xl p-12 shadow-2xl max-w-lg w-full"
        >
          <XCircle className="h-24 w-24 text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Order Not Found</h1>
          <p className="text-white/80 mb-8">{error || "We couldn't retrieve your order details. Please check your order history or contact support."}</p>
          <Link to="/store">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-full">
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const { shipping_address: address } = order;
  const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Helmet>
        <title>Order Confirmed! - AYExpress</title>
        <meta name="description" content="Your order has been placed successfully." />
      </Helmet>
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">Thank you for your order!</h1>
            <p className="text-white/80">Your order has been confirmed. A confirmation email has been sent to you.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/10 pb-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-1">Order Number</h3>
                <p className="font-bold text-white">#{order.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-1">Date</h3>
                <p className="font-bold text-white">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/70 mb-1">Total</h3>
                <p className="font-bold text-white">{formatCurrency(order.total)}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={20} /> Items Ordered
              </h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Home size={20} /> Shipping To</h2>
                <div className="space-y-1 text-white/90">
                  <p>{address.first_name} {address.last_name}</p>
                  <p>{address.address}</p>
                  <p>{address.city}, {address.zip_code}</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-white/80"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-white/80"><span>Shipping</span><span className="text-green-400">Free</span></div>
                  <div className="flex justify-between text-white/80"><span>Tax</span><span>{formatCurrency(order.total - subtotal)}</span></div>
                  <div className="border-t border-white/20 mt-2 pt-2 flex justify-between text-lg font-bold text-white"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={`/order/${order.id}`}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-semibold py-3 px-6 rounded-full text-base shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto"
                  >
                    View Order Details
                  </Button>
                </Link>
                <Link to="/store">
                    <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-full text-base shadow-lg transform hover:scale-105 transition-transform">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;
