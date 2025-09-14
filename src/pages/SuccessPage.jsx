import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';

const SuccessPage = () => {
  return (
    <>
      <Helmet>
        <title>Order Successful - AYExpress</title>
        <meta name="description" content="Your order has been placed successfully." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="glass-effect rounded-2xl p-12 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 150 }}
            >
              <CheckCircle className="h-24 w-24 text-green-400 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-white/80 mb-8 text-lg">
              Thank you for your order. You will receive a confirmation email shortly.
            </p>
            <Link to="/store">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-full text-base shadow-lg transform hover:scale-105 transition-transform"
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;