import express from 'express';
import { dbUtils } from '../models/database.js';

const router = express.Router();

// GET /api/analytics/dashboard - Get dashboard overview
router.get('/dashboard', (req, res) => {
    try {
        const orders = dbUtils.getAllOrders();
        const customers = dbUtils.getAllCustomers();
        const products = dbUtils.getAllProducts();

        // Calculate key metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalCustomers = customers.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        // Recent orders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = orders.filter(order => 
            new Date(order.createdAt) >= sevenDaysAgo
        );

        // Top products by sales
        const productSales = orders.reduce((acc, order) => {
            const key = order.productId;
            if (!acc[key]) {
                acc[key] = {
                    productId: order.productId,
                    productName: order.productName,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    orderCount: 0
                };
            }
            acc[key].totalQuantity += order.quantity;
            acc[key].totalRevenue += order.totalAmount;
            acc[key].orderCount += 1;
            return acc;
        }, {});

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // Low stock products
        const lowStockProducts = products.filter(product => product.stock < 10);

        res.json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalRevenue,
                    totalCustomers,
                    averageOrderValue,
                    totalProducts: products.length
                },
                ordersByStatus,
                recentActivity: {
                    ordersLast7Days: recentOrders.length,
                    revenueLast7Days: recentOrders.reduce((sum, order) => sum + order.totalAmount, 0)
                },
                topProducts,
                lowStockProducts: lowStockProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    stock: p.stock,
                    category: p.category
                })),
                alerts: {
                    lowStock: lowStockProducts.length,
                    pendingOrders: ordersByStatus.pending || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
});

// GET /api/analytics/sales - Get sales analytics
router.get('/sales', (req, res) => {
    try {
        const { period = 'month', startDate, endDate } = req.query;
        let orders = dbUtils.getAllOrders();

        // Filter by date range if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            orders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Group sales by period
        const salesByPeriod = {};
        const revenueByPeriod = {};

        orders.forEach(order => {
            const date = new Date(order.createdAt);
            let key;

            switch (period) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            salesByPeriod[key] = (salesByPeriod[key] || 0) + 1;
            revenueByPeriod[key] = (revenueByPeriod[key] || 0) + order.totalAmount;
        });

        // Calculate growth rates
        const periods = Object.keys(salesByPeriod).sort();
        const currentPeriod = periods[periods.length - 1];
        const previousPeriod = periods[periods.length - 2];

        const currentSales = salesByPeriod[currentPeriod] || 0;
        const previousSales = salesByPeriod[previousPeriod] || 0;
        const salesGrowth = previousSales > 0 ? 
            ((currentSales - previousSales) / previousSales) * 100 : 0;

        const currentRevenue = revenueByPeriod[currentPeriod] || 0;
        const previousRevenue = revenueByPeriod[previousPeriod] || 0;
        const revenueGrowth = previousRevenue > 0 ? 
            ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        res.json({
            success: true,
            data: {
                period,
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
                averageOrderValue: orders.length > 0 ? 
                    orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
                salesByPeriod,
                revenueByPeriod,
                growth: {
                    sales: salesGrowth,
                    revenue: revenueGrowth
                },
                dateRange: {
                    start: startDate || (orders.length > 0 ? orders[0].createdAt : null),
                    end: endDate || new Date().toISOString()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales analytics',
            message: error.message
        });
    }
});

// GET /api/analytics/products - Get product analytics
router.get('/products', (req, res) => {
    try {
        const orders = dbUtils.getAllOrders();
        const products = dbUtils.getAllProducts();
        const productViews = dbUtils.getProductViews();

        // Product performance metrics
        const productMetrics = products.map(product => {
            const productOrders = orders.filter(order => order.productId === product.id);
            const totalSold = productOrders.reduce((sum, order) => sum + order.quantity, 0);
            const totalRevenue = productOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const views = productViews[product.id] || 0;
            const conversionRate = views > 0 ? (productOrders.length / views) * 100 : 0;

            return {
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                totalSold,
                totalRevenue,
                orderCount: productOrders.length,
                views,
                conversionRate,
                averageOrderQuantity: productOrders.length > 0 ? totalSold / productOrders.length : 0,
                stockTurnover: product.stock > 0 ? totalSold / (product.stock + totalSold) : 0
            };
        });

        // Sort by different metrics
        const topByRevenue = [...productMetrics].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const topByQuantity = [...productMetrics].sort((a, b) => b.totalSold - a.totalSold);
        const topByViews = [...productMetrics].sort((a, b) => b.views - a.views);
        const topByConversion = [...productMetrics].sort((a, b) => b.conversionRate - a.conversionRate);

        // Category analysis
        const categoryMetrics = {};
        productMetrics.forEach(product => {
            if (!categoryMetrics[product.category]) {
                categoryMetrics[product.category] = {
                    category: product.category,
                    productCount: 0,
                    totalRevenue: 0,
                    totalSold: 0,
                    averagePrice: 0,
                    totalViews: 0
                };
            }
            const cat = categoryMetrics[product.category];
            cat.productCount += 1;
            cat.totalRevenue += product.totalRevenue;
            cat.totalSold += product.totalSold;
            cat.totalViews += product.views;
        });

        // Calculate average prices for categories
        Object.values(categoryMetrics).forEach(cat => {
            const categoryProducts = products.filter(p => p.category === cat.category);
            cat.averagePrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length;
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalProducts: products.length,
                    totalViews: Object.values(productViews).reduce((sum, views) => sum + views, 0),
                    averageConversionRate: productMetrics.reduce((sum, p) => sum + p.conversionRate, 0) / productMetrics.length
                },
                topProducts: {
                    byRevenue: topByRevenue.slice(0, 10),
                    byQuantity: topByQuantity.slice(0, 10),
                    byViews: topByViews.slice(0, 10),
                    byConversion: topByConversion.slice(0, 10)
                },
                categoryAnalysis: Object.values(categoryMetrics),
                allProducts: productMetrics
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product analytics',
            message: error.message
        });
    }
});

// GET /api/analytics/customers - Get customer analytics
router.get('/customers', (req, res) => {
    try {
        const customers = dbUtils.getAllCustomers();
        const orders = dbUtils.getAllOrders();

        // Customer metrics
        const customerMetrics = customers.map(customer => {
            const customerOrders = orders.filter(order => order.customerId === customer.id);
            const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const averageOrderValue = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;
            
            const firstOrder = customerOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
            const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                wilaya: customer.wilaya,
                totalOrders: customerOrders.length,
                totalSpent,
                averageOrderValue,
                firstOrderDate: firstOrder?.createdAt,
                lastOrderDate: lastOrder?.createdAt,
                customerSince: customer.createdAt,
                status: customerOrders.length === 0 ? 'inactive' : 
                       customerOrders.length === 1 ? 'new' : 'returning'
            };
        });

        // Customer segmentation
        const segments = {
            new: customerMetrics.filter(c => c.status === 'new'),
            returning: customerMetrics.filter(c => c.status === 'returning'),
            inactive: customerMetrics.filter(c => c.status === 'inactive'),
            highValue: customerMetrics.filter(c => c.totalSpent > 100),
            frequent: customerMetrics.filter(c => c.totalOrders >= 3)
        };

        // Geographic distribution
        const wilayaDistribution = {};
        customers.forEach(customer => {
            const wilaya = customer.wilaya || 'Non spécifiée';
            wilayaDistribution[wilaya] = (wilayaDistribution[wilaya] || 0) + 1;
        });

        // Customer acquisition over time
        const acquisitionByMonth = {};
        customers.forEach(customer => {
            const date = new Date(customer.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acquisitionByMonth[key] = (acquisitionByMonth[key] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalCustomers: customers.length,
                    newCustomers: segments.new.length,
                    returningCustomers: segments.returning.length,
                    averageOrdersPerCustomer: customerMetrics.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length,
                    averageCustomerValue: customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
                },
                segments: {
                    new: segments.new.length,
                    returning: segments.returning.length,
                    inactive: segments.inactive.length,
                    highValue: segments.highValue.length,
                    frequent: segments.frequent.length
                },
                topCustomers: customerMetrics
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10),
                wilayaDistribution,
                acquisitionByMonth,
                allCustomers: customerMetrics
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer analytics',
            message: error.message
        });
    }
});

export default router; 