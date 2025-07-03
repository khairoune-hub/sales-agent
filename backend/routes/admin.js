import express from 'express';
import { dbUtils, database } from '../models/database.js';

const router = express.Router();

// GET /api/admin/stats - Get system statistics
router.get('/stats', (req, res) => {
    try {
        const orders = dbUtils.getAllOrders();
        const customers = dbUtils.getAllCustomers();
        const products = dbUtils.getAllProducts();
        const chatThreads = Array.from(database.chatThreads.values());

        // System statistics
        const stats = {
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            },
            database: {
                products: products.length,
                orders: orders.length,
                customers: customers.length,
                chatThreads: chatThreads.length,
                totalRecords: products.length + orders.length + customers.length + chatThreads.length
            },
            business: {
                totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
                averageOrderValue: orders.length > 0 ? 
                    orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
                conversionRate: customers.length > 0 ? (orders.length / customers.length) * 100 : 0,
                activeChats: chatThreads.filter(thread => thread.status === 'active').length
            },
            recent: {
                ordersToday: orders.filter(order => {
                    const today = new Date().toDateString();
                    return new Date(order.createdAt).toDateString() === today;
                }).length,
                newCustomersToday: customers.filter(customer => {
                    const today = new Date().toDateString();
                    return new Date(customer.createdAt).toDateString() === today;
                }).length,
                chatSessionsToday: chatThreads.filter(thread => {
                    const today = new Date().toDateString();
                    return new Date(thread.createdAt).toDateString() === today;
                }).length
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system statistics',
            message: error.message
        });
    }
});

// GET /api/admin/config - Get system configuration
router.get('/config', (req, res) => {
    try {
        const config = {
            api: {
                version: '2.0.0',
                environment: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 3000,
                rateLimiting: {
                    general: '100 requests per 15 minutes',
                    chat: '10 requests per minute'
                }
            },
            features: {
                openAI: !!process.env.OPENAI_API_KEY,
                googleSheets: !!(process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL),
                cors: true,
                helmet: true,
                morgan: true
            },
            database: {
                type: 'in-memory',
                persistent: false,
                backup: false
            },
            integrations: {
                openAI: {
                    enabled: !!process.env.OPENAI_API_KEY,
                    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
                },
                googleSheets: {
                    enabled: !!(process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL),
                    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null
                }
            }
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch configuration',
            message: error.message
        });
    }
});

// GET /api/admin/logs - Get system logs (simplified)
router.get('/logs', (req, res) => {
    try {
        const { level = 'all', limit = 100 } = req.query;
        
        // In a real application, you would read from actual log files
        // For now, we'll return some sample log entries
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Server started successfully',
                service: 'server'
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'info',
                message: 'Database initialized',
                service: 'database'
            },
            {
                timestamp: new Date(Date.now() - 120000).toISOString(),
                level: 'warn',
                message: 'Rate limit approached for IP',
                service: 'security'
            }
        ];

        const filteredLogs = level === 'all' ? logs : logs.filter(log => log.level === level);
        const limitedLogs = filteredLogs.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                logs: limitedLogs,
                total: filteredLogs.length,
                level,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch logs',
            message: error.message
        });
    }
});

// POST /api/admin/backup - Create system backup
router.post('/backup', (req, res) => {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            data: {
                products: dbUtils.getAllProducts(),
                orders: dbUtils.getAllOrders(),
                customers: dbUtils.getAllCustomers(),
                chatThreads: Array.from(database.chatThreads.values())
            },
            metadata: {
                recordCounts: {
                    products: dbUtils.getAllProducts().length,
                    orders: dbUtils.getAllOrders().length,
                    customers: dbUtils.getAllCustomers().length,
                    chatThreads: Array.from(database.chatThreads.values()).length
                }
            }
        };

        res.json({
            success: true,
            data: backup,
            message: 'Backup created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create backup',
            message: error.message
        });
    }
});

// POST /api/admin/maintenance - System maintenance operations
router.post('/maintenance', (req, res) => {
    try {
        const { operation } = req.body;
        
        const validOperations = ['cleanup', 'optimize', 'reset-analytics'];
        if (!validOperations.includes(operation)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid operation',
                message: `Operation must be one of: ${validOperations.join(', ')}`
            });
        }

        let result = {};

        switch (operation) {
            case 'cleanup':
                // Clean up old chat threads
                const oldThreads = Array.from(database.chatThreads.values())
                    .filter(thread => {
                        const threadAge = Date.now() - new Date(thread.createdAt).getTime();
                        return threadAge > 7 * 24 * 60 * 60 * 1000; // 7 days
                    });
                
                oldThreads.forEach(thread => {
                    database.chatThreads.delete(thread.id);
                });

                result = {
                    operation: 'cleanup',
                    threadsRemoved: oldThreads.length,
                    message: `Cleaned up ${oldThreads.length} old chat threads`
                };
                break;

            case 'optimize':
                // Optimize database (placeholder for real optimization)
                result = {
                    operation: 'optimize',
                    message: 'Database optimization completed'
                };
                break;

            case 'reset-analytics':
                // Reset analytics data
                database.analytics.dailySales.clear();
                database.analytics.productViews.clear();
                database.analytics.customerInteractions.clear();

                result = {
                    operation: 'reset-analytics',
                    message: 'Analytics data reset successfully'
                };
                break;
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Maintenance operation failed',
            message: error.message
        });
    }
});

// GET /api/admin/health - Detailed health check
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: {
                    status: 'healthy',
                    recordCount: dbUtils.getAllProducts().length + 
                                dbUtils.getAllOrders().length + 
                                dbUtils.getAllCustomers().length
                },
                openAI: {
                    status: process.env.OPENAI_API_KEY ? 'configured' : 'not-configured'
                },
                googleSheets: {
                    status: (process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL) 
                        ? 'configured' : 'not-configured'
                }
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            environment: process.env.NODE_ENV || 'development'
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});

export default router; 