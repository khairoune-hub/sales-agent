import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Environment Check Logging
console.log('\n🔍 Environment Configuration Check:');
console.log('===================================');

try {
    console.log('1. Server Environment:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - PORT: ${process.env.PORT || 3000}`);
    console.log(`   - Node Version: ${process.version}`);
    console.log(`   - Current Directory: ${process.cwd()}`);

    console.log('\n2. OpenAI Configuration:');
    const openaiKey = process.env.OPENAI_API_KEY;
    console.log(`   - OPENAI_API_KEY: ${openaiKey ? '✅ Set' : '❌ Missing'}`);
    if (openaiKey) {
        console.log(`   - Key length: ${openaiKey.length} characters`);
        console.log(`   - Key prefix: ${openaiKey.substring(0, 7)}...`);
        // Validate key format
        if (!openaiKey.startsWith('sk-')) {
            console.log('   ⚠️ Warning: API key does not start with "sk-"');
        }
    }
    console.log(`   - OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}`);
    console.log(`   - ASSISTANT_ID: ${process.env.ASSISTANT_ID ? '✅ Set' : '❌ Missing'}`);
    if (process.env.ASSISTANT_ID) {
        console.log(`   - Assistant ID: ${process.env.ASSISTANT_ID}`);
    }

    console.log('\n3. Google Sheets Configuration:');
    console.log(`   - GOOGLE_SHEETS_SPREADSHEET_ID: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - GOOGLE_SHEETS_PRIVATE_KEY: ${process.env.GOOGLE_SHEETS_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - GOOGLE_SHEETS_CLIENT_EMAIL: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);

    console.log('\n4. Messenger Webhook Configuration:');
    console.log(`   - MESSENGER_VERIFY_TOKEN: ${process.env.MESSENGER_VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - MESSENGER_ACCESS_TOKEN: ${process.env.MESSENGER_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - MESSENGER_APP_SECRET: ${process.env.MESSENGER_APP_SECRET ? '✅ Set' : '❌ Missing'}`);
    if (process.env.MESSENGER_ACCESS_TOKEN) {
        console.log(`   - Access Token length: ${process.env.MESSENGER_ACCESS_TOKEN.length} characters`);
    }

    console.log('\n5. WhatsApp Business API Configuration:');
    console.log(`   - WHATSAPP_VERIFY_TOKEN: ${process.env.WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - WHATSAPP_APP_SECRET: ${process.env.WHATSAPP_APP_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - WHATSAPP_BUSINESS_ACCOUNT_ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
    if (process.env.WHATSAPP_ACCESS_TOKEN) {
        console.log(`   - WhatsApp Access Token length: ${process.env.WHATSAPP_ACCESS_TOKEN.length} characters`);
    }
    if (process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.log(`   - Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
    }

    console.log('\n6. Service Account:');
    const serviceAccountPath = join(__dirname, '../credentials/service-account.json');
    if (existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            console.log('   - Service Account File: ✅ Found');
            console.log(`   - Client Email: ${serviceAccount.client_email || 'Not found'}`);
            console.log(`   - Project ID: ${serviceAccount.project_id || 'Not found'}`);
        } catch (error) {
            console.log('   - Service Account File: ⚠️ Found but invalid JSON');
        }
    } else {
        console.log('   - Service Account File: ❌ Not found');
    }

    console.log('\n7. Environment File:');
    const envPath = join(__dirname, '../.env');
    if (existsSync(envPath)) {
        try {
            const envContent = readFileSync(envPath, 'utf8');
            const envVars = envContent.split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
            console.log('   - .env File: ✅ Found');
            console.log(`   - Number of variables: ${envVars.length}`);
            console.log('   - Variables found:');
            envVars.forEach(varName => {
                const value = process.env[varName];
                console.log(`     - ${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
            });
        } catch (error) {
            console.log('   - .env File: ⚠️ Found but error reading');
        }
    } else {
        console.log('   - .env File: ❌ Not found');
    }

    console.log('\n8. Environment Variables in Process:');
    const requiredVars = [
        'OPENAI_API_KEY',
        'OPENAI_MODEL',
        'ASSISTANT_ID',
        'GOOGLE_SHEETS_SPREADSHEET_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY',
        'GOOGLE_SHEETS_CLIENT_EMAIL',
        'MESSENGER_VERIFY_TOKEN',
        'MESSENGER_ACCESS_TOKEN',
        'MESSENGER_APP_SECRET',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_ACCESS_TOKEN',
        'WHATSAPP_APP_SECRET',
        'WHATSAPP_PHONE_NUMBER_ID',
        'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        console.log(`   - ${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
    });

} catch (error) {
    console.error('\n❌ Error during environment check:', error);
}

console.log('\n===================================\n');

// Import route modules
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhook.js';
import whatsappRoutes from './routes/whatsapp.js';

// Import services for initialization
import { googleSheetsService } from './services/googleSheets.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 8787;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            childSrc: ["'self'"],
            workerSrc: ["'self'"],
            manifestSrc: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            scriptSrcAttr: ["'unsafe-hashes'", "'unsafe-inline'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    originAgentCluster: true,
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    xContentTypeOptions: true,
    xDnsPrefetchControl: true,
    xDownloadOptions: true,
    xFrameOptions: { action: 'deny' },
    xPermittedCrossDomainPolicies: false,
    xPoweredBy: false,
    xXssProtection: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 chat requests per minute
    message: {
        error: 'Too many chat requests, please slow down.',
        retryAfter: '1 minute'
    }
});

app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0'
    });
});

// Test environment endpoint for frontend connection testing
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
            environment: process.env.NODE_ENV || 'development'
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
app.use('/webhook', webhookRoutes);
app.use('/whatsapp', whatsappRoutes);

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Lingerie Store Products API',
        version: '2.0.0',
        description: 'Express.js backend for bio products sales platform',
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
            }
        },
        documentation: 'Visit /api for this documentation'
    });
});

// Serve static files from public directory
app.use(express.static(join(__dirname, '../public')));

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, '../admin.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(join(__dirname, '../chat.html'));
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
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Lingerie Store Products Backend Server`);
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`💬 Frontend: http://localhost:${PORT}`);
    
    // Initialize Google Sheets service
    console.log('\n📊 Initializing Google Sheets service...');
    try {
        const sheetsInitialized = await googleSheetsService.initialize();
        if (sheetsInitialized) {
            console.log('✅ Google Sheets service initialized successfully');
            console.log('📋 Orders and customers will be saved to Google Sheets');
        } else {
            console.log('⚠️ Google Sheets service not available - using local database only');
        }
    } catch (error) {
        console.error('❌ Google Sheets initialization failed:', error.message);
        console.log('⚠️ Falling back to local database only');
    }
    
    console.log(`⚡ Ready to serve requests!`);
});

export default app; 