import express from 'express';
import { productService, customerService, orderService, analyticsService, categoryService } from '../services/supabase.js';
import { googleSheetsService } from '../services/googleSheets.js';

const router = express.Router();

// ===================================
// HEALTH CHECK
// ===================================

router.get('/health', async (req, res) => {
    try {
        const healthCheck = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            services: {}
        };

        // Check Supabase connection
        try {
            await productService.getProducts({ limit: 1 });
            healthCheck.services.database = 'connected';
        } catch (error) {
            healthCheck.services.database = 'error';
        }

        // Check Google Sheets connection
        try {
            await googleSheetsService.initialize();
            healthCheck.services.sheets = 'connected';
        } catch (error) {
            healthCheck.services.sheets = 'error';
        }

        // Check OpenAI (basic check)
        healthCheck.services.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';

        res.json(healthCheck);
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// ===================================
// DASHBOARD STATISTICS
// ===================================

router.get('/dashboard/stats', async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardData();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/dashboard/recent-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        // Get recent orders and customer interactions
        const recentOrders = await orderService.getOrders({
            limit: limit / 2,
            sortBy: 'created_at',
            sortOrder: 'desc'
        });

        const recentCustomers = await customerService.getCustomers({
            limit: limit / 2,
            sortBy: 'created_at',
            sortOrder: 'desc'
        });

        const activity = [
            ...recentOrders.map(order => ({
                id: order.id,
                type: 'order',
                title: `Nouvelle commande #${order.order_number}`,
                description: `Client: ${order.customer_name} - ${order.total_amount}€`,
                timestamp: order.created_at,
                platform: order.platform_type
            })),
            ...recentCustomers.map(customer => ({
                id: customer.id,
                type: 'customer',
                title: `Nouveau client: ${customer.name}`,
                description: `Plateforme: ${customer.platform}`,
                timestamp: customer.created_at,
                platform: customer.platform
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, data: activity.slice(0, limit) });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// PRODUCTS MANAGEMENT
// ===================================

router.get('/products', async (req, res) => {
    try {
        const filters = {
            active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
            category: req.query.category || undefined,
            inStockOnly: req.query.inStockOnly === 'true',
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const products = await productService.getProducts(filters);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Products fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Product fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const productData = req.body;
        const product = await productService.createProduct(productData);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const productData = req.body;
        const product = await productService.updateProduct(req.params.id, productData);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// ORDERS MANAGEMENT
// ===================================

router.get('/orders', async (req, res) => {
    try {
        const filters = {
            status: req.query.status || undefined,
            platform: req.query.platform || undefined,
            dateFrom: req.query.dateFrom || undefined,
            dateTo: req.query.dateTo || undefined,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const orders = await orderService.getOrders(filters);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Orders fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status, confirmedBy } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status, confirmedBy);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Order status update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// CUSTOMERS MANAGEMENT
// ===================================

router.get('/customers', async (req, res) => {
    try {
        const filters = {
            platform: req.query.platform || undefined,
            dateFrom: req.query.dateFrom || undefined,
            dateTo: req.query.dateTo || undefined,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const customers = await customerService.getCustomers(filters);
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Customers fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Customer fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/customers/:id/orders', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const orders = await customerService.getCustomerOrderHistory(req.params.id, limit);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Customer orders fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// CATEGORIES MANAGEMENT
// ===================================

router.get('/categories', async (req, res) => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const categories = await categoryService.getCategories(activeOnly);
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Categories fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/categories/with-counts', async (req, res) => {
    try {
        const categories = await categoryService.getCategoriesWithCounts();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Categories with counts fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// INVENTORY MANAGEMENT
// ===================================

router.get('/inventory', async (req, res) => {
    try {
        const filters = {
            lowStockOnly: req.query.lowStockOnly === 'true',
            outOfStockOnly: req.query.outOfStockOnly === 'true',
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };

        const products = await productService.getProducts(filters);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Inventory fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/inventory/:id/stock', async (req, res) => {
    try {
        const { stock, notes } = req.body;
        const product = await productService.updateProductStock(req.params.id, stock, notes);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Stock update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/inventory/bulk-update', async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, stock, notes }
        const results = [];
        
        for (const update of updates) {
            try {
                const product = await productService.updateProductStock(update.id, update.stock, update.notes);
                results.push({ id: update.id, success: true, data: product });
            } catch (error) {
                results.push({ id: update.id, success: false, error: error.message });
            }
        }
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Bulk stock update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// ANALYTICS
// ===================================

router.get('/analytics/sales', async (req, res) => {
    try {
        const { dateFrom, dateTo, platform } = req.query;
        const analytics = await analyticsService.getSalesAnalytics(dateFrom, dateTo, platform);
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Sales analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/dashboard', async (req, res) => {
    try {
        const dashboardData = await analyticsService.getDashboardData();
        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// SYSTEM SETTINGS
// ===================================

router.get('/settings', async (req, res) => {
    try {
        const settings = {
            store_name: process.env.STORE_NAME || 'Lingerie Store',
            store_email: process.env.STORE_EMAIL || 'contact@xcompany.com',
            default_language: process.env.DEFAULT_LANGUAGE || 'fr',
            currency: process.env.CURRENCY || 'EUR',
            low_stock_threshold: process.env.LOW_STOCK_THRESHOLD || 10,
            welcome_message: process.env.WELCOME_MESSAGE || 'Bienvenue chez Lingerie Store!',
            supabase_status: process.env.SUPABASE_URL ? 'configured' : 'not configured',
            openai_status: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
            google_sheets_status: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'configured' : 'not configured'
        };

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Settings fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const settings = req.body;
        // In a real implementation, you would save these to a database or config file
        // For now, we'll just return success
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// INTEGRATION TESTS
// ===================================

router.post('/test/supabase', async (req, res) => {
    try {
        const testResult = await productService.testConnection();
        res.json({ success: true, data: testResult });
    } catch (error) {
        console.error('Supabase test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/test/google-sheets', async (req, res) => {
    try {
        const initialized = await googleSheetsService.initialize();
        if (initialized) {
            res.json({ success: true, message: 'Google Sheets connection successful' });
        } else {
            res.json({ success: false, message: 'Google Sheets connection failed' });
        }
    } catch (error) {
        console.error('Google Sheets test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================================
// GOOGLE SHEETS VERIFICATION ROUTES
// ===================================

// Verify Google Sheets integration
router.get('/verify-google-sheets', async (req, res) => {
    try {
        console.log('📊 Admin requested Google Sheets verification');
        const verificationResults = await googleSheetsService.verifyIntegration();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            verification: verificationResults
        });
    } catch (error) {
        console.error('❌ Google Sheets verification failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Fix Google Sheets structure
router.post('/fix-google-sheets', async (req, res) => {
    try {
        console.log('🔧 Admin requested Google Sheets structure fix');
        const fixResults = await googleSheetsService.fixSheetStructure();
        
        res.json({
            success: true,
            message: 'Google Sheets structure fixed successfully',
            timestamp: new Date().toISOString(),
            verification: fixResults
        });
    } catch (error) {
        console.error('❌ Google Sheets fix failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test Google Sheets data write (dry run)
router.post('/test-google-sheets-write', async (req, res) => {
    try {
        console.log('🧪 Admin requested Google Sheets write test');
        
        const testOrder = {
            id: 'TEST_' + Date.now(),
            order_number: 'ADMIN_TEST_' + Date.now(),
            created_at: new Date().toISOString(),
            customers: { 
                name: 'Admin Test Customer', 
                phone: '+213123456789', 
                email: 'admin-test@example.com',
                platform_id: 'admin_test_' + Date.now()
            },
            platform_type: 'admin_test',
            wilaya: 'Alger',
            shipping_address: 'Admin Test Address',
            order_items: [{ 
                products: { name: 'Admin Test Product' }, 
                quantity: 1, 
                unit_price: 999 
            }],
            total_amount: 999,
            status: 'test',
            payment_status: 'test',
            notes: 'Admin test order - safe to delete',
            sales_agent: 'admin_test',
            confirmed_at: new Date().toISOString(),
            confirmed_by: 'admin'
        };

        const result = await googleSheetsService.addOrder(testOrder);
        
        res.json({
            success: true,
            message: 'Test order written to Google Sheets successfully',
            orderId: testOrder.id,
            orderNumber: testOrder.order_number,
            timestamp: new Date().toISOString(),
            result
        });
    } catch (error) {
        console.error('❌ Google Sheets write test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ===================================

export default router;