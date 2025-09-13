import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Order } from '../../types';
import { ChevronDownIcon, LogOutIcon } from '../shared/icons';
import { onUserOrdersValueChange } from '../../services/databaseService';
import { formatCurrency } from '../shared/utils';
import BorderBeam from './BorderBeam';
import { useNotification } from '../../contexts/NotificationContext';

interface ProfilePageProps {
  onBackToShop: () => void;
}

const getStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'bg-green-500/20 text-green-400';
        case 'Shipped': return 'bg-blue-500/20 text-blue-400';
        case 'Processed': return 'bg-yellow-500/20 text-yellow-400';
        case 'Pending': return 'bg-gray-500/20 text-gray-400';
        case 'Canceled': return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const ProfilePage: React.FC<ProfilePageProps> = ({ onBackToShop }) => {
  const { currentUser, userProfile, logout, changePassword, updateProfile } = useAuth();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // State for profile info form
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotionalOffers: false,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State for password change form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (currentUser) {
        setIsLoadingOrders(true);
        const unsubscribe = onUserOrdersValueChange(currentUser.id, (orders) => {
            const sortedOrders = orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setUserOrders(sortedOrders);
            setIsLoadingOrders(false);
        });
        return () => unsubscribe();
    } else {
        setIsLoadingOrders(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
        setDisplayName(userProfile?.displayName || currentUser.user_metadata.displayName || '');
    }
  }, [currentUser, userProfile]);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    // Here you would also save notification preferences if they were stored in the backend
    const { error } = await updateProfile({ displayName });
    if (error) {
        addNotification(error.message, 'error');
    } else {
        addNotification('Profile updated successfully!', 'success');
    }
    setIsSavingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
    }
    if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
        return;
    }

    setIsChangingPassword(true);
    const { error } = await changePassword(newPassword);
    if (error) {
        setPasswordError(error.message);
    } else {
        addNotification("Password changed successfully!", 'success');
        setNewPassword('');
        setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };
  
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
  }

  const handleLogout = async () => {
    try {
        await logout();
        onBackToShop(); // Redirect to home after logout
    } catch(error) {
        console.error("Failed to log out", error);
        addNotification("Failed to log out. Please try again.", "error");
    }
  }

  const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void; description: string; }> = ({ label, enabled, onToggle, description }) => (
    <div className="flex items-center justify-between py-4">
        <div>
            <label className="font-medium text-foreground">{label}</label>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button
            type="button"
            onClick={onToggle}
            className={`${
            enabled ? 'bg-primary' : 'bg-muted'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card`}
            role="switch"
            aria-checked={enabled}
        >
            <span
            aria-hidden="true"
            className={`${
                enabled ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
  );

  return (
    <div className="bg-background py-12 min-h-[60vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 text-center">My Profile</h1>
        
        <div className="space-y-8">
            <div className="relative bg-card p-6 rounded-lg shadow-sm border border-border overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Order History</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {isLoadingOrders ? (
                         <div className="flex justify-center items-center py-8"><div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                    ) : userOrders.length > 0 ? (
                        userOrders.map(order => (
                           <div key={order.id} className="border-b border-border last:border-b-0">
                                <button onClick={() => toggleOrderExpansion(order.id)} className="w-full text-left py-4">
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 items-center">
                                        <div className="col-span-2 md:col-span-1">
                                            <p className="font-semibold text-foreground text-sm truncate">{order.id}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-muted-foreground text-sm">Total</p>
                                            <p className="font-medium">{formatCurrency(order.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-sm">Status</p>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                                        </div>
                                        <div className="flex justify-end">
                                            <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </button>
                                {expandedOrderId === order.id && (
                                    <div className="pb-4 pt-2 px-2">
                                        <h4 className="font-semibold mb-3">Items in this order:</h4>
                                        <ul className="space-y-3">
                                            {order.items.map((item, index) => (
                                                <li key={item.productId + index} className="flex items-center space-x-4 bg-muted p-3 rounded-md">
                                                    <img src={item.productImage} alt={item.productName} loading="lazy" decoding="async" className="w-16 h-16 rounded-md object-cover bg-background"/>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground text-sm">{item.productName}</p>
                                                        <p className="text-xs text-muted-foreground">Variant: {item.variantName}</p>
                                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-semibold text-sm">{formatCurrency(item.variantPrice * item.quantity)}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                           </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">You have no past orders.</p>
                    )}
                </div>
                <BorderBeam size={250} duration={8} delay={0} />
            </div>

            <form onSubmit={handleProfileSave} className="relative bg-card p-6 rounded-lg shadow-sm border border-border overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Account Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-muted-foreground mb-1">Display Name</label>
                        <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
                        <input type="email" value={currentUser?.email || ''} disabled className="w-full p-2 border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"/>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2 border-b border-border pb-3">Notification Preferences</h3>
                <div className="divide-y divide-border">
                    <ToggleSwitch
                        label="Order Updates"
                        description="Receive email notifications about your order status."
                        enabled={notifications.orderUpdates}
                        onToggle={() => handleToggle('orderUpdates')}
                    />
                    <ToggleSwitch
                        label="Promotional Offers"
                        description="Receive emails about new products, sales, and special offers."
                        enabled={notifications.promotionalOffers}
                        onToggle={() => handleToggle('promotionalOffers')}
                    />
                </div>
                <div className="flex items-center justify-end mt-6">
                    <button type="submit" disabled={isSavingProfile} className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                <BorderBeam size={250} duration={8} delay={1} />
            </form>

            <form onSubmit={handlePasswordChange} className="relative bg-card p-6 rounded-lg shadow-sm border border-border overflow-hidden">
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Change Password</h2>
                {passwordError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{passwordError}</p>}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
                        <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full p-2 border border-input rounded-md bg-background"/>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">Confirm New Password</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full p-2 border border-input rounded-md bg-background"/>
                    </div>
                </div>
                 <div className="flex items-center justify-end mt-6">
                    <button type="submit" disabled={isChangingPassword} className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
                <BorderBeam size={250} duration={8} delay={2} />
            </form>

             <div className="mt-8">
                 <button type="button" onClick={handleLogout} className="w-full text-destructive-foreground bg-destructive/90 hover:bg-destructive py-2.5 rounded-md font-semibold transition-colors flex items-center justify-center space-x-2">
                    <LogOutIcon className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;