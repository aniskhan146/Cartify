import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { useCart } from '../hooks/useCart.jsx';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotalRaw, clearCart } = useCart();
  const subtotal = getCartTotalRaw() / 100;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - AYExpress</title>
          <meta name="description" content="Your shopping cart at AYExpress." />
        </Helmet>
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-screen-md mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-effect rounded-2xl p-12"
              >
                <ShoppingBag className="h-24 w-24 text-white/50 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Your cart is empty</h1>
                <p className="text-white/70 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/store">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shopping Cart - AYExpress</title>
        <meta name="description" content="Review your items and proceed to checkout at AYExpress." />
      </Helmet>
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-white mb-2">Shopping Cart</h1>
              <p className="text-white/70">Review your items and proceed to checkout</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.variant.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-effect rounded-2xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                      
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-base font-semibold text-white">{item.product.title}</h3>
                        <p className="text-sm text-purple-300">{item.variant.title}</p>
                        <p className="text-xl font-bold text-white mt-1">
                          {item.variant.sale_price_formatted || item.variant.price_formatted}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-white/20 rounded-xl">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                            className="text-white hover:bg-white/10"
                            aria-label={`Decrease quantity of ${item.product.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-3 py-1 text-white">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                            className="text-white hover:bg-white/10"
                            aria-label={`Increase quantity of ${item.product.title}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.variant.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          aria-label={`Remove ${item.product.title} from cart`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex justify-between items-center pt-4"
                >
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="border-red-400 text-red-400 hover:bg-red-400/10"
                  >
                    Clear Cart
                  </Button>
                  <Link to="/store">
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      Continue Shopping
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="glass-effect rounded-2xl p-6 h-fit"
              >
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/80">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
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
                  <div className="border-t border-white/20 pt-4 mt-2">
                    <div className="flex justify-between text-lg font-bold text-white">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Link to="/checkout" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl neon-glow">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>Free shipping on orders over $50</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>Secure checkout</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </>
  );
};

export default CartPage;
