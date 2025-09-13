import React, { useState, useEffect } from 'react';
import { fetchOrderById } from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import type { Order } from '../../types';
import { formatCurrency } from '../shared/utils';
import { CheckIcon } from '../shared/icons';
import BorderBeam from './BorderBeam';

interface OrderConfirmationPageProps {
  orderId: string;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderId, onContinueShopping, onTrackOrder }) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setError("You must be logged in to view this page.");
            setIsLoading(false);
            return;
        }

        const loadOrder = async () => {
            setIsLoading(true);
            try {
                const fetchedOrder = await fetchOrderById(currentUser.id, orderId);
                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                } else {
                    setError("Could not find the specified order.");
                }
            } catch (err) {
                setError("An error occurred while fetching your order details.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [orderId, currentUser]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh] bg-background">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="text-center py-20 bg-background min-h-[60vh] flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <button onClick={onContinueShopping} className="mt-6 bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Back to Shop
                </button>
            </div>
        );
    }

    if (!order) {
        return null; // Should be handled by error state
    }

    return (
        <div className="bg-background py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <div className="relative bg-card border border-border p-8 rounded-lg shadow-lg overflow-hidden text-center">
                     <div className="mx-auto bg-green-500 rounded-full h-16 w-16 flex items-center justify-center mb-6">
                        <CheckIcon className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Thank You For Your Order!</h1>
                    <p className="text-muted-foreground mt-2">
                        Your order has been placed successfully. A confirmation email has been sent to you.
                    </p>
                    
                    <div className="text-left mt-8 border-t border-border pt-6 space-y-4">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">Order Summary</h2>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono text-foreground">{order.id}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Order Date:</span>
                            <span className="font-medium text-foreground">{new Date(order.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Order Total:</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium text-foreground bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">{order.status}</span>
                        </div>
                    </div>

                    <div className="text-left mt-6 border-t border-border pt-6">
                        <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
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

                     <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={onContinueShopping} className="bg-secondary text-secondary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-accent transition-colors">
                            Continue Shopping
                        </button>
                        <button onClick={onTrackOrder} className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            Track Your Order
                        </button>
                    </div>

                    <BorderBeam size={250} duration={10} delay={2} />
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;