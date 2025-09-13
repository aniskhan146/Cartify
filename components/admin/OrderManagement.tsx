import React, { useState, useEffect } from 'react';
import type { Order, OrderItem } from '../../types';
import { MoreVerticalIcon } from '../shared/icons';
import { fetchAllOrders, updateOrderStatus, deleteOrder } from '../../services/databaseService';
import { formatCurrency } from '../shared/utils';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';

type OrderWithUser = Order & { userId: string };

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<OrderWithUser[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<OrderWithUser | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        setIsLoadingData(true);
        fetchAllOrders()
            .then(fetchedOrders => {
                setOrders(fetchedOrders as OrderWithUser[]);
            })
            .catch(error => console.error("Failed to fetch all orders:", error))
            .finally(() => setIsLoadingData(false));
    }, []);

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
    
    const handleStatusChange = async (order: OrderWithUser, newStatus: Order['status']) => {
        setIsProcessing(true);
        try {
            await updateOrderStatus(order.userId, order.id, newStatus);
            setOrders(prevOrders => prevOrders.map(o => 
                o.id === order.id ? { ...o, status: newStatus } : o
            ));
        } catch(err) {
            console.error("Failed to update status:", err);
            addNotification("Failed to update order status.", 'error');
        } finally {
            setIsProcessing(false);
            setOpenActionMenu(null);
        }
    };
    
    const handleDeleteClick = (order: OrderWithUser) => {
        setOrderToDelete(order);
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleConfirmDelete = async () => {
        if (!orderToDelete) return;
        setIsProcessing(true);
        try {
            await deleteOrder(orderToDelete.userId, orderToDelete.id);
            setOrders(prevOrders => prevOrders.filter(o => o.id !== orderToDelete.id));
            setIsConfirmModalOpen(false);
            setOrderToDelete(null);
        } catch (err) {
            console.error("Failed to delete order:", err);
            addNotification("Failed to delete order.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
        setOpenActionMenu(null);
    };
    
    return (
        <>
        <ConfirmationModal 
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Order"
            message={`Are you sure you want to permanently delete order #${orderToDelete?.id.substring(0,8)}...? This action cannot be undone.`}
            isLoading={isProcessing}
        />
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            </div>

            <div className="bg-card rounded-lg shadow-sm overflow-x-auto border border-border">
                 {isLoadingData ? (
                     <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                <table className="w-full min-w-[700px] text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                        <tr>
                            <th scope="col" className="px-4 py-3">Order ID</th>
                            <th scope="col" className="px-4 py-3">Customer</th>
                            <th scope="col" className="px-4 py-3">Date</th>
                            <th scope="col" className="px-4 py-3">Total</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                             <React.Fragment key={order.id}>
                                <tr className="bg-card border-b border-border hover:bg-accent transition-colors duration-200">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{order.id.substring(0, 8)}...</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{order.customerName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(order.total)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="relative inline-block text-left">
                                            <button 
                                                onClick={() => setOpenActionMenu(openActionMenu === order.id ? null : order.id)}
                                                className="p-1 rounded-full hover:bg-muted"
                                            >
                                                <MoreVerticalIcon className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                            {openActionMenu === order.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                    <div className="py-1">
                                                        <button onClick={() => toggleOrderExpansion(order.id)} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                                                            View Details
                                                        </button>
                                                        {order.status === 'Pending' && (
                                                            <button onClick={() => handleStatusChange(order, 'Processed')} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                                                                Confirm Order
                                                            </button>
                                                        )}
                                                        {order.status === 'Processed' && (
                                                            <button onClick={() => handleStatusChange(order, 'Shipped')} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                                                                Mark as Shipped
                                                            </button>
                                                        )}
                                                        {order.status === 'Shipped' && (
                                                            <button onClick={() => handleStatusChange(order, 'Delivered')} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                                                                Mark as Delivered
                                                            </button>
                                                        )}
                                                        {order.status !== 'Canceled' && order.status !== 'Delivered' && (
                                                            <button onClick={() => handleStatusChange(order, 'Canceled')} className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                                                                Cancel Order
                                                            </button>
                                                        )}
                                                        <div className="border-t border-border my-1"></div>
                                                        <button onClick={() => handleDeleteClick(order)} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                                                            Delete Order
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedOrderId === order.id && (
                                    <tr className="bg-muted/50">
                                        <td colSpan={6} className="p-0">
                                            <div className="p-4 m-2 rounded-md" style={{animation: 'fadeIn 0.5s ease-out'}}>
                                                <h4 className="font-semibold text-foreground mb-3">Order Details:</h4>
                                                <ul className="space-y-3">
                                                    {order.items.map((item, index) => (
                                                        <li key={item.productId + item.variantName + index} className="flex items-center space-x-4 bg-background p-3 rounded-md border border-border">
                                                            <img src={item.productImage} alt={item.productName} loading="lazy" decoding="async" className="w-16 h-16 rounded-md object-cover bg-muted"/>
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
                                        </td>
                                    </tr>
                                )}
                             </React.Fragment>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </div>
        </>
    );
};

export default OrderManagement;