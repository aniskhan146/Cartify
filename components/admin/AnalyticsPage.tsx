import React, { useState, useEffect } from 'react';
import { fetchAllOrders, onProductsValueChange, onAllUsersAndRolesValueChange } from '../../services/databaseService';
import type { Order, Product, UserRoleInfo } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatCurrency } from '../shared/utils';

interface CategorySalesData {
    name: string;
    value: number;
}

interface InventoryValueData {
    name: string;
    value: number;
}

interface CustomerTrendData {
    name: string;
    customers: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733'];

const AnalyticsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [salesByCategory, setSalesByCategory] = useState<CategorySalesData[]>([]);
    const [inventoryValue, setInventoryValue] = useState<InventoryValueData[]>([]);
    const [customerTrend, setCustomerTrend] = useState<CustomerTrendData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all data concurrently
                const [allOrders, allProducts, allUsers] = await Promise.all([
                    fetchAllOrders(),
                    new Promise<Product[]>((resolve) => onProductsValueChange(resolve)),
                    new Promise<UserRoleInfo[]>((resolve) => onAllUsersAndRolesValueChange(resolve))
                ]);

                // 1. Process Sales by Category
                const productMap = new Map(allProducts.map(p => [p.id, p]));
                const categorySales: { [key: string]: number } = {};
                allOrders.forEach(order => {
                    order.items.forEach(item => {
                        // FIX: Property 'product' does not exist on type 'OrderItem'. Look up product details from allProducts.
                        const productDetails = productMap.get(item.productId);
                        if (productDetails) {
                            const category = productDetails.category;
                            // FIX: Property 'product' does not exist on type 'OrderItem'. Use 'variantPrice' from OrderItem.
                            const itemTotal = item.variantPrice * item.quantity;
                            categorySales[category] = (categorySales[category] || 0) + itemTotal;
                        }
                    });
                });
                const salesData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));
                setSalesByCategory(salesData);

                // 2. Process Inventory Value by Category
                const categoryInventory: { [key: string]: number } = {};
                allProducts.forEach(product => {
                    // FIX: Property 'price' and 'stock' do not exist on type 'Product'. Calculate value from variants.
                    const value = product.variants.reduce((sum, v) => sum + v.price * v.stock, 0);
                    categoryInventory[product.category] = (categoryInventory[product.category] || 0) + value;
                });
                const inventoryData = Object.entries(categoryInventory).map(([name, value]) => ({ name, value }));
                setInventoryValue(inventoryData);
                
                // 3. Process Customer Acquisition Trend (using mock dates as not stored)
                // In a real app, you would use the user's registration timestamp.
                const trendData: CustomerTrendData[] = [
                    { name: 'Jan', customers: 12 }, { name: 'Feb', customers: 19 },
                    { name: 'Mar', customers: 31 }, { name: 'Apr', customers: 45 },
                    { name: 'May', customers: 53 }, { name: 'Jun', customers: 68 },
                    { name: 'Jul', customers: allUsers.length },
                ];
                setCustomerTrend(trendData);


            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background p-2 border border-border rounded-md shadow-lg">
            <p className="label font-bold text-foreground">{`${label}`}</p>
            <p className="intro text-muted-foreground">{`Value: ${payload[0].dataKey === 'customers' ? payload[0].value : formatCurrency(payload[0].value)}`}</p>
          </div>
        );
      }
      return null;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-5 rounded-lg shadow-sm border border-border transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">Sales by Category</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={salesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                                    {salesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-card p-5 rounded-lg shadow-sm border border-border transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">Customer Acquisition Trend</h2>
                    <div style={{ width: '100%', height: 300 }}>
                         <ResponsiveContainer>
                            <LineChart data={customerTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                                <XAxis dataKey="name" stroke="hsl(0 0% 64%)" fontSize={12} />
                                <YAxis stroke="hsl(0 0% 64%)" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="customers" stroke="#00C49F" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-card p-5 rounded-lg shadow-sm border border-border transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Inventory Value by Category</h2>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={inventoryValue} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                            <XAxis type="number" stroke="hsl(0 0% 64%)" fontSize={12} tickFormatter={(value) => `৳${Number(value) / 1000}k`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(0 0% 64%)" fontSize={12} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="value" name="Inventory Value" fill="#AF19FF" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
