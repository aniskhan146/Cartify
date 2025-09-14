import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { useCart } from '../hooks/useCart.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ui/use-toast.js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { decreaseInventory } from '../api/EcommerceApi.js';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotalRaw, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to place an order.",
        });
        navigate('/login');
        return;
    }
    
    setIsProcessing(true);

    try {
        const total = getCartTotalRaw();
        
        // 1. Create the order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                total: total,
                status: 'Processing',
                shipping_address: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    zip_code: formData.zipCode,
                }
            })
            .select()
            .single();

        if (orderError) throw orderError;
        
        // 2. Create the order items
        const orderItems = cartItems.map(item => ({
            order_id: orderData.id,
            variant_id: item.variant.id,
            quantity: item.quantity,
            price: item.variant.sale_price_in_cents ?? item.variant.price_in_cents,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
        if (itemsError) throw itemsError;

        // 3. Decrease inventory for each item
        await decreaseInventory(orderData.id);

        // 4. Success
        clearCart();
        toast({
            title: "Order placed successfully!",
            description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
        });
        navigate('/success');

    } catch (error) {
        console.error("Checkout error:", error);
        toast({
            variant: "destructive",
            title: "Checkout Failed",
            description: "There was a problem processing your order. Please try again.",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const subtotal = getCartTotalRaw() / 100;
  const tax = subtotal * 0.08;
  const finalTotal = subtotal + tax;

  return (
    <>
      <Helmet>
        <title>Checkout - AYExpress</title>
        <meta name="description" content="Complete your purchase securely at AYExpress." />
      </Helmet>
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
              <p className="text-white/70">Complete your purchase securely</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-effect rounded-2xl p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="sr-only">First name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          placeholder="First name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="sr-only">Last name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          placeholder="Last name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="address" className="sr-only">Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="city" className="sr-only">City</label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="sr-only">ZIP code</label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          placeholder="ZIP code"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Information
                    </h2>
                    <div>
                      <label htmlFor="cardNumber" className="sr-only">Card number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="Card number"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="expiryDate" className="sr-only">Expiry date (MM/YY)</label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="sr-only">CVV</label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          placeholder="CVV"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl neon-glow text-base"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Lock className="h-5 w-5 mr-2" />
                        Complete Order - ${finalTotal.toFixed(2)}
                      </div>
                    )}
                  </Button>

                  <div className="flex items-center justify-center space-x-2 text-sm text-white/70">
                    <Lock className="h-4 w-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </form>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="glass-effect rounded-2xl p-8 h-fit"
              >
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.variant.id} className="flex items-center space-x-4">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{item.product.title}</h3>
                        <p className="text-white/70">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-white font-semibold">
                        ${(((item.variant.sale_price_in_cents ?? item.variant.price_in_cents) * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 border-t border-white/20 pt-6">
                  <div className="flex justify-between text-white/80">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white border-t border-white/20 pt-3">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Free shipping included</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Secure payment processing</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </>
  );
};

export default CheckoutPage;