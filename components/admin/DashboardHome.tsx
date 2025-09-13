import React, { useState, useEffect, useMemo } from 'react';
import type { Order, Product, UserRoleInfo } from '../../types';
import { fetchAllOrders, onProductsValueChange, onAllUsersAndRolesValueChange } from '../../services/databaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../shared/utils';

const StatCard: React.FC<{ title: string; value: string; change?: string; isPositive?: boolean }> = ({ title, value, change, isPositive }) => (
    <div className="bg-card p-5 rounded-lg shadow-sm border border-border transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {change && (
            <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change} vs last month
            </p>
        )}
    </div>
);

// Placeholder data for the new chart
const acquisitionData = [
  { name: 'Organic Search', value: 400 },
  { name: 'Social Media', value: 300 },
  { name: 'Referral', value: 200 },
  { name: 'Email Campaign', value: 100 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const acquisitionTrendData = [
  { name: 'Jan', 'Organic': 120, 'Social': 90, 'Referral': 60 },
  { name: 'Feb', 'Organic': 130, 'Social': 110, 'Referral': 70 },
  { name: 'Mar', 'Organic': 150, 'Social': 100, 'Referral': 80 },
  { name: 'Apr', 'Organic': 140, 'Social': 120, 'Referral': 75 },
  { name: 'May', 'Organic': 160, 'Social': 130, 'Referral': 90 },
  { name: 'Jun', 'Organic': 180, 'Social': 140, 'Referral': 100 },
];

const DashboardHome: React.FC = () => {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        newCustomers: 0,
        inventoryValue: 0,
    });
    const [salesTrendData, setSalesTrendData] = useState<{name: string, revenue: number}[]>([]);

    useEffect(() => {
        setIsLoading(true);
        let isMounted = true;

        const fetchData = async () => {
            try {
                const allOrdersPromise = fetchAllOrders();
                
                const unsubProducts = onProductsValueChange(async (allProducts) => {
                    const allOrders = await allOrdersPromise;
                    if (!isMounted) return;

                    const sortedTopProducts = [...allProducts].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
                    setTopProducts(sortedTopProducts.slice(0, 5));

                    const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.variants || []).reduce((variantSum, v) => variantSum + v.price * v.stock, 0), 0);

                    const unsubUsers = onAllUsersAndRolesValueChange((allUsers) => {
                        if (!isMounted) return;
                        
                        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
                        
                        const monthlySales: { [key: string]: number } = {};
                        const monthOrder: string[] = [];
                        const now = new Date();

                        for (let i = 11; i >= 0; i--) {
                           const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                           const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                           monthlySales[monthKey] = 0;
                           monthOrder.push(monthKey);
                        }

                        allOrders.forEach(order => {
                            const orderDate = new Date(order.date);
                            const monthKey = orderDate.toLocaleString('default', { month: 'short', year: '2-digit' });
                            if (monthlySales.hasOwnProperty(monthKey)) {
                                monthlySales[monthKey] += order.total;
                            }
                        });

                        const trendData = monthOrder.map(month => ({
                            name: month,
                            revenue: monthlySales[month]
                        }));
                        setSalesTrendData(trendData);

                        setStats({
                            totalRevenue,
                            totalSales: allOrders.length,
                            newCustomers: allUsers.length,
                            inventoryValue: totalInventoryValue,
                        });

                        setRecentOrders(allOrders.slice(0, 5));
                        if (isLoading) setIsLoading(false);
                    });

                    return unsubUsers;
                });

                return async () => {
                    const unsubUsers = await unsubProducts;
                    if (unsubUsers) unsubUsers();
                };

            } catch (error) {
                console.error("Error fetching dashboard data: ", error);
                if (isMounted) setIsLoading(false);
            }
        };

        const cleanupPromise = fetchData();

        return () => {
            isMounted = false;
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-full">
            <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change="+20.1%" isPositive={true} />
                <StatCard title="Total Sales" value={stats.totalSales.toLocaleString()} change="+15.3%" isPositive={true} />
                <StatCard title="New Customers" value={stats.newCustomers.toLocaleString()} change="+5.2%" isPositive={true} />
                <StatCard title="Total Inventory Value" value={formatCurrency(stats.inventoryValue)} />
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-4">Sales Overview (Last 12 Months)</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                            <XAxis dataKey="name" stroke="hsl(0 0% 64%)" fontSize={12} />
                            <YAxis stroke="hsl(0 0% 64%)" fontSize={12} tickFormatter={(value) => `৳${Number(value) / 1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 6%)', border: '1px solid hsl(0 0% 18%)', borderRadius: '0.5rem' }} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(0 0% 98%)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-2">Customer Acquisition Channels</h2>
                <p className="text-xs text-muted-foreground text-center mb-4">Note: Acquisition data is for demonstration purposes.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h3 className="font-semibold text-foreground text-center mb-2">Channel Mix</h3>
                         <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={acquisitionData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                                        {acquisitionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 6%)', border: '1px solid hsl(0 0% 18%)', borderRadius: '0.5rem' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-foreground text-center mb-2">Acquisition Trend</h3>
                         <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={acquisitionTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                                    <XAxis dataKey="name" stroke="hsl(0 0% 64%)" fontSize={12} />
                                    <YAxis stroke="hsl(0 0% 64%)" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 6%)', border: '1px solid hsl(0 0% 18%)', borderRadius: '0.5rem' }} />
                                    <Legend />
                                    <Bar dataKey="Organic" stackId="a" fill={COLORS[0]} />
                                    <Bar dataKey="Social" stackId="a" fill={COLORS[1]} />
                                    <Bar dataKey="Referral" stackId="a" fill={COLORS[2]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                    <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-muted-foreground">
                            <thead className="text-xs text-foreground uppercase bg-muted">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Order ID</th>
                                    <th scope="col" className="px-6 py-3">Customer</th>
                                    <th scope="col" className="px-6 py-3">Total</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id} className="bg-card border-b border-border last:border-b-0">
                                        <td className="px-6 py-4 font-medium text-foreground truncate" title={order.id}>{order.id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4">{order.customerName}</td>
                                        <td className="px-6 py-4">{formatCurrency(order.total)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                                                order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-400' :
                                                order.status === 'Processed' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                order.status === 'Canceled' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>{order.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                    <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
                    <ul className="space-y-4">
                        {topProducts.map(p => (
                            <li key={p.id} className="flex items-center space-x-3">
                                <img src={p.imageUrls?.[0] || ''} alt={p.name} className="w-10 h-10 rounded-md object-cover bg-muted" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.category}</p>
                                </div>
                                <p className="font-semibold text-sm">{formatCurrency(p.variants?.[0]?.price ?? 0)}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;