import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Simplified Environment Check for Vercel
console.log('\n🔍 Vercel Environment Check:');
console.log('============================');

const requiredVars = [
    'OPENAI_API_KEY',
    'ASSISTANT_ID',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'MESSENGER_VERIFY_TOKEN',
    'MESSENGER_ACCESS_TOKEN',
    'WHATSAPP_VERIFY_TOKEN',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID'
];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
});

console.log('============================\n');

// Import route modules
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhook.js';
import whatsappRoutes from './routes/whatsapp.js';
import storageRoutes from './routes/storage.js';

// Import services for initialization
import { googleSheetsService } from './services/googleSheets.js';

const app = express();

// Trust proxy (required for Vercel)
app.set('trust proxy', 1);

// Security middleware (simplified for Vercel)
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier deployment
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for API
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: {
        error: 'Too many chat requests, please slow down.',
        retryAfter: '1 minute'
    }
});

app.use(limiter);

// CORS configuration for Vercel
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://yourdomain.vercel.app',
            'https://your-custom-domain.com'
          ]
        : [
            'http://localhost:3000',
            'http://localhost:8787',
            'http://127.0.0.1:8787',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with OpenAI status
app.get('/health', async (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '2.0.0',
            platform: 'vercel'
        };

        // Check OpenAI service status if requested
        if (req.query.check_openai === 'true') {
            try {
                // Import OpenAI service dynamically
                const { openAIService } = await import('./services/openai.js');
                
                // Quick test - this should be fast if properly configured
                const testThreadId = 'test-health-check';
                const diagnosis = await openAIService.diagnoseThread(testThreadId);
                
                healthData.openai = {
                    configured: !!process.env.OPENAI_API_KEY,
                    assistant_configured: !!process.env.ASSISTANT_ID,
                    circuit_breaker_state: 'UNKNOWN', // Would need to expose this
                    last_check: new Date().toISOString()
                };
                
            } catch (openaiError) {
                healthData.openai = {
                    configured: !!process.env.OPENAI_API_KEY,
                    error: 'Health check failed',
                    last_check: new Date().toISOString()
                };
            }
        }

        res.json(healthData);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Test environment endpoint
app.get('/api/test-env', (req, res) => {
    res.json({
        success: true,
        message: 'Backend connection successful',
        timestamp: new Date().toISOString(),
        environment: {
            hasOpenAI: !!process.env.OPENAI_API_KEY,
            hasSheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            hasServiceAccount: !!(process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL),
            hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY
        },
        backend: {
            version: '2.0.0',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            platform: 'vercel'
        }
    });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/storage', storageRoutes);
app.use('/webhook', webhookRoutes);
app.use('/whatsapp', whatsappRoutes);

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Lingerie Store Products API',
        version: '2.0.0',
        description: 'Express.js backend for lingerie products sales platform',
        platform: 'vercel',
        endpoints: {
            health: 'GET /health',
            products: {
                list: 'GET /api/products',
                get: 'GET /api/products/:id',
                search: 'GET /api/products/search?q=query',
                categories: 'GET /api/products/categories'
            },
            orders: {
                create: 'POST /api/orders',
                list: 'GET /api/orders',
                get: 'GET /api/orders/:id',
                update: 'PUT /api/orders/:id',
                delete: 'DELETE /api/orders/:id'
            },
            customers: {
                create: 'POST /api/customers',
                list: 'GET /api/customers',
                get: 'GET /api/customers/:id',
                update: 'PUT /api/customers/:id'
            },
            chat: {
                start: 'POST /api/chat/start',
                message: 'POST /api/chat/message',
                history: 'GET /api/chat/:threadId/history'
            },
            analytics: {
                dashboard: 'GET /api/analytics/dashboard',
                sales: 'GET /api/analytics/sales',
                products: 'GET /api/analytics/products',
                customers: 'GET /api/analytics/customers'
            },
            admin: {
                stats: 'GET /api/admin/stats',
                config: 'GET /api/admin/config',
                logs: 'GET /api/admin/logs'
            },
            webhook: {
                messenger_verify: 'GET /webhook/messenger',
                messenger_message: 'POST /webhook/messenger',
                debug_sessions: 'GET /webhook/debug/sessions',
                debug_config: 'GET /webhook/debug/config'
            },
            whatsapp: {
                verify: 'GET /whatsapp/webhook',
                message: 'POST /whatsapp/webhook',
                debug_sessions: 'GET /whatsapp/debug/sessions',
                debug_config: 'GET /whatsapp/debug/config'
            },
            storage: {
                info: 'GET /api/storage/info',
                bucket: 'POST /api/storage/bucket',
                upload: 'POST /api/storage/upload',
                images: 'GET /api/storage/images',
                delete: 'DELETE /api/storage/image/:filePath',
                url: 'GET /api/storage/url/:productId'
            }
        },
        documentation: 'Visit /api for this documentation'
    });
});

// Serve static files from public directory
app.use(express.static(join(__dirname, '../public')));

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, '../public/admin.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(join(__dirname, '../public/chat.html'));
});

// Basic route for root when no HTML files
app.get('/api-only', (req, res) => {
    res.json({
        message: 'Lingerie Store API is running on Vercel',
        version: '2.0.0',
        documentation: '/api',
        health: '/health'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: '/api'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// Initialize Google Sheets service (but don't block startup)
googleSheetsService.initialize().then(sheetsInitialized => {
    if (sheetsInitialized) {
        console.log('✅ Google Sheets service initialized successfully');
    } else {
        console.log('⚠️ Google Sheets service not available - using local database only');
    }
}).catch(error => {
    console.error('❌ Google Sheets initialization failed:', error.message);
    console.log('⚠️ Falling back to local database only');
});

// Start server for local development (not needed for Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 8787;
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📱 Frontend: http://localhost:${PORT}/`);
        console.log(`👑 Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`💬 Chat Interface: http://localhost:${PORT}/chat`);
        console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
        console.log(`\n✨ Ready for development!\n`);
    });
}

// Export the app for Vercel deployment
export default app;