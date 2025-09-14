import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ProductsList from '../components/ProductsList.jsx';

const StorePage = () => {
  return (
    <>
      <Helmet>
        <title>Store - AYExpress</title>
        <meta name="description" content="Browse our extensive collection of premium products at AYExpress." />
      </Helmet>
      
      <div className="min-h-screen">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Our Store</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Discover our curated collection of premium products.
              </p>
            </motion.div>

            <ProductsList />
          </div>
        </div>
      </div>
    </>
  );
};

export default StorePage;
