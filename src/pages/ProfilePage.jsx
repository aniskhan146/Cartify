import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { useToast } from '../components/ui/use-toast.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { User, Lock, ShoppingBag, Heart, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isNameLoading, setIsNameLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [user, isLoading, navigate]);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsNameLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating name', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Your name has been updated.' });
      refreshUser(); // Refresh user data in context
    }
    setIsNameLoading(false);
  };
  
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
        toast({ variant: 'destructive', title: 'Password too short', description: 'Password should be at least 6 characters.' });
        return;
    }

    setIsPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating password', description: error.message });
    } else {
      toast({ title: 'Success!', description: 'Your password has been updated.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsPasswordLoading(false);
  };
  
  const handleWishlistClick = () => {
    toast({
      title: "🚧 Wishlist Page Coming Soon!",
      description: "Thanks for your patience while we build this feature.",
    });
  };

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 text-white animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile - AYExpress</title>
        <meta name="description" content="Manage your account details at AYExpress." />
      </Helmet>
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-white/70">Manage your account settings and view your activity.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Forms */}
            <div className="md:col-span-2 space-y-8">
              {/* Profile Information Form */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <User className="text-purple-300"/>
                  Personal Information
                </h2>
                <form onSubmit={handleNameUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={user.email} disabled className="bg-white/5" />
                     <p className="text-xs text-white/50">Email address cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="text-right">
                    <Button type="submit" disabled={isNameLoading}>
                      {isNameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Name
                    </Button>
                  </div>
                </form>
              </motion.div>

              {/* Change Password Form */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Lock className="text-purple-300"/>
                  Change Password
                </h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                    </div>
                  <div className="text-right">
                    <Button type="submit" disabled={isPasswordLoading}>
                      {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Right Column: Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <div className="glass-effect rounded-2xl p-8 text-center h-full flex flex-col justify-center">
                 <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
                 <div className="space-y-4">
                     <Link to="/orders" className="block">
                         <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 py-6 text-base">
                             <ShoppingBag className="mr-3" />
                             My Order History
                         </Button>
                     </Link>
                     <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 py-6 text-base" onClick={handleWishlistClick}>
                        <Heart className="mr-3"/>
                         My Wishlist
                     </Button>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;