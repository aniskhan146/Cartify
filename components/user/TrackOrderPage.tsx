import React, { useState } from 'react';
import { findOrderById } from '../../services/databaseService';
import type { Order } from '../../types';
import { formatCurrency } from '../shared/utils';
import { SearchIcon, ClockIcon, CogIcon, TruckIcon, PackageCheckIcon } from '../shared/icons';
import { cn } from '../../lib/utils';
import BorderBeam from './BorderBeam';

interface TrackOrderPageProps {
  onBackToShop: () => void;
}

const statusSteps: { name: Order['status']; icon: React.FC<any> }[] = [
    { name: 'Pending', icon: ClockIcon },
    { name: 'Processed', icon: CogIcon },
    { name: 'Shipped', icon: TruckIcon },
    { name: 'Delivered', icon: PackageCheckIcon },
];

const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onBackToShop }) => {
    const [orderIdInput, setOrderIdInput] = useState('');
    const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchMessage, setSearchMessage] = useState('');
    const [searchAttempted, setSearchAttempted] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderIdInput.trim()) return;

        setIsLoading(true);
        setSearchMessage('');
        setSearchedOrder(null);
        setSearchAttempted(true);

        try {
            const foundOrder = await findOrderById(orderIdInput.trim());
            if (foundOrder) {
                setSearchedOrder(foundOrder);
            } else {
                setSearchMessage('No order found with that ID. Please check the ID and try again.');
            }
        } catch (error) {
            setSearchMessage('An error occurred while searching for your order. Please try again later.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentStatusIndex = searchedOrder ? statusSteps.findIndex(step => step.name === searchedOrder.status) : -1;

    return (
        <div className="bg-background py-12 min-h-[60vh]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <button onClick={onBackToShop} className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
                    &larr; Back to shop
                </button>

                <div className="text-center">
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Track Your Order</h1>
                    <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                        Enter your Order ID below to check its status. You can find the ID in your order confirmation email.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="mt-8 max-w-lg mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={orderIdInput}
                            onChange={(e) => setOrderIdInput(e.target.value)}
                            placeholder="Enter your Order ID (e.g., -O5aBcDeFgHiJkLmN)"
                            className="w-full pl-4 pr-28 py-3 bg-card border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground py-2 px-6 rounded-full font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <SearchIcon className="h-5 w-5 mr-2" />
                                    Track
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-10">
                    {searchAttempted && !searchedOrder && !isLoading && (
                        <div className="text-center bg-card border border-border p-8 rounded-lg">
                            <p className="text-muted-foreground">{searchMessage}</p>
                        </div>
                    )}

                    {searchedOrder && (
                        <div className="relative bg-card border border-border p-6 rounded-lg shadow-sm overflow-hidden animate-in fade-in-50">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-1">Order Status</h2>
                                <p className="text-sm text-muted-foreground">Order ID: <span className="font-mono">{searchedOrder.id}</span></p>
                            </div>

                            <div className="relative flex justify-between items-center mb-10 px-2">
                                {statusSteps.map((step, index) => {
                                    const isCompleted = index <= currentStatusIndex;
                                    const isActive = index === currentStatusIndex;

                                    return (
                                        <div key={step.name} className="relative z-10 flex flex-col items-center text-center w-24">
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                                isCompleted ? "bg-primary border-primary" : "bg-muted border-border"
                                            )}>
                                                <step.icon className={cn("h-6 w-6", isCompleted ? "text-primary-foreground" : "text-muted-foreground")} />
                                            </div>
                                            <p className={cn(
                                                "mt-2 text-xs font-semibold",
                                                isActive ? "text-primary" : "text-muted-foreground"
                                            )}>{step.name}</p>
                                        </div>
                                    );
                                })}
                                <div className="absolute top-6 left-0 w-full h-0.5 bg-border -translate-y-1/2">
                                    <div 
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                             <div className="border-t border-border pt-6">
                                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                                <div className="space-y-3">
                                    {/* FIX: Property 'product' does not exist on type 'OrderItem'. Use direct properties from the item. */}
                                    {searchedOrder.items.map((item, index) => (
                                        <div key={item.productId + index} className="flex items-center space-x-4 bg-muted p-3 rounded-md">
                                            {/* FIX: Property 'product' does not exist on type 'OrderItem'. Use 'productImage'. */}
                                            <img src={item.productImage} alt={item.productName} className="w-16 h-16 rounded-md object-cover bg-background"/>
                                            <div className="flex-1">
                                                {/* FIX: Property 'product' does not exist on type 'OrderItem'. Use 'productName'. */}
                                                <p className="font-medium text-foreground text-sm">{item.productName}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            {/* FIX: Property 'product' does not exist on type 'OrderItem'. Use 'variantPrice'. */}
                                            <p className="font-semibold text-sm">{formatCurrency(item.variantPrice * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                     <div className="text-right text-sm">
                                        <p>Date Placed: <span className="font-medium">{new Date(searchedOrder.date).toLocaleDateString()}</span></p>
                                        <p className="text-lg font-bold">Total: <span className="text-primary">{formatCurrency(searchedOrder.total)}</span></p>
                                     </div>
                                </div>
                            </div>
                            <BorderBeam size={200} duration={8} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackOrderPage;
