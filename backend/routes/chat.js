import express from 'express';
import { dbUtils } from '../models/database.js';
import { openAIService } from '../services/openai.js';

const router = express.Router();

// Debug endpoint to check environment
router.get('/debug-env', (req, res) => {
    console.log('\n🔍 Chat Route Environment Debug:');
    console.log('================================');
    console.log(`- OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
    if (process.env.OPENAI_API_KEY) {
        console.log(`- Key length: ${process.env.OPENAI_API_KEY.length}`);
        console.log(`- Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
    }
    console.log(`- All env vars with OPENAI: ${Object.keys(process.env).filter(key => key.includes('OPENAI')).join(', ')}`);
    console.log('================================\n');
    
    res.json({
        success: true,
        data: {
            hasApiKey: !!process.env.OPENAI_API_KEY,
            keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            openaiEnvVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
        }
    });
});

// POST /api/chat/initialize - Initialize chat system
router.post('/initialize', async (req, res) => {
    try {
        console.log('\n📱 Chat initialization request received');
        
        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OpenAI API key not found during initialization');
            return res.status(500).json({
                success: false,
                error: 'OpenAI not configured',
                message: 'OpenAI API key is not set. Please configure the environment variables.'
            });
        }

        // Get available products for quick responses
        const products = dbUtils.getAllProducts();
        
        res.json({
            success: true,
            data: {
                message: 'Chat initialized successfully',
                quickResponses: {
                    fr: [
                        'Bonjour! Pouvez-vous me montrer vos produits?',
                        'Quels sont vos produits les plus populaires?',
                        'Avez-vous des produits pour la santé?',
                        'Je cherche des compléments alimentaires'
                    ],
                    ar: [
                        'مرحبا! هل يمكنكم عرض منتجاتكم؟',
                        'ما هي منتجاتكم الأكثر شعبية؟',
                        'هل لديكم منتجات للصحة؟',
                        'أبحث عن مكملات غذائية'
                    ]
                },
                products: products.slice(0, 6) // Show first 6 products
            }
        });

    } catch (error) {
        console.error('❌ Chat initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Initialization failed',
            message: error.message
        });
    }
});

// POST /api/chat/start - Start a new chat session
router.post('/start', async (req, res) => {
    try {
        console.log('\n🚀 Starting new chat session...');
        console.log(`- Request body:`, req.body);
        
        // Debug environment at request time
        console.log(`- OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
        
        const { language = 'fr', customerName, userType = 'customer' } = req.body;

        // Create OpenAI thread
        const threadId = await openAIService.createThread();
        
        console.log(`✅ Chat session started with thread: ${threadId}`);

        res.json({
            success: true,
            data: {
                threadId,
                message: language === 'ar' 
                    ? 'تم بدء جلسة المحادثة بنجاح' 
                    : 'Session de chat démarrée avec succès',
                language,
                customerName,
                userType
            }
        });

    } catch (error) {
        console.error('❌ Failed to start chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start chat session',
            message: error.message
        });
    }
});

// POST /api/chat/message - Send a message in chat
router.post('/message', async (req, res) => {
    try {
        const { threadId, message, language = 'fr', customerName, userType = 'customer' } = req.body;

        if (!threadId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'threadId and message are required'
            });
        }

        console.log(`\n💬 Processing message for thread ${threadId}`);
        console.log(`- Message: ${message.substring(0, 100)}...`);

        // Send message to OpenAI
        const response = await openAIService.sendMessage(threadId, message, {
            language,
            customerName,
            userType
        });

        // Log the interaction
        dbUtils.logInteraction({
            threadId,
            userMessage: message,
            aiResponse: response,
            language,
            customerName,
            userType,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                response,
                threadId,
                language
            }
        });

    } catch (error) {
        console.error('❌ Message processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Message processing failed',
            message: error.message
        });
    }
});

// GET /api/chat/:threadId/history - Get chat history
router.get('/:threadId/history', (req, res) => {
    try {
        const { threadId } = req.params;
        const { limit, offset } = req.query;

        const thread = dbUtils.getChatThread(threadId);
        if (!thread) {
            return res.status(404).json({
                success: false,
                error: 'Chat thread not found'
            });
        }

        let messages = thread.messages || [];

        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || messages.length;
        const paginatedMessages = messages.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: {
                threadId,
                messages: paginatedMessages,
                customer: thread.customerId ? {
                    id: thread.customerId,
                    name: thread.customerName,
                    phone: thread.customerPhone
                } : null,
                pagination: {
                    total: messages.length,
                    offset: startIndex,
                    limit: limitNum,
                    hasMore: startIndex + limitNum < messages.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history',
            message: error.message
        });
    }
});

// GET /api/chat/:threadId - Get chat thread details
router.get('/:threadId', (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = dbUtils.getChatThread(threadId);

        if (!thread) {
            return res.status(404).json({
                success: false,
                error: 'Chat thread not found'
            });
        }

        // Get customer details if available
        let customer = null;
        if (thread.customerId) {
            customer = dbUtils.getCustomerById(thread.customerId);
        }

        res.json({
            success: true,
            data: {
                ...thread,
                customer,
                messageCount: thread.messages?.length || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat thread',
            message: error.message
        });
    }
});

// PUT /api/chat/:threadId/status - Update chat thread status
router.put('/:threadId/status', (req, res) => {
    try {
        const { threadId } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'closed', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const thread = dbUtils.getChatThread(threadId);
        if (!thread) {
            return res.status(404).json({
                success: false,
                error: 'Chat thread not found'
            });
        }

        const updatedThread = dbUtils.updateChatThread(threadId, { status });

        res.json({
            success: true,
            data: updatedThread,
            message: `Chat thread status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update chat thread status',
            message: error.message
        });
    }
});

// GET /api/chat - Get all chat threads (for admin)
router.get('/', (req, res) => {
    try {
        const { status, customerId, limit, offset, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
        let threads = Array.from(dbUtils.database.chatThreads.values());

        // Filter by status
        if (status) {
            threads = threads.filter(thread => thread.status === status);
        }

        // Filter by customer
        if (customerId) {
            threads = threads.filter(thread => thread.customerId === customerId);
        }

        // Sort threads
        threads.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || threads.length;
        const paginatedThreads = threads.slice(startIndex, startIndex + limitNum);

        // Add summary info to each thread
        const threadsWithSummary = paginatedThreads.map(thread => ({
            ...thread,
            messageCount: thread.messages?.length || 0,
            lastMessage: thread.messages?.length > 0 ? 
                thread.messages[thread.messages.length - 1] : null
        }));

        res.json({
            success: true,
            data: threadsWithSummary,
            pagination: {
                total: threads.length,
                offset: startIndex,
                limit: limitNum,
                hasMore: startIndex + limitNum < threads.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat threads',
            message: error.message
        });
    }
});

// GET /api/chat/history/:threadId - Get chat history
router.get('/history/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        
        // Get history from database
        const history = dbUtils.getChatHistory(threadId);
        
        res.json({
            success: true,
            data: {
                threadId,
                history
            }
        });

    } catch (error) {
        console.error('❌ Failed to get chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat history',
            message: error.message
        });
    }
});

// POST /api/chat/end - End chat session
router.post('/end', async (req, res) => {
    try {
        const { threadId, feedback } = req.body;
        
        console.log(`\n🔚 Ending chat session: ${threadId}`);
        
        // Log session end
        dbUtils.logInteraction({
            threadId,
            userMessage: 'SESSION_END',
            aiResponse: 'Session ended by user',
            feedback,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                message: 'Chat session ended successfully',
                threadId
            }
        });

    } catch (error) {
        console.error('❌ Failed to end chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end chat session',
            message: error.message
        });
    }
});

export default router; 