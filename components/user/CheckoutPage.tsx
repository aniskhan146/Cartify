import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { placeOrder, onCheckoutConfigChange } from '../../services/databaseService';
import { formatCurrency } from '../shared/utils';
import type { Order, CheckoutConfig, OrderItem } from '../../types';
import { UserIcon } from '../shared/icons';
import { useNotification } from '../../contexts/NotificationContext';

interface CheckoutPageProps {
  onBackToShop: () => void;
  onOrderPlaced: (orderId: string) => void;
  onLoginClick: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToShop, onOrderPlaced, onLoginClick }) => {
    const { cartItems, cartItemCount, removeFromCart, updateItemQuantity } = useCart();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    const [shippingInfo, setShippingInfo] = useState({ name: '', email: '', phone: '', address: '' });
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(null);
    const [shippingLocation, setShippingLocation] = useState<'inside' | 'outside'>('inside');

    useEffect(() => {
        if (currentUser) {
            setShippingInfo(prev => ({ 
                ...prev, 
                email: currentUser.email || '',
                name: currentUser.user_metadata.displayName || prev.name
            }));
        }
    }, [currentUser]);

    useEffect(() => {
        const unsubscribe = onCheckoutConfigChange(setCheckoutConfig);
        return () => unsubscribe();
    }, []);

    const subtotal = cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
    const shipping = subtotal > 0
        ? (shippingLocation === 'inside'
            ? (checkoutConfig?.shippingChargeInsideDhaka ?? 0)
            : (checkoutConfig?.shippingChargeOutsideDhaka ?? 0))
        : 0;
    const tax = subtotal > 0 ? (checkoutConfig?.taxAmount ?? 0) : 0;
    const total = subtotal + shipping + tax;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            addNotification("Please log in to place an order.", "error");
            onLoginClick();
            return;
        }

        setIsPlacingOrder(true);
        
        const orderItems: OrderItem[] = cartItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            variantName: item.variant.name,
            variantPrice: item.variant.price,
            quantity: item.quantity,
        }));

        const orderData: Omit<Order, 'id'> = {
            customerName: shippingInfo.name || 'Customer',
            date: new Date().toISOString(),
            total: total,
            status: 'Pending',
            items: orderItems,
        };

        try {
            const newOrderId = await placeOrder(currentUser.id, orderData);
            setIsPlacingOrder(false);
            onOrderPlaced(newOrderId);
        } catch (err) {
            console.error("Failed to place order:", err);
            addNotification("There was an issue placing your order. Please try again.", "error");
            setIsPlacingOrder(false);
        }
    };
    
    if (cartItemCount === 0) {
        return (
            <div className="text-center py-20 bg-background min-h-[60vh] flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
                <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
                <button onClick={onBackToShop} className="mt-6 bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Continue Shopping
                </button>
            </div>
        );
    }

    if (checkoutConfig === null) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const OrderTotals = () => (
        <ul className="text-gray-800 dark:text-gray-200 mt-6 space-y-3">
            <li className="flex flex-wrap gap-4 text-sm">Subtotal <span className="ml-auto font-bold">{formatCurrency(subtotal)}</span></li>
            <li className="flex flex-wrap gap-4 text-sm">Shipping <span className="ml-auto font-bold">{formatCurrency(shipping)}</span></li>
            <li className="flex flex-wrap gap-4 text-sm">Tax <span className="ml-auto font-bold">{formatCurrency(tax)}</span></li>
            <hr className="border-gray-300 dark:border-gray-700" />
            <li className="flex flex-wrap gap-4 text-sm font-bold">Total <span className="ml-auto">{formatCurrency(total)}</span></li>
        </ul>
    );

    return (
        <div className="md:px-4 max-w-5xl max-md:max-w-xl mx-auto bg-background py-4 font-primarylw">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">Cart Checkout</h1>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="md:col-span-2 space-y-4">
                     {cartItems.map((item, index) => (
                        <React.Fragment key={item.productId + item.variant.id}>
                            <div className="grid grid-cols-3 items-start gap-4">
                                <div className="col-span-2 flex items-start gap-4">
                                    <div className="w-24 h-24 shrink-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-2 rounded-md">
                                        <img src={item.productImage} alt={item.productName} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.productName}</h3>
                                        <p className="text-xs font-semibold text-gray-500 mt-0.5">{item.variant.name}</p>
                                        <button type="button" onClick={() => removeFromCart(item.productId, item.variant.id)} className="mt-4 font-semibold text-red-500 text-xs flex items-center gap-1 shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 fill-current inline" viewBox="0 0 24 24">
                                                <path d="M19 7a1 1 0 0 0-1 1v11.191A1.92 1.92 0 0 1 15.99 21H8.01A1.92 1.92 0 0 1 6 19.191V8a1 1 0 0 0-2 0v11.191A3.918 3.918 0 0 0 8.01 23h7.98A3.918 3.918 0 0 0 20 19.191V8a1 1 0 0 0-1-1Zm1-3h-4V2a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2ZM10 4V3h4v1Z" data-original="#000000"></path>
                                                <path d="M11 17v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Zm4 0v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Z" data-original="#000000"></path>
                                            </svg>
                                            REMOVE
                                        </button>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.variant.price * item.quantity)}</h4>
                                    <div className="mt-4 flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs outline-none bg-transparent rounded-md">
                                        <button type="button" onClick={() => updateItemQuantity(item.productId, item.variant.id, item.quantity - 1)} className="px-1 disabled:opacity-50" disabled={item.quantity <= 1}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 fill-current" viewBox="0 0 124 124"><path d="M112 50H12C5.4 50 0 55.4 0 62s5.4 12 12 12h100c6.6 0 12-5.4 12-12s-5.4-12-12-12z" data-original="#000000"></path></svg>
                                        </button>
                                        <span className="mx-3 font-bold">{item.quantity}</span>
                                        <button type="button" onClick={() => updateItemQuantity(item.productId, item.variant.id, item.quantity + 1)} className="px-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 fill-current" viewBox="0 0 42 42"><path d="M37.059 16H26V4.941C26 2.224 23.718 0 21 0s-5 2.224-5 4.941V16H4.941C2.224 16 0 18.282 0 21s2.224 5 4.941 5H16v11.059C16 39.776 18.282 42 21 42s5-2.224 5-4.941V26h11.059C39.776 26 42 23.718 42 21s-2.224-5-4.941-5z" data-original="#000000"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                           {index < cartItems.length - 1 && <hr className="border-gray-300 dark:border-gray-700" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-md p-4 h-max">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-700 pb-2">Order Summary</h3>
                    
                    {currentUser ? (
                        <form className="mt-6" onSubmit={handlePlaceOrder}>
                            <div>
                                <h3 className="text-base text-gray-800 dark:text-gray-200  font-semibold mb-4">Shipping Details</h3>
                                <div className="space-y-3">
                                    <input name="name" type="text" placeholder="Full Name" required value={shippingInfo.name} onChange={handleInputChange} className="block w-full rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-2 shadow-sm outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-black focus:ring-offset-1 text-sm" />
                                    <input name="email" type="email" placeholder="Email" required value={shippingInfo.email} onChange={handleInputChange} readOnly={!!currentUser} className={`block w-full rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-2 shadow-sm outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-black focus:ring-offset-1 text-sm ${!!currentUser ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`} />
                                    <input name="phone" type="tel" placeholder="Phone No." required value={shippingInfo.phone} onChange={handleInputChange} className="block w-full rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-2 shadow-sm outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-black focus:ring-offset-1 text-sm" />
                                    <textarea name="address" placeholder="Address" required value={shippingInfo.address} onChange={handleInputChange} className="block w-full rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-2 shadow-sm outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-black focus:ring-offset-1 text-sm"></textarea>
                                </div>
                            </div>
                             <div className="mt-6">
                                <h3 className="text-base text-gray-800 dark:text-gray-200 font-semibold mb-2">Shipping Method</h3>
                                <div className="space-y-2 rounded-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-3">
                                    <label className="flex items-center gap-4 cursor-pointer">
                                        <input type="radio" name="shipping" className="size-4" checked={shippingLocation === 'inside'} onChange={() => setShippingLocation('inside')} />
                                        <div className="w-full flex justify-between">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Inside Dhaka</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(checkoutConfig?.shippingChargeInsideDhaka ?? 0)}</p>
                                        </div>
                                    </label>
                                    <hr className="border-gray-300 dark:border-gray-700" />
                                    <label className="flex items-center gap-4 cursor-pointer">
                                        <input type="radio" name="shipping" className="size-4" checked={shippingLocation === 'outside'} onChange={() => setShippingLocation('outside')} />
                                        <div className="w-full flex justify-between">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Outside Dhaka</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(checkoutConfig?.shippingChargeOutsideDhaka ?? 0)}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <OrderTotals />
                            <div className="mt-6 space-y-3">
                                <button type="submit" disabled={isPlacingOrder} className="flex items-center justify-center gap-1 text-sm px-4 py-2 w-full font-semibold tracking-wide bg-darklw dark:bg-white text-white dark:text-black hover:bg-gray-900 rounded-md disabled:opacity-70">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                                    {isPlacingOrder ? 'Processing...' : 'Place Order'}
                                </button>
                                <button type="button" onClick={onBackToShop} className="flex items-center justify-center gap-1 text-sm px-4 py-2 w-full font-semibold tracking-wide bg-transparent text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                    Continue Shopping
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-6">
                             <div className="text-center bg-muted/50 dark:bg-muted/20 p-6 rounded-lg border border-border">
                                <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="text-lg font-semibold text-foreground">Login to Continue</h4>
                                <p className="text-sm text-muted-foreground mt-2 mb-6">Please log in or create an account to complete your purchase.</p>
                                <button
                                    onClick={onLoginClick}
                                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Login / Sign Up
                                </button>
                            </div>
                            <OrderTotals />
                             <div className="mt-6 space-y-3">
                                <button type="button" onClick={onBackToShop} className="flex items-center justify-center gap-1 text-sm px-4 py-2 w-full font-semibold tracking-wide bg-transparent text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;