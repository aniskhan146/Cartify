import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../hooks/useNotification.jsx';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        addNotification({
          type: "success",
          title: "Welcome back!",
          message: "Successfully logged in.",
        });
        // Redirect logic is handled by AuthContext on state change
        // For admin, we can add a specific redirect here after login
        if (formData.email === 'admin@ayexpress.com') { // Example admin check
             navigate('/admin');
        } else {
             navigate('/');
        }
      } else {
        await signUp(formData.email, formData.password, formData.name);
        addNotification({
          type: "success",
          title: "Account created!",
          message: "Please check your email for a confirmation link.",
        });
        // You might want to stay on the page and show a success message
        // or redirect to a "please confirm email" page.
        setIsLogin(true); 
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Authentication Error",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Login' : 'Register'} - AYExpress</title>
        <meta name="description" content={`${isLogin ? 'Login to' : 'Create an account with'} AYExpress for a personalized shopping experience.`} />
      </Helmet>
      
      <div className="min-h-screen">
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="glass-effect rounded-2xl p-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-white/70">
                  {isLogin ? 'Sign in to your account' : 'Join AYExpress today'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="sr-only">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl neon-glow"
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/70">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-300 hover:text-purple-200 ml-2 font-medium"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-sm text-center mb-2">Supabase Auth is now active!</p>
                <p className="text-white/70 text-xs text-center">
                  You can register a new account or use one you've created in your Supabase project.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
