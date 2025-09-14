import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import ProductsList from '../components/ProductsList.jsx';
import { getProducts } from '../api/EcommerceApi.js';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch a small number of products for the homepage.
        // The API can be extended to support a 'featured' flag.
        const { products } = await getProducts({ limit: 4 });
        setFeaturedProducts(products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);


  return <>
      <Helmet>
        <title>AYExpress - Premium E-commerce Experience</title>
        <meta name="description" content="Discover premium products with lightning-fast delivery and exceptional quality at AYExpress." />
      </Helmet>
      
      <div className="min-h-screen">
        
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 opacity-70"></div>
            <div className="absolute inset-0 pattern-bg"></div>
            <div className="relative z-10 max-w-screen-lg mx-auto">
                <motion.h1 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, type: 'spring' }}
                    className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
                >
                    <span className="gradient-text">AYExpress</span>: Your Store, Reimagined.
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
                    className="text-base md:text-lg text-white/80 mb-10"
                >
                    Explore a curated collection of premium products, delivered with exceptional service.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Link to="/store">
                        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-full text-base shadow-lg transform hover:scale-105 transition-transform">
                            Explore The Store
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
        
        {/* Featured Products */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">Featured Products</h2>
              <p className="text-lg text-white/70">Handpicked premium items just for you</p>
            </motion.div>
            
            <ProductsList products={featuredProducts} loading={loading} error={error} skeletonCount={4} />
            
            <div className="text-center mt-12">
              <Link to="/store">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-full">
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">What Our Customers Say</h2>
              <p className="text-lg text-white/70">Join thousands of satisfied customers</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[{
              name: "Sarah Johnson",
              rating: 5,
              comment: "Amazing quality and super fast delivery! Will definitely shop here again."
            }, {
              name: "Mike Chen",
              rating: 5,
              comment: "The customer service is outstanding. They really care about their customers."
            }, {
              name: "Emily Davis",
              rating: 5,
              comment: "Best online shopping experience I've ever had. Highly recommended!"
            }].map((testimonial, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 50
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: index * 0.2
            }} className="glass-effect rounded-2xl p-8 card-hover">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/80 mb-4 italic">"{testimonial.comment}"</p>
                  <p className="text-purple-300 font-semibold">- {testimonial.name}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/20 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold gradient-text mb-4">AYExpress</div>
                <p className="text-white/70">Premium e-commerce experience with exceptional quality and service.</p>
              </div>
              <div>
                <span className="text-white font-semibold mb-4 block">Quick Links</span>
                <div className="space-y-2">
                  <Link to="/store" className="text-white/70 hover:text-white block transition-colors">Store</Link>
                  <span className="text-white/70 hover:text-white block transition-colors cursor-pointer">Cart</span>
                </div>
              </div>
              <div>
                <span className="text-white font-semibold mb-4 block">Support</span>
                <div className="space-y-2">
                  <span className="text-white/70 block">Help Center</span>
                  <span className="text-white/70 block">Contact Us</span>
                  <span className="text-white/70 block">Shipping Info</span>
                </div>
              </div>
              <div>
                <span className="text-white font-semibold mb-4 block">Connect</span>
                <div className="space-y-2">
                  <span className="text-white/70 block">Newsletter</span>
                  <span className="text-white/70 block">Social Media</span>
                  <span className="text-white/70 block">Blog</span>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 text-center">
              <p className="text-white/70">&copy; 2025 AYExpress. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>;
};
export default HomePage;