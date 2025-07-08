import { dbUtils } from '../models/database.js';
import { productService, orderService } from './supabase.js';
import { getCachedProducts, searchCachedProducts, getCachedProductById, searchCachedProductsWithVariants } from './openai-cache.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_CONTEXT } from '../../src/SYSTEM_CONTEXT.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced connection pool and caching for multiple concurrent users
let openai = null;
let isInitialized = false;
let initializationPromise = null;

// Connection pool for handling multiple concurrent requests
const connectionPool = {
    activeConnections: new Set(),
    maxConnections: 50, // Adjust based on your OpenAI tier
    queuedRequests: [],
    
    async acquireConnection() {
        if (this.activeConnections.size < this.maxConnections) {
            const connectionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.activeConnections.add(connectionId);
            return connectionId;
        }
        
        // Queue the request if pool is full
        return new Promise((resolve) => {
            this.queuedRequests.push(resolve);
        });
    },
    
    releaseConnection(connectionId) {
        this.activeConnections.delete(connectionId);
        
        // Process queued requests
        if (this.queuedRequests.length > 0) {
            const nextResolve = this.queuedRequests.shift();
            const newConnectionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.activeConnections.add(newConnectionId);
            nextResolve(newConnectionId);
        }
    },
    
    getStats() {
        return {
            active: this.activeConnections.size,
            queued: this.queuedRequests.length,
            maxConnections: this.maxConnections
        };
    }
};

// Enhanced response caching for better performance
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

const cacheManager = {
    set(key, value) {
        // Implement LRU eviction if cache is full
        if (responseCache.size >= MAX_CACHE_SIZE) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
        }
        
        responseCache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0
        });
    },
    
    get(key) {
        const cached = responseCache.get(key);
        if (!cached) return null;
        
        // Check if cache entry is still valid
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            responseCache.delete(key);
            return null;
        }
        
        cached.hits++;
        return cached.value;
    },
    
    clear() {
        responseCache.clear();
    },
    
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let totalHits = 0;
        
        for (const [key, entry] of responseCache.entries()) {
            if (now - entry.timestamp <= CACHE_TTL) {
                validEntries++;
                totalHits += entry.hits;
            }
        }
        
        return {
            totalEntries: responseCache.size,
            validEntries,
            totalHits,
            hitRate: validEntries > 0 ? (totalHits / validEntries).toFixed(2) : 0
        };
    }
};

// Enhanced Circuit breaker pattern for production scaling
const circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    successCount: 0,
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    threshold: 3, // Reduced threshold for faster recovery
    timeout: 30000, // 30 seconds timeout when open (reduced for better UX)
    halfOpenMaxRequests: 2, // Max requests in half-open state
    metrics: {
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        lastReset: Date.now()
    },
    
    async call(fn, ...args) {
        this.metrics.totalRequests++;
        
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                console.log('🔄 Circuit breaker moving to HALF_OPEN state');
            } else {
                const remainingTime = Math.ceil((this.timeout - (Date.now() - this.lastFailureTime)) / 1000);
                throw new Error(`Circuit breaker is OPEN - Service temporarily unavailable. Retry in ${remainingTime}s`);
            }
        }
        
        if (this.state === 'HALF_OPEN' && this.successCount >= this.halfOpenMaxRequests) {
            throw new Error('Circuit breaker HALF_OPEN - Maximum test requests exceeded');
        }
        
        try {
            const startTime = Date.now();
            const result = await fn(...args);
            const duration = Date.now() - startTime;
            
            // Success handling
            this.metrics.totalSuccesses++;
            
            if (this.state === 'HALF_OPEN') {
                this.successCount++;
                if (this.successCount >= this.halfOpenMaxRequests) {
                    this.state = 'CLOSED';
                    this.failures = 0;
                    console.log('✅ Circuit breaker reset to CLOSED state after successful test');
                }
            } else if (this.state === 'CLOSED') {
                // Reset failure count on success
                this.failures = Math.max(0, this.failures - 1);
            }
            
            // Log performance metrics
            if (duration > 10000) { // Warn on slow requests
                console.warn(`⚠️ Slow OpenAI request: ${duration}ms`);
            }
            
            return result;
        } catch (error) {
            this.failures++;
            this.lastFailureTime = Date.now();
            this.metrics.totalFailures++;
            
            // Enhanced error classification
            const isRateLimitError = error.status === 429 || error.message?.includes('rate limit');
            const isServerError = error.status >= 500;
            const isTimeoutError = error.message?.includes('timeout') || error.code === 'ECONNABORTED';
            
            // Different thresholds for different error types
            let effectiveThreshold = this.threshold;
            if (isRateLimitError) {
                effectiveThreshold = 1; // Open immediately on rate limits
            } else if (isServerError || isTimeoutError) {
                effectiveThreshold = 2; // Open faster on server issues
            }
            
            // Check if we should open the circuit
            if (this.failures >= effectiveThreshold && this.state !== 'OPEN') {
                this.state = 'OPEN';
                console.error(`💥 Circuit breaker OPENED after ${this.failures} failures (${error.status || error.code || 'unknown error'})`);
            }
            
            throw error;
        }
    },
    
    // Get circuit breaker status
    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            successCount: this.successCount,
            metrics: this.metrics,
            healthScore: this.metrics.totalRequests > 0 ? 
                (this.metrics.totalSuccesses / this.metrics.totalRequests * 100).toFixed(2) + '%' : 'N/A'
        };
    },
    
    // Reset circuit breaker (for admin use)
    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        console.log('🔄 Circuit breaker manually reset');
    }
};

// Helper function to get assistant ID
const getAssistantId = () => {
    // First try ASSISTANT_ID environment variable
    if (process.env.ASSISTANT_ID) {
        console.log(`✅ Assistant ID loaded from environment variable: ${process.env.ASSISTANT_ID}`);
        return process.env.ASSISTANT_ID;
    }
    
    // Fallback to reading from file (for backward compatibility)
    try {
        const assistantIdPath = join(__dirname, '../../.assistant-id');
        const assistantId = readFileSync(assistantIdPath, 'utf8').trim();
        console.log(`✅ Assistant ID loaded from file: ${assistantId}`);
        return assistantId;
    } catch (error) {
        console.warn('❌ Could not read .assistant-id file, using OPENAI_ASSISTANT_ID environment variable');
        return process.env.OPENAI_ASSISTANT_ID;
    }
};

// Initialize OpenAI client with enhanced error handling and connection pooling
const initializeOpenAI = async () => {
    // Prevent multiple concurrent initializations
    if (initializationPromise) {
        return await initializationPromise;
    }
    
    if (isInitialized && openai) {
        return openai;
    }

    initializationPromise = (async () => {
        console.log('\n🔧 OpenAI Service Initialization:');
        console.log('================================');
        console.log(`- OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
        
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY is not set in environment variables');
            console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
            isInitialized = true; // Mark as initialized even if failed to prevent retry loops
            return null;
        }
        
        console.log(`- Key length: ${process.env.OPENAI_API_KEY.length}`);
        console.log(`- Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
        
        try {
            const { OpenAI } = await import('openai');
            
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                timeout: 30000, // 30 second timeout
                maxRetries: 2, // Built-in retry mechanism
            });
            
            // Test the connection with a simple request
            console.log('🧪 Testing OpenAI connection...');
            const models = await openai.models.list();
            console.log(`✅ OpenAI connection verified - ${models.data.length} models available`);
            
            console.log('✅ OpenAI client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize OpenAI client:', error.message);
            openai = null;
        }
        
        console.log(`- OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4o'}`);
        console.log('================================\n');
        
        isInitialized = true;
        return openai;
    })();
    
    const result = await initializationPromise;
    initializationPromise = null; // Reset for future reinitializations if needed
    return result;
};

// Supported file types and their configurations
const SUPPORTED_FILE_TYPES = {
    vision: {
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        description: 'Images (JPG, PNG, GIF, WebP)'
    },
    documents: {
        extensions: ['pdf', 'txt', 'doc', 'docx'],
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        description: 'Documents (PDF, TXT, DOC, DOCX)'
    }
};

// Check if current model supports vision
const supportsVision = (modelName) => {
    const visionModels = ['gpt-4-vision-preview', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
    return visionModels.some(model => modelName.includes(model));
};

// Get current model
const getCurrentModel = () => {
    return process.env.OPENAI_MODEL || 'gpt-4o';
};

// Detect image type from buffer headers
const detectImageType = (buffer) => {
    const uint8Array = new Uint8Array(buffer);
    
    // Check for common image file signatures
    if (uint8Array.length >= 4) {
        // PNG: 89 50 4E 47
        if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
            return 'png';
        }
        
        // JPEG: FF D8 FF
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
            return 'jpeg';
        }
        
        // GIF: 47 49 46 38
        if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
            return 'gif';
        }
        
        // WebP: 52 49 46 46 ... 57 45 42 50
        if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 && 
            uint8Array.length >= 12 && uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
            return 'webp';
        }
    }
    
    // Default to jpeg if unknown
    return 'jpeg';
};

// Helper function to find product image from Supabase data
const findProductImageFromSupabase = async (productName, productId = null) => {
    try {
        console.log(`🔍 Finding image for: "${productName}" (ID: ${productId})`);
        
        // If we have productId, get the product directly
        if (productId) {
            const product = await getCachedProductById(productId);
            console.log(`📦 Product by ID result:`, product ? 'found' : 'not found');
            if (product && product.product_images && product.product_images.length > 0) {
                const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
                console.log(`✅ Found image by ID: ${primaryImage.image_url}`);
                return {
                    url: primaryImage.image_url,
                    alt: primaryImage.alt_text || product.name
                };
            }
        }
        
        // Search by product name
        if (productName) {
            const searchResults = await searchCachedProducts(productName);
            console.log(`🔍 Search results for "${productName}":`, searchResults?.length || 0, 'products');
            
            if (searchResults && searchResults.length > 0) {
                const product = searchResults[0]; // Take first match
                console.log(`📦 First product:`, {
                    name: product.name,
                    name_ar: product.name_ar,
                    hasImages: !!product.product_images,
                    imageCount: product.product_images?.length || 0
                });
                
                if (product.product_images && product.product_images.length > 0) {
                    const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
                    console.log(`✅ Found image by search: ${primaryImage.image_url}`);
                    return {
                        url: primaryImage.image_url,
                        alt: primaryImage.alt_text || product.name
                    };
                }
            }
        }
        
        console.log(`❌ No image found for "${productName}"`);
        return null;
    } catch (error) {
        console.warn('⚠️ Failed to find product image from Supabase:', error.message);
        return null;
    }
};

// Build dynamic instructions (moved outside the service object)
const buildInstructions = (language, customerName, userType) => {
    const baseInstructions = SYSTEM_CONTEXT[language];
    
    let additionalInstructions = '';
    
    if (customerName) {
        additionalInstructions += language === 'ar' 
            ? `\n\nاسم العميل: ${customerName}. استخدم اسمه في المحادثة لجعلها أكثر شخصية.`
            : `\n\nNom du client: ${customerName}. Utilise son nom dans la conversation pour la personnaliser.`;
    }

    if (userType === 'admin') {
        additionalInstructions += language === 'ar'
            ? `\n\nهذا مدير النظام. قدم معلومات تفصيلية ومساعدة إدارية.`
            : `\n\nCeci est un administrateur système. Fournis des informations détaillées et une assistance administrative.`;
    }

    return baseInstructions + additionalInstructions;
};

// Build vision-specific instructions for image analysis
const buildVisionInstructions = (language, customerName, userType) => {
    const baseInstructions = buildInstructions(language, customerName, userType);
    
    const visionInstructions = language === 'ar' 
        ? `\n\nتعليمات تحليل الصور:
- قم بتحليل الصورة المرسلة بعناية
- إذا كانت الصورة تحتوي على منتج أو مكون صحي، اربطه بمنتجاتنا العضوية المتوفرة
- قدم توصيات محددة بناءً على ما تراه في الصورة
- إذا كانت الصورة تحتوي على ملصق أو نص، اقرأه واشرح محتواه
- إذا لم تكن الصورة واضحة أو غير مرتبطة بالمنتجات الصحية، اطلب توضيحاً
- كن مفيداً واقترح البدائل العضوية من منتجاتنا
- اشرح فوائد المنتجات المقترحة بوضوح`
        : `\n\nInstructions d'analyse d'image:
- Analysez attentivement l'image envoyée
- Si l'image contient un produit ou ingrédient de santé, reliez-le à nos produits biologiques disponibles
- Fournissez des recommandations spécifiques basées sur ce que vous voyez dans l'image
- Si l'image contient une étiquette ou du texte, lisez-le et expliquez son contenu
- Si l'image n'est pas claire ou non liée aux produits de santé, demandez des clarifications
- Soyez utile et suggérez des alternatives biologiques de nos produits
- Expliquez clairement les bienfaits des produits suggérés`;
    
    return baseInstructions + visionInstructions;
};

export const openAIService = {
    // Download and process image from URL
    downloadImage: async (imageUrl, headers = {}) => {
        try {
            console.log(`📥 Downloading image from: ${imageUrl.substring(0, 50)}...`);
            
            const response = await fetch(imageUrl, { 
                method: 'GET',
                headers: headers 
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            
            console.log(`✅ Image downloaded successfully, size: ${uint8Array.length} bytes`);
            return uint8Array;
        } catch (error) {
            console.error('❌ Error downloading image:', error);
            throw error;
        }
    },

    // Validate file type and size
    validateFile: (fileName, fileSize) => {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Check if it's a supported vision file
        if (SUPPORTED_FILE_TYPES.vision.extensions.includes(extension)) {
            if (fileSize > SUPPORTED_FILE_TYPES.vision.maxSizeBytes) {
                return {
                    valid: false,
                    type: 'vision',
                    error: `Image file too large. Maximum size: ${SUPPORTED_FILE_TYPES.vision.maxSizeBytes / (1024 * 1024)}MB`
                };
            }
            return { valid: true, type: 'vision', extension };
        }
        
        // Check if it's a supported document file
        if (SUPPORTED_FILE_TYPES.documents.extensions.includes(extension)) {
            if (fileSize > SUPPORTED_FILE_TYPES.documents.maxSizeBytes) {
                return {
                    valid: false,
                    type: 'documents',
                    error: `Document file too large. Maximum size: ${SUPPORTED_FILE_TYPES.documents.maxSizeBytes / (1024 * 1024)}MB`
                };
            }
            return { valid: true, type: 'documents', extension };
        }
        
        return {
            valid: false,
            type: 'unknown',
            error: `Unsupported file type: ${extension}. Supported types: ${[...SUPPORTED_FILE_TYPES.vision.extensions, ...SUPPORTED_FILE_TYPES.documents.extensions].join(', ')}`
        };
    },

    // Process image with vision model
    processImageMessage: async (threadId, textMessage, imageBuffer, context = {}) => {
        console.log(`\n🖼️ Processing image message with vision model`);
        
        const client = await initializeOpenAI();
        if (!client) {
            throw new Error('OpenAI client not initialized');
        }
        
        const currentModel = getCurrentModel();
        console.log(`📊 Current model: ${currentModel}`);
        
        // Check if current model supports vision
        if (!supportsVision(currentModel)) {
            const errorMsg = context.language === 'ar' 
                ? `عذراً, النموذج الحالي (${currentModel}) لا يدعم تحليل الصور. يرجى إرسال رسالة نصية تصف ما تبحث عنه.`
                : `Désolé, le modèle actuel (${currentModel}) ne prend pas en charge l'analyse d'images. Veuillez envoyer un message texte décrivant ce que vous cherchez.`;
            
            console.log(`❌ Model ${currentModel} does not support vision`);
            return errorMsg;
        }
        
        try {
            // Convert image buffer to base64
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            
            // Determine image type from buffer headers
            const imageType = detectImageType(imageBuffer);
            console.log(`🔍 Detected image type: ${imageType}`);
            
            const { language = 'fr', customerName, userType = 'customer' } = context;
            
            // Build vision-specific instructions
            const visionInstructions = buildVisionInstructions(language, customerName, userType);
            
            // Validate base64 string
            if (!base64Image || base64Image.length === 0) {
                throw new Error('Invalid base64 image data');
            }
            
            // Create data URL
            const dataUrl = `data:image/${imageType};base64,${base64Image}`;
            console.log(`📊 Data URL length: ${dataUrl.length}`);
            console.log(`📊 Data URL preview: ${dataUrl.substring(0, 50)}...`);
            
            // Create vision message
            const visionMessage = {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: textMessage || (language === 'ar' ? 'ما هو هذا المنتج؟' : 'Quel est ce produit?')
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: dataUrl,
                            detail: 'high'
                        }
                    }
                ]
            };
            
            // Use Chat Completions API for vision (more reliable than Assistants API)
            console.log(`🔄 Using Chat Completions API for vision processing`);
            
            const chatCompletion = await client.chat.completions.create({
                model: currentModel,
                messages: [
                    {
                        role: 'system',
                        content: visionInstructions
                    },
                    visionMessage
                ],
                max_tokens: 1000,
                temperature: 0.7
            });
            
            console.log(`✅ Vision processing completed successfully`);
            
            const visionResponse = chatCompletion.choices[0].message.content;
            
            // Now add both the user image and AI response to the thread for context
            await client.beta.threads.messages.create(threadId, {
                role: 'user',
                content: `[IMAGE] ${textMessage || 'User sent an image'}`
            });
            
            await client.beta.threads.messages.create(threadId, {
                role: 'assistant',
                content: visionResponse
            });
            
            console.log(`✅ Vision conversation added to thread context`);
            
            return visionResponse;
            
        } catch (error) {
            console.error('❌ Vision processing error:', error);
            
            // Fallback response
            const fallbackMsg = context.language === 'ar' 
                ? 'عذراً, لم أتمكن من تحليل الصورة. يرجى وصف المنتج الذي تبحث عنه نصياً.'
                : 'Désolé, je n\'ai pas pu analyser l\'image. Veuillez décrire le produit que vous cherchez par texte.';
            
            return fallbackMsg;
        }
    },

    // Create a new OpenAI thread
    createThread: async () => {
        console.log('\n🔄 Creating OpenAI thread...');
        
        // Initialize OpenAI client if not already done
        const client = await initializeOpenAI();
        
        console.log(`- OpenAI client exists: ${!!client}`);
        console.log(`- API key exists: ${!!process.env.OPENAI_API_KEY}`);
        
        if (!client) {
            console.error('❌ OpenAI client not initialized');
            console.log('- Checking environment variables again:');
            console.log(`  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
            console.log(`  - Available env vars: ${Object.keys(process.env).filter(key => key.includes('OPENAI')).join(', ')}`);
            throw new Error('OpenAI not configured. Please set OPENAI_API_KEY environment variable.');
        }

        try {
            const thread = await client.beta.threads.create();
            console.log(`✅ Thread created successfully: ${thread.id}`);
            return thread.id;
        } catch (error) {
            console.error('❌ OpenAI thread creation error:', error);
            throw new Error('Failed to create OpenAI thread: ' + error.message);
        }
    },

    // Enhanced message sending with connection pooling and caching
    sendMessage: async (threadId, message, context = {}) => {
        const connectionId = await connectionPool.acquireConnection();
        
        try {
            // Create cache key for identical requests
            const cacheKey = `${threadId}:${message}:${JSON.stringify(context)}`;
            const cachedResponse = cacheManager.get(cacheKey);
            
            if (cachedResponse) {
                console.log(`🚀 Cache hit for message: ${message.substring(0, 50)}...`);
                return cachedResponse;
            }
            
            // Wrap with circuit breaker and enhanced error handling
            const response = await circuitBreaker.call(async () => {
                console.log(`\n💬 Processing message (Connection: ${connectionId})`);
                console.log(`- Thread: ${threadId}`);
                console.log(`- Message: ${message.substring(0, 100)}...`);
                console.log(`- Context: language=${context.language}, platform=${context.platform}`);
                console.log(`- Circuit breaker: ${circuitBreaker.state}`);
                console.log(`- Pool stats:`, connectionPool.getStats());
                
                // Initialize OpenAI client if not already done
                const client = await initializeOpenAI();
                console.log(`- OpenAI client available: ${!!client}`);
                
                if (!client) {
                    console.warn('⚠️ OpenAI not configured, returning fallback response');
                    // Enhanced fallback with language support
                    const fallbackResponses = {
                        fr: `Merci pour votre message "${message.substring(0, 50)}...". Notre équipe vous répondra bientôt. En attendant, vous pouvez consulter nos produits de lingerie sur notre site ou nous contacter directement.`,
                        ar: `شكراً لرسالتك "${message.substring(0, 50)}...". سيرد عليك فريقنا قريباً. في هذه الأثناء، يمكنك تصفح منتجات الملابس الداخلية على موقعنا أو التواصل معنا مباشرة.`
                    };
                    return fallbackResponses[context.language] || fallbackResponses.fr;
                }

                // Track timing for performance monitoring
                const startTime = Date.now();
                let step = 'initialization';

                try {
                    const { language = 'fr', customerName, userType = 'customer' } = context;
                    
                    // Step 1: Enhanced cleanup with timeout
                    step = 'cleanup';
                    console.log('🧹 Performing thread cleanup...');
                    
                    const cleanupTimeout = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cleanup timeout')), 15000)
                    );
                    
                    try {
                        await Promise.race([
                            openAIService.cleanupActiveRuns(client, threadId),
                            cleanupTimeout
                        ]);
                    } catch (cleanupError) {
                        console.warn('⚠️ Cleanup timeout or failed, continuing anyway:', cleanupError.message);
                    }
                    
                    // Step 2: Add user message with enhanced retry
                    step = 'adding_message';
                    console.log('📝 Adding message to thread...');
                    await openAIService.addMessageWithRetry(client, threadId, message);
                    
                    // Step 3: Execute run with enhanced monitoring
                    step = 'executing_run';
                    console.log('🤖 Creating and executing run...');
                    const response = await openAIService.executeRun(client, threadId, context);
                    
                    const duration = Date.now() - startTime;
                    console.log(`✅ Message processed successfully in ${duration}ms`);
                    
                    // Cache successful responses (but not for personalized messages)
                    if (!customerName && !context.platform) {
                        cacheManager.set(cacheKey, response);
                    }
                    
                    return response;

                } catch (error) {
                    const duration = Date.now() - startTime;
                    console.error(`❌ Error at step '${step}' after ${duration}ms:`, {
                        message: error.message,
                        status: error.status,
                        code: error.code,
                        threadId,
                        step
                    });
                    
                    // Enhanced error classification for better user experience
                    const isRecoverableError = (
                        error.message?.includes('active run') ||
                        error.message?.includes('rate limit') ||
                        error.status === 429 ||
                        error.status >= 500 ||
                        error.message?.includes('timeout')
                    );
                    
                    const isQuotaError = error.message?.includes('quota') || error.status === 402;
                    const isModelError = error.message?.includes('model') && error.status === 400;
                    
                    // Provide specific error responses
                    if (isQuotaError) {
                        const quotaMsg = context.language === 'ar' 
                            ? 'نعتذر، وصلنا للحد الأقصى من الاستخدام اليوم. سيتم استئناف الخدمة قريباً.'
                            : 'Désolé, nous avons atteint la limite d\'utilisation quotidienne. Le service reprendra bientôt.';
                        throw new Error(quotaMsg);
                    }
                    
                    if (isModelError) {
                        console.error('🔧 Model configuration error - may need admin attention');
                    }
                    
                    // Re-throw for circuit breaker to handle
                    throw error;
                }
            });
            
            return response;
            
        } catch (error) {
            // Circuit breaker caught the error, provide appropriate fallback
            if (error.message?.includes('Circuit breaker is OPEN')) {
                console.warn('⚠️ Circuit breaker is open, returning service unavailable message');
                const unavailableMsg = context.language === 'ar' 
                    ? `الخدمة محملة حالياً. يرجى المحاولة مرة أخرى خلال دقيقة. للطوارئ، تواصل معنا مباشرة.`
                    : `Le service est temporairement surchargé. Veuillez réessayer dans une minute. Pour les urgences, contactez-nous directement.`;
                return unavailableMsg;
            }
            
            // Provide contextual error messages
            const errorResponses = {
                fr: error.message?.includes('quota') 
                    ? 'Notre service chat est temporairement indisponible. Notre équipe vous contactera pour vos questions sur nos produits de lingerie.'
                    : `Nous rencontrons une difficulté technique temporaire. Notre équipe vous aidera avec vos questions sur nos produits. Erreur: ${error.message?.substring(0, 100) || 'Service temporairement indisponible'}`,
                ar: error.message?.includes('quota')
                    ? 'خدمة الدردشة غير متاحة مؤقتاً. سيتواصل معك فريقنا للإجابة على أسئلتك حول منتجات الملابس الداخلية.'
                    : `نواجه صعوبة تقنية مؤقتة. سيساعدك فريقنا بأسئلتك حول منتجاتنا. خطأ: ${error.message?.substring(0, 100) || 'الخدمة غير متاحة مؤقتاً'}`
            };
            
            return errorResponses[context.language] || errorResponses.fr;
            
        } finally {
            connectionPool.releaseConnection(connectionId);
        }
    },

    // Enhanced cleanup with better concurrency handling
    cleanupActiveRuns: async (client, threadId) => {
        const cleanupId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        console.log(`🧹 Starting cleanup ${cleanupId} for thread ${threadId}`);
        
        try {
            // First, get current runs with timeout
            const listRunsTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('List runs timeout')), 10000)
            );
            
            const existingRuns = await Promise.race([
                client.beta.threads.runs.list(threadId, { limit: 20 }),
                listRunsTimeout
            ]);
            
            const activeRuns = existingRuns.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            if (activeRuns.length === 0) {
                console.log(`✅ Cleanup ${cleanupId}: No active runs found`);
                return;
            }
            
            console.log(`🧹 Cleanup ${cleanupId}: Found ${activeRuns.length} active run(s), cancelling...`);
            
            // Cancel all active runs with timeout protection
            const cancelPromises = activeRuns.map(async (activeRun) => {
                const cancelTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Cancel timeout for run ${activeRun.id}`)), 5000)
                );
                
                try {
                    await Promise.race([
                        client.beta.threads.runs.cancel(threadId, activeRun.id),
                        cancelTimeout
                    ]);
                    console.log(`✅ Cleanup ${cleanupId}: Cancelled run ${activeRun.id} (was: ${activeRun.status})`);
                    return { id: activeRun.id, success: true };
                } catch (cancelError) {
                    console.warn(`⚠️ Cleanup ${cleanupId}: Failed to cancel run ${activeRun.id}:`, cancelError.message);
                    return { id: activeRun.id, success: false, error: cancelError.message };
                }
            });
            
            const cancelResults = await Promise.allSettled(cancelPromises);
            const successful = cancelResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
            
            console.log(`📊 Cleanup ${cleanupId}: Cancelled ${successful}/${activeRuns.length} runs`);
            
            // Wait for cancellations to take effect with adaptive timeout
            const maxWaitTime = Math.min(activeRuns.length * 2000, 15000); // Max 15 seconds
            let totalWaitTime = 0;
            let waitTime = 1000;
            
            while (totalWaitTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                totalWaitTime += waitTime;
                
                try {
                    // Check status with timeout
                    const statusTimeout = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Status check timeout')), 5000)
                    );
                    
                    const updatedRuns = await Promise.race([
                        client.beta.threads.runs.list(threadId, { limit: 10 }),
                        statusTimeout
                    ]);
                    
                    const stillActiveRuns = updatedRuns.data.filter(run => 
                        ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
                    );
                    
                    if (stillActiveRuns.length === 0) {
                        console.log(`✅ Cleanup ${cleanupId}: All runs successfully cancelled after ${totalWaitTime}ms`);
                        return;
                    }
                    
                    console.log(`⏳ Cleanup ${cleanupId}: ${stillActiveRuns.length} run(s) still active after ${totalWaitTime}ms`);
                    waitTime = Math.min(waitTime * 1.3, 3000); // Adaptive backoff
                    
                } catch (statusError) {
                    console.warn(`⚠️ Cleanup ${cleanupId}: Status check failed:`, statusError.message);
                    break; // Exit wait loop on status check failure
                }
            }
            
            // Final verification
            try {
                const finalRuns = await client.beta.threads.runs.list(threadId, { limit: 5 });
                const finalActiveRuns = finalRuns.data.filter(run => 
                    ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
                );
                
                if (finalActiveRuns.length > 0) {
                    console.warn(`⚠️ Cleanup ${cleanupId}: ${finalActiveRuns.length} runs still active after ${totalWaitTime}ms`);
                    // Don't throw error - let calling code decide how to handle
                }
            } catch (finalCheckError) {
                console.warn(`⚠️ Cleanup ${cleanupId}: Final check failed:`, finalCheckError.message);
            }
            
        } catch (error) {
            console.error(`❌ Cleanup ${cleanupId} failed:`, error.message);
            throw error;
        }
    },

    // Enhanced force cleanup method for stubborn threads
    forceCleanupThread: async (client, threadId) => {
        try {
            console.log(`🔥 Force cleaning thread ${threadId}...`);
            
            // Get all runs, not just recent ones
            const allRuns = await client.beta.threads.runs.list(threadId, { limit: 100 });
            console.log(`📊 Found ${allRuns.data.length} total runs in thread`);
            
            const activeRuns = allRuns.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            if (activeRuns.length === 0) {
                console.log('✅ No active runs found during force cleanup');
                return;
            }
            
            console.log(`🔥 Force cancelling ${activeRuns.length} active run(s)...`);
            
            // Cancel all runs with more aggressive parallel processing
            const cancelPromises = activeRuns.map(async (run) => {
                try {
                    console.log(`🎯 Force cancelling run ${run.id} (status: ${run.status})`);
                    await client.beta.threads.runs.cancel(threadId, run.id);
                    
                    // Wait a bit and check status
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const updatedRun = await client.beta.threads.runs.retrieve(threadId, run.id);
                    console.log(`📍 Run ${run.id} status after cancel: ${updatedRun.status}`);
                    
                    return { id: run.id, success: true, status: updatedRun.status };
                } catch (error) {
                    console.warn(`⚠️ Failed to force cancel run ${run.id}:`, error.message);
                    return { id: run.id, success: false, error: error.message };
                }
            });
            
            const results = await Promise.all(cancelPromises);
            const successful = results.filter(r => r.success).length;
            console.log(`✅ Force cancelled ${successful}/${activeRuns.length} runs`);
            
            // Wait longer for stubborn runs to finish
            let totalWaitTime = 0;
            const maxWaitTime = 20000; // 20 seconds for force cleanup
            let waitTime = 2000; // Start with 2 seconds
            
            while (totalWaitTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                totalWaitTime += waitTime;
                
                // Check status again
                const updatedRuns = await client.beta.threads.runs.list(threadId);
                const stillActiveRuns = updatedRuns.data.filter(run => 
                    ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
                );
                
                if (stillActiveRuns.length === 0) {
                    console.log(`✅ Force cleanup successful after ${totalWaitTime}ms`);
                    return;
                }
                
                console.log(`⏳ Force cleanup: ${stillActiveRuns.length} run(s) still active after ${totalWaitTime}ms`);
                waitTime = Math.min(waitTime * 1.2, 4000); // Slower escalation
            }
            
            // Final desperate measure - list final state
            const finalRuns = await client.beta.threads.runs.list(threadId);
            const finalActiveRuns = finalRuns.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            if (finalActiveRuns.length > 0) {
                console.error(`💀 Force cleanup failed: ${finalActiveRuns.length} runs still active after ${totalWaitTime}ms`);
                console.error('Active runs:', finalActiveRuns.map(r => ({ id: r.id, status: r.status, created_at: r.created_at })));
                // Don't throw here - let the caller decide what to do
            }
            
        } catch (error) {
            console.error('❌ Force cleanup failed:', error.message);
            throw error;
        }
    },

    // Enhanced message addition with intelligent retry and backoff
    addMessageWithRetry: async (client, threadId, message) => {
        const maxRetries = 5; // Reduced for faster failure detection
        const baseWaitTime = 1000; // 1 second base
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                const addMessageTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Add message timeout')), 15000)
                );
                
                await Promise.race([
                    client.beta.threads.messages.create(threadId, {
                        role: 'user',
                        content: message
                    }),
                    addMessageTimeout
                ]);
                
                console.log('✅ Message added to thread successfully');
                return;
                
            } catch (messageError) {
                retryCount++;
                console.error(`❌ Attempt ${retryCount}/${maxRetries} failed:`, messageError.message);
                
                // Enhanced error classification
                const isActiveRunError = messageError.message?.includes('while a run') && 
                                       messageError.message?.includes('is active');
                const isRateLimitError = messageError.status === 429 || 
                                       messageError.message?.includes('rate limit');
                const isServerError = messageError.status >= 500;
                const isTimeoutError = messageError.message?.includes('timeout');
                const isQuotaError = messageError.status === 402 || 
                                   messageError.message?.includes('quota');
                
                if (isQuotaError) {
                    console.error('💳 Quota exceeded - not retrying');
                    throw new Error('OpenAI quota exceeded. Please check your billing status.');
                }
                
                if (isActiveRunError || isRateLimitError || isServerError || isTimeoutError) {
                    if (retryCount < maxRetries) {
                        // Intelligent wait time calculation
                        let waitTime;
                        if (isRateLimitError) {
                            // Respect rate limit headers if available
                            const retryAfter = messageError.headers?.['retry-after'];
                            waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseWaitTime * Math.pow(2, retryCount);
                        } else if (isActiveRunError) {
                            // Shorter wait for active run conflicts
                            waitTime = baseWaitTime + (retryCount * 2000);
                        } else {
                            // Standard exponential backoff
                            waitTime = baseWaitTime * Math.pow(1.8, retryCount);
                        }
                        
                        waitTime = Math.min(waitTime, 30000); // Cap at 30 seconds
                        
                        const errorType = isActiveRunError ? 'Active run' : 
                                        isRateLimitError ? 'Rate limit' : 
                                        isServerError ? 'Server error' : 'Timeout';
                        
                        console.log(`⚠️ ${errorType} detected, retrying in ${waitTime/1000}s (attempt ${retryCount}/${maxRetries})`);
                        
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        // Additional cleanup for active run errors
                        if (isActiveRunError && retryCount > 1) {
                            try {
                                console.log('🧹 Performing additional cleanup due to persistent active runs...');
                                await openAIService.cleanupActiveRuns(client, threadId);
                            } catch (cleanupError) {
                                console.warn('⚠️ Additional cleanup failed:', cleanupError.message);
                            }
                        }
                    }
                } else {
                    // Unexpected error - log and retry a few times anyway
                    console.error(`❌ Unexpected error (${messageError.status}): ${messageError.message}`);
                    
                    if (retryCount < 2) { // Only retry twice for unexpected errors
                        const waitTime = baseWaitTime * retryCount;
                        console.log(`⚠️ Retrying unexpected error in ${waitTime/1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    } else {
                        throw messageError;
                    }
                }
            }
        }
        
        throw new Error(`Failed to add message after ${maxRetries} attempts. Thread may be stuck - please try starting a new conversation.`);
    },

    // Helper method to execute run
    executeRun: async (client, threadId, context) => {
        const { language = 'fr', customerName, userType = 'customer' } = context;
        
        // Get assistant ID
        const assistantId = getAssistantId();
        if (!assistantId) {
            throw new Error('No assistant ID available');
        }

        console.log(`🤖 Creating run with assistant: ${assistantId}`);
        const run = await client.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
            instructions: buildInstructions(language, customerName, userType)
        });

        console.log(`⏳ Waiting for run ${run.id} to complete...`);
        
        // Wait for completion with timeout and better status handling
        let runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        
        while (['running', 'queued', 'in_progress'].includes(runStatus.status)) {
            console.log(`- Run status: ${runStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);
            
            if (attempts >= maxAttempts) {
                console.error('❌ Run timeout - cancelling run');
                try {
                    await client.beta.threads.runs.cancel(threadId, run.id);
                } catch (cancelError) {
                    console.warn('⚠️ Failed to cancel run:', cancelError.message);
                }
                throw new Error('Run timeout after 60 seconds');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
            attempts++;
        }

        console.log(`✅ Run completed with status: ${runStatus.status}`);

        if (runStatus.status === 'completed') {
            // Get the latest message
            const messages = await client.beta.threads.messages.list(threadId);
            const latestMessage = messages.data[0];
            
            if (latestMessage.role === 'assistant') {
                console.log('✅ AI response received successfully');
                return latestMessage.content[0].text.value;
            }
        } else if (runStatus.status === 'requires_action') {
            console.log('🔧 Run requires action - handling function calls');
            return await openAIService.handleRequiresAction(client, threadId, run.id, runStatus);
        }

        // Handle other statuses
        console.error(`❌ Run failed with status: ${runStatus.status}`);
        if (runStatus.last_error) {
            console.error(`❌ Error details:`, runStatus.last_error);
        }
        
        throw new Error(`Run failed with status: ${runStatus.status}`);
    },

    // Helper method to handle requires_action status
    handleRequiresAction: async (client, threadId, runId, runStatus) => {
        try {
            // Handle function calls if needed
            const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];
            
            console.log(`🔧 Processing ${toolCalls.length} function call(s)`);
            
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const parameters = JSON.parse(toolCall.function.arguments);
                console.log(`🛠️ Calling function: ${functionName}`, parameters);
                
                try {
                    const output = await openAIService.handleFunctionCall(functionName, parameters);
                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: output
                    });
                    console.log(`✅ Function ${functionName} executed successfully`);
                } catch (functionError) {
                    console.error(`❌ Function ${functionName} failed:`, functionError);
                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({ error: `Function execution failed: ${functionError.message}` })
                    });
                }
            }
            
            // Submit tool outputs and wait for completion
            console.log(`📤 Submitting ${toolOutputs.length} tool output(s)`);
            await client.beta.threads.runs.submitToolOutputs(threadId, runId, {
                tool_outputs: toolOutputs
            });
            
            // Wait for final completion
            let finalStatus = await client.beta.threads.runs.retrieve(threadId, runId);
            let attempts = 0;
            const maxAttempts = 30;
            
            while (['running', 'queued', 'in_progress'].includes(finalStatus.status)) {
                console.log(`⏳ Function call run status: ${finalStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);
                
                if (attempts >= maxAttempts) {
                    throw new Error('Function call run timeout after 30 seconds');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                finalStatus = await client.beta.threads.runs.retrieve(threadId, runId);
                attempts++;
            }
            
            console.log(`🏁 Function call run completed with status: ${finalStatus.status}`);
            
            if (finalStatus.status === 'completed') {
                const messages = await client.beta.threads.messages.list(threadId);
                const latestMessage = messages.data[0];
                
                if (latestMessage.role === 'assistant') {
                    console.log('✅ AI response with function calls received successfully');
                    return latestMessage.content[0].text.value;
                }
            } else if (finalStatus.status === 'requires_action') {
                // Handle additional function calls (recursive call)
                console.log('🔄 AI wants to make additional function calls');
                return await openAIService.handleRequiresAction(client, threadId, runId, finalStatus);
            } else if (finalStatus.status === 'failed') {
                console.error('❌ Run failed:', finalStatus.last_error);
                throw new Error(`Run failed: ${finalStatus.last_error?.message || 'Unknown error'}`);
            } else if (finalStatus.status === 'cancelled') {
                throw new Error('Run was cancelled');
            } else if (finalStatus.status === 'expired') {
                throw new Error('Run expired');
            }
            
            // Handle any other unexpected status
            console.warn(`⚠️ Unexpected run status: ${finalStatus.status}`);
            throw new Error(`Function call run ended with unexpected status: ${finalStatus.status}`);
            
        } catch (error) {
            console.error('❌ Error in handleRequiresAction:', error);
            throw error;
        }
    },

    // Get or create assistant
    getOrCreateAssistant: async (language = 'fr') => {
        const client = await initializeOpenAI();
        if (!client) {
            throw new Error('OpenAI not configured');
        }

        try {
            // Try to get existing assistant
            const assistants = await client.beta.assistants.list();
            const existingAssistant = assistants.data.find(a => 
                a.name === `Lingerie Store Products Assistant (${language.toUpperCase()})`
            );

            if (existingAssistant) {
                return existingAssistant.id;
            }

            // Create new assistant
            const assistant = await client.beta.assistants.create({
                name: `Lingerie Store Products Assistant (${language.toUpperCase()})`,
                instructions: SYSTEM_CONTEXT[language],
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'get_product_info',
                            description: 'Get detailed information about a specific product',
                            parameters: {
                                type: 'object',
                                properties: {
                                    productId: {
                                        type: 'string',
                                        description: 'The product ID'
                                    }
                                },
                                required: ['productId']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'search_products',
                            description: 'Search for products based on criteria including color, size, and price filters',
                            parameters: {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'Search query for product name or description'
                                    },
                                    category: {
                                        type: 'string',
                                        description: 'Product category filter'
                                    },
                                    color: {
                                        type: 'string',
                                        description: 'Specific color filter for product variants'
                                    },
                                    size: {
                                        type: 'string',
                                        description: 'Specific size filter for product variants'
                                    },
                                    price_min: {
                                        type: 'number',
                                        description: 'Minimum price filter'
                                    },
                                    price_max: {
                                        type: 'number',
                                        description: 'Maximum price filter'
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'get_product_variants',
                            description: 'Get available colors, sizes, and variant options for a specific product',
                            parameters: {
                                type: 'object',
                                properties: {
                                    productId: {
                                        type: 'string',
                                        description: 'The product ID to get variants for'
                                    },
                                    availableOnly: {
                                        type: 'boolean',
                                        description: 'Whether to only return available variants (default: true)'
                                    }
                                },
                                required: ['productId']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'check_product_availability',
                            description: 'Check availability of products, especially supplements',
                            parameters: {
                                type: 'object',
                                properties: {
                                    product_name: {
                                        type: 'string',
                                        description: 'Name or type of product to check'
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'get_all_products',
                            description: 'Get all available products with full details',
                            parameters: {
                                type: 'object',
                                properties: {}
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'save_client_data',
                            description: 'Save client information (name, phone, wilaya) for Algeria',
                            parameters: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        description: 'Full name of the client'
                                    },
                                    phone: {
                                        type: 'string',
                                        description: 'Phone number (Algerian format)'
                                    },
                                    wilaya: {
                                        type: 'string',
                                        description: 'Wilaya (province) in Algeria'
                                    },
                                    address: {
                                        type: 'string',
                                        description: 'Optional address details'
                                    }
                                },
                                required: ['name', 'phone']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'save_order_data',
                            description: 'Save complete order with customer info, product, and delivery details for Algeria',
                            parameters: {
                                type: 'object',
                                properties: {
                                    customer_name: {
                                        type: 'string',
                                        description: 'Full name of the customer'
                                    },
                                    customer_phone: {
                                        type: 'string',
                                        description: 'Customer phone number'
                                    },
                                    wilaya: {
                                        type: 'string',
                                        description: 'Wilaya (province) for delivery'
                                    },
                                    product_name: {
                                        type: 'string',
                                        description: 'Name of the ordered product'
                                    },
                                    product_id: {
                                        type: 'string',
                                        description: 'Product ID'
                                    },
                                    quantity: {
                                        type: 'integer',
                                        description: 'Quantity ordered'
                                    },
                                    unit_price: {
                                        type: 'number',
                                        description: 'Unit price of the product'
                                    },
                                    address: {
                                        type: 'string',
                                        description: 'Optional detailed address'
                                    },
                                    notes: {
                                        type: 'string',
                                        description: 'Optional order notes'
                                    }
                                },
                                required: ['customer_name', 'customer_phone', 'wilaya', 'product_name', 'quantity', 'unit_price']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'send_product_image',
                            description: 'Send a product image to the user when they request to see a product',
                            parameters: {
                                type: 'object',
                                properties: {
                                    product_name: {
                                        type: 'string',
                                        description: 'Name of the product to show image for'
                                    },
                                    product_id: {
                                        type: 'string',
                                        description: 'ID of the product (optional)'
                                    }
                                },
                                required: ['product_name']
                            }
                        }
                    }
                ]
            });

            return assistant.id;
        } catch (error) {
            console.error('Assistant creation error:', error);
            throw new Error('Failed to create or get assistant');
        }
    },

    // Handle function calls (for product information)
    handleFunctionCall: async (functionName, parameters) => {
    console.log(`🔧 Handling function call: ${functionName}`, parameters);
    
    switch (functionName) {
        case 'get_product_info':
            // Use cache helper function for product info
            const product = await getCachedProductById(parameters.productId);
            return product ? JSON.stringify(product) : 'Product not found';
            
        case 'get_product_variants':
            try {
                // Get product variants information
                const variants = await productService.getProductVariants(
                    parameters.productId, 
                    parameters.availableOnly !== false // default to true
                );
                
                const options = await productService.getProductOptions(parameters.productId);
                
                return JSON.stringify({
                    product_id: parameters.productId,
                    variants: variants,
                    available_colors: options.colors,
                    available_sizes: options.sizes,
                    price_range: options.price_range,
                    total_variants: options.total_variants
                });
            } catch (error) {
                console.error('Error getting product variants:', error);
                return JSON.stringify({ error: 'Failed to get product variants' });
            }
            
        case 'search_products':
            // Use enhanced variant-aware search
            const searchResults = await searchCachedProductsWithVariants(
                parameters.query,
                {
                    category: parameters.category,
                    color: parameters.color,
                    size: parameters.size,
                    price_min: parameters.price_min,
                    price_max: parameters.price_max
                }
            );
            // Include basic variant information but remove image URLs
            const resultsWithVariants = searchResults.map(product => {
                const { image_url, product_images, ...productData } = product;
                return {
                    ...productData,
                    // Include essential variant info for AI responses
                    available_colors: product.available_colors?.map(c => c.name || c) || [],
                    available_sizes: product.available_sizes || [],
                    has_variants: product.has_variants || false,
                    variant_count: product.variant_count || 0,
                    price_range: product.price_range || null
                };
            });
            return JSON.stringify(resultsWithVariants);
            
        case 'check_product_availability':
            try {
                // Get products from cache/Supabase
                const allProducts = await getCachedProducts();
                const availableProducts = allProducts.filter(p => 
                    (p.stock_quantity || p.stock || 0) > 0
                );
                
                console.log(`✅ Availability check: ${availableProducts.length}/${allProducts.length} products available`);
                
                return JSON.stringify({
                    totalProducts: allProducts.length,
                    availableProducts: availableProducts.length,
                    products: availableProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        nameAr: p.name_ar,
                        price: p.sale_price || p.base_price || p.price,
                        stock: p.stock_quantity || p.stock,
                        category: p.categories?.name || p.category
                        // Removed image field to prevent markdown inclusion
                    }))
                });
            } catch (error) {
                console.warn('⚠️ Availability check failed, using fallback:', error.message);
                // Fallback to in-memory
                const allProducts = dbUtils.getAllProducts();
                const availableProducts = allProducts.filter(p => p.stock > 0);
                return JSON.stringify({
                    totalProducts: allProducts.length,
                    availableProducts: availableProducts.length,
                    products: availableProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        nameAr: p.nameAr,
                        price: p.price,
                        stock: p.stock,
                        category: p.category
                    }))
                });
            }
                
        case 'get_all_products':
            // Get all products with full details using cache
            const fullProducts = await getCachedProducts();
            // Remove image URLs from response to prevent markdown inclusion
            const productsWithoutImages = fullProducts.map(product => {
                const { product_images, ...productData } = product;
                return productData;
            });
            return JSON.stringify(productsWithoutImages);
                
            case 'save_client_data':
                // Save client information directly to Google Sheets
                try {
                    const { googleSheetsService } = await import('./googleSheets.js');
                    
                    const clientData = {
                        id: `client_${Date.now()}`,
                        name: parameters.name || parameters.client_name || 'Client',
                        phone: parameters.phone || parameters.telephone || '',
                        wilaya: parameters.wilaya || parameters.province || '',
                        address: parameters.address || '',
                        createdAt: new Date().toISOString(),
                        source: 'chat_assistant'
                    };
                    
                    // Save to Google Sheets first
                    const sheetsResult = await googleSheetsService.addCustomer(clientData);
                    
                    // Also save to local database for immediate access
                    const savedClient = dbUtils.addCustomer(clientData);
                    console.log(`✅ Client data saved to Google Sheets and local DB: ${clientData.name} - ${clientData.phone}`);
                    
                    return JSON.stringify({
                        success: true,
                        message: 'Informations client enregistrées avec succès dans Google Sheets',
                        clientId: clientData.id,
                        data: clientData,
                        sheetsSync: sheetsResult ? 'success' : 'failed'
                    });
                } catch (error) {
                    console.error('❌ Error saving client data:', error);
                    
                    // Fallback to local database if Sheets fails
                    try {
                        const clientData = {
                            id: `client_${Date.now()}`,
                            name: parameters.name || parameters.client_name || 'Client',
                            phone: parameters.phone || parameters.telephone || '',
                            wilaya: parameters.wilaya || parameters.province || '',
                            address: parameters.address || '',
                            createdAt: new Date().toISOString(),
                            source: 'chat_assistant'
                        };
                        
                        const savedClient = dbUtils.addCustomer(clientData);
                        console.log(`⚠️ Client saved to local DB only (Sheets failed): ${clientData.name}`);
                        
                        return JSON.stringify({
                            success: true,
                            message: 'Informations client enregistrées محلياً (Google Sheets غير متاحة)',
                            clientId: clientData.id,
                            data: clientData,
                            sheetsSync: 'failed',
                            error: error.message
                        });
                    } catch (fallbackError) {
                        return JSON.stringify({
                            success: false,
                            message: 'Erreur lors de l\'enregistrement des informations client',
                            error: fallbackError.message
                        });
                    }
                }
                
            case 'save_order_data':
                // Save complete order using Supabase with Google Sheets sync
                try {
                    // Prepare customer data for Supabase
                    const supabaseCustomerData = {
                        platformId: parameters.customer_phone || parameters.phone || `chat_${Date.now()}`,
                        platformType: 'chat',
                        name: parameters.customer_name || parameters.name,
                        phone: parameters.customer_phone || parameters.phone,
                        email: parameters.customer_email || '',
                        wilaya: parameters.wilaya,
                        address: parameters.address || ''
                    };

                    // Prepare order items
                    const orderItems = [{
                        product_id: parameters.product_id || parameters.productId,
                        quantity: parseInt(parameters.quantity) || 1
                    }];

                    // Prepare order data
                    const supabaseOrderData = {
                        shippingAddress: parameters.address || '',
                        wilaya: parameters.wilaya,
                        phone: parameters.customer_phone || parameters.phone,
                        notes: parameters.notes || 'Commande via assistant chat'
                    };

                    // Create order using Supabase service
                    const order = await orderService.createOrder(supabaseCustomerData, orderItems, supabaseOrderData);
                    
                    console.log(`✅ Order created in Supabase:`, order.id);
                    
                    // Sync to Google Sheets using the full Supabase order object
                    const { googleSheetsService } = await import('./googleSheets.js');
                    let sheetsResult = false;
                    try {
                        sheetsResult = await googleSheetsService.addOrder(order);
                        console.log(`✅ Order synced to Google Sheets: ${order.order_number}`);
                    } catch (sheetsError) {
                        console.warn(`⚠️ Failed to sync order to Google Sheets: ${sheetsError.message}`);
                    }
                    
                    // Sync customer to Google Sheets (if not already exists)
                    let customerSheetsResult = false;
                    try {
                        // Transform Supabase customer to Google Sheets format
                        const customerData = {
                            id: order.customers.id,
                            name: order.customers.name,
                            phone: order.customers.phone,
                            email: order.customers.email,
                            platform_type: order.customers.platform_type,
                            platform_id: order.customers.platform_id,
                            wilaya: parameters.wilaya || '',
                            address: parameters.address || '',
                            preferred_language: 'fr',
                            total_orders: 1,
                            total_spent: order.total_amount,
                            is_vip: false,
                            first_contact_date: new Date().toISOString(),
                            last_contact_date: new Date().toISOString(),
                            last_order_date: order.created_at
                        };
                        
                        customerSheetsResult = await googleSheetsService.addCustomer(customerData);
                        console.log(`✅ Customer synced to Google Sheets: ${order.customers.name}`);
                    } catch (customerError) {
                        console.warn(`⚠️ Failed to sync customer to Google Sheets: ${customerError.message}`);
                    }
                    
                    // Extract order details for display
                    const productNames = order.order_items?.map(item => item.products?.name || 'Product').join(', ') || 'Product';
                    const totalQuantity = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                    const unitPrice = order.order_items?.[0]?.unit_price || 0;
                    
                    return JSON.stringify({
                        success: true,
                        message: 'Commande enregistrée avec succès dans Supabase et Google Sheets',
                        orderId: order.id,
                        orderNumber: order.order_number,
                        customerId: order.customers.id,
                        supabaseOrder: order,
                        summary: `✅ COMMANDE CONFIRMÉE ET ENREGISTRÉE ✅\n\n📋 Détails de la commande:\n• Numéro: ${order.order_number}\n• Produit(s): ${productNames}\n• Quantité: ${totalQuantity}\n• Prix unitaire: ${unitPrice} DA\n• Total: ${order.total_amount} DA\n\n👤 Informations client:\n• Nom: ${order.customers.name}\n• Téléphone: ${order.customers.phone}\n• Wilaya: ${parameters.wilaya}\n\n📊 Statut: ${order.status}\n�️ Enregistré dans Supabase: ✅\n🔗 Synchronisé Google Sheets: ${sheetsResult ? '✅' : '❌'}\n👥 Client synchronisé: ${customerSheetsResult ? '✅' : '❌'}`,
                        supabaseSync: 'success',
                        sheetsSync: sheetsResult ? 'success' : 'failed',
                        customerSync: customerSheetsResult ? 'success' : 'failed'
                    });
                } catch (error) {
                    console.error('❌ Error saving order data:', error);
                    
                    // Fallback to local database if Sheets fails
                    try {
                        const orderData = {
                            id: `order_${Date.now()}`,
                            customerName: parameters.customer_name || parameters.name || 'Client',
                            customerPhone: parameters.customer_phone || parameters.phone || parameters.telephone || '',
                            wilaya: parameters.wilaya || parameters.province || '',
                            address: parameters.address || '',
                            productId: parameters.product_id || parameters.productId || '',
                            productName: parameters.product_name || parameters.productName || '',
                            quantity: parseInt(parameters.quantity) || 1,
                            unitPrice: parseFloat(parameters.unit_price || parameters.price) || 0,
                            totalAmount: (parseInt(parameters.quantity) || 1) * (parseFloat(parameters.unit_price || parameters.price) || 0),
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            source: 'chat_assistant',
                            notes: parameters.notes || 'Commande via assistant chat - Google Sheets indisponible'
                        };
                        
                        const customerData = {
                            id: `customer_${Date.now()}`,
                            name: orderData.customerName,
                            phone: orderData.customerPhone,
                            email: orderData.customerEmail || '',
                            wilaya: orderData.wilaya,
                            address: orderData.address,
                            createdAt: new Date().toISOString(),
                            source: 'chat_assistant',
                            notes: `Client from order ${orderData.id} - Google Sheets indisponible`
                        };
                        
                        const savedOrder = dbUtils.addOrder(orderData);
                        const savedCustomer = dbUtils.addCustomer(customerData);
                        console.log(`⚠️ Order and customer saved to local DB only (Sheets failed): ${orderData.id}`);
                        
                        return JSON.stringify({
                            success: true,
                            message: 'Commande enregistrée localement (Google Sheets indisponible)',
                            orderId: orderData.id,
                            customerId: customerData.id,
                            data: orderData,
                            customerData: customerData,
                            summary: `⚠️ COMMANDE ENREGISTRÉE LOCALEMENT ⚠️\n\n📋 Détails de la commande:\n• Produit: ${orderData.productName}\n• Quantité: ${orderData.quantity}\n• Prix unitaire: ${orderData.unitPrice}€\n• Total: ${orderData.totalAmount}€\n\n👤 Informations client:\n• Nom: ${orderData.customerName}\n• Téléphone: ${orderData.customerPhone}\n• Wilaya: ${orderData.wilaya}\n\n⚠️ Note: Google Sheets temporairement indisponible, commande et client sauvegardés محلياً`,
                            sheetsSync: 'failed',
                            customerSync: 'failed',
                            error: error.message
                        });
                    } catch (fallbackError) {
                        return JSON.stringify({
                            success: false,
                            message: 'Erreur lors de l\'enregistrement de la commande',
                            error: fallbackError.message
                        });
                    }
                }
                
            case 'send_product_image':
                // Send product image to user
                try {
                    // Handle both parameter names for compatibility
                    const productName = parameters.product_name || parameters.productName;
                    const productId = parameters.product_id || parameters.productId;
                    
                    console.log(`🖼️ Looking for image for product: ${productName}`);
                    
                    if (!productName) {
                        console.log(`❌ No product name provided in parameters:`, parameters);
                        return JSON.stringify({
                            success: false,
                            message: 'Product name is required',
                            parameters: parameters
                        });
                    }
                    
                    const imageData = await findProductImageFromSupabase(productName, productId);
                    
                    if (!imageData) {
                        console.log(`❌ No image found for product: ${productName}`);
                        // Get available products from cache for error message
                        const availableProducts = await getCachedProducts();
                        const productNames = availableProducts.map(p => p.name);
                        
                        return JSON.stringify({
                            success: false,
                            message: 'Image not available for this product',
                            productName: productName,
                            availableProducts: productNames
                        });
                    }
                    
                    console.log(`✅ Image found for ${productName}: ${imageData.url}`);
                    
                    // Store the image data globally for the webhook to access
                    global.pendingImageSend = {
                        success: true,
                        action: 'send_image',
                        imageUrl: imageData.url,
                        caption: null, // No caption, image will be sent separately
                        alt: imageData.alt,
                        productName: productName
                    };
                    
                    // Return success message for the AI to use
                    return `تم العثور على صورة المنتج ${productName}. سيتم إرسالها.`;
                    
                } catch (error) {
                    console.error('❌ Error sending product image:', error);
                    return JSON.stringify({
                        success: false,
                        message: 'Erreur lors de l\'envoi de l\'image du produit',
                        error: error.message
                    });
                }
                
            default:
                console.warn(`⚠️ Unknown function called: ${functionName}`);
                return JSON.stringify({ 
                    error: `Function ${functionName} not found`, 
                    availableFunctions: [
                        'get_product_info', 
                        'search_products', 
                        'check_product_availability', 
                        'get_all_products',
                        'save_client_data',
                        'save_order_data',
                        'send_product_image'
                    ] 
                });
        }
    },

    // Method to diagnose and potentially fix thread issues
    diagnoseThread: async (threadId) => {
        const client = await initializeOpenAI();
        if (!client) return { status: 'error', message: 'OpenAI not configured' };

        try {
            console.log(`🔍 Diagnosing thread ${threadId}...`);
            
            // Get thread info
            const thread = await client.beta.threads.retrieve(threadId);
            console.log(`Thread created: ${thread.created_at}`);
            
            // Get recent runs
            const runs = await client.beta.threads.runs.list(threadId, { limit: 20 });
            console.log(`Total runs: ${runs.data.length}`);
            
            const activeRuns = runs.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            const completedRuns = runs.data.filter(run => run.status === 'completed');
            const failedRuns = runs.data.filter(run => run.status === 'failed');
            const cancelledRuns = runs.data.filter(run => run.status === 'cancelled');
            
            console.log(`Active runs: ${activeRuns.length}`);
            console.log(`Completed runs: ${completedRuns.length}`);
            console.log(`Failed runs: ${failedRuns.length}`);
            console.log(`Cancelled runs: ${cancelledRuns.length}`);
            
            // Get recent messages
            const messages = await client.beta.threads.messages.list(threadId, { limit: 10 });
            console.log(`Total messages: ${messages.data.length}`);
            
            const diagnosis = {
                threadId,
                created: new Date(thread.created_at * 1000).toISOString(),
                runs: {
                    total: runs.data.length,
                    active: activeRuns.length,
                    completed: completedRuns.length,
                    failed: failedRuns.length,
                    cancelled: cancelledRuns.length
                },
                messages: messages.data.length,
                activeRunDetails: activeRuns.map(run => ({
                    id: run.id,
                    status: run.status,
                    created: new Date(run.created_at * 1000).toISOString(),
                    age_ms: Date.now() - (run.created_at * 1000)
                })),
                isStuck: activeRuns.length > 0 && activeRuns.some(run => 
                    Date.now() - (run.created_at * 1000) > 60000 // Stuck if older than 1 minute
                )
            };
            
            console.log('📊 Thread diagnosis:', diagnosis);
            return { status: 'success', diagnosis };
            
        } catch (error) {
            console.error('❌ Thread diagnosis failed:', error);
            return { status: 'error', message: error.message };
        }
    },
};

export default openAIService;