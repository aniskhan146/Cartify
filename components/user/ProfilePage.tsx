import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Order, Product } from '../../types';
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
  const { currentUser, logout } = useAuth();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotionalOffers: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (currentUser) {
        setIsLoadingOrders(true);
        const unsubscribe = onUserOrdersValueChange(currentUser.uid, (orders) => {
            const sortedOrders = orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setUserOrders(sortedOrders);
            setIsLoadingOrders(false);
        });
        return () => unsubscribe();
    } else {
        setIsLoadingOrders(false);
    }
  }, [currentUser]);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    // Simulate API call
    setTimeout(() => {
        setIsSaving(false);
        setSaveMessage('Preferences saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
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
                <div className="space-y-3">
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
                                                    <img src={item.productImage} alt={item.productName} className="w-16 h-16 rounded-md object-cover bg-background"/>
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

            <form onSubmit={handleSaveChanges}>
                <div className="relative bg-card p-6 rounded-lg shadow-sm border border-border mb-8 overflow-hidden">
                    <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Account Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium text-foreground">{currentUser?.email || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Password:</span>
                            <button type="button" className="text-sm text-primary hover:underline">Change Password</button>
                        </div>
                        <div className="pt-2">
                             <button type="button" onClick={handleLogout} className="w-full text-destructive-foreground bg-destructive/90 hover:bg-destructive py-2 rounded-md font-semibold transition-colors flex items-center justify-center space-x-2">
                                <LogOutIcon className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                    <BorderBeam size={250} duration={8} delay={1} />
                </div>

                <div className="relative bg-card p-6 rounded-lg shadow-sm border border-border overflow-hidden">
                    <h2 className="text-xl font-semibold mb-2 border-b border-border pb-3">Notification Preferences</h2>
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
                    <BorderBeam size={250} duration={8} delay={2} />
                </div>
                
                <div className="flex items-center justify-end space-x-4 mt-8">
                     {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;