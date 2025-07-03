import OpenAI from 'openai';
import { dbUtils } from '../models/database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenAI client will be initialized lazily
let openai = null;
let isInitialized = false;

// Helper function to get assistant ID
const getAssistantId = () => {
    try {
        const assistantIdPath = join(__dirname, '../../.assistant-id');
        const assistantId = readFileSync(assistantIdPath, 'utf8').trim();
        console.log(`✅ Assistant ID loaded from file: ${assistantId}`);
        return assistantId;
    } catch (error) {
        console.warn('❌ Could not read .assistant-id file, using environment variable or creating new assistant');
        return process.env.OPENAI_ASSISTANT_ID;
    }
};

// Initialize OpenAI client (called lazily when first needed)
const initializeOpenAI = () => {
    if (isInitialized) {
        return openai;
    }

    console.log('\n🔧 OpenAI Service Initialization:');
    console.log('================================');
    console.log(`- OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
    
    if (process.env.OPENAI_API_KEY) {
        console.log(`- Key length: ${process.env.OPENAI_API_KEY.length}`);
        console.log(`- Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
        
        try {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            console.log('✅ OpenAI client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize OpenAI client:', error.message);
            openai = null;
        }
    } else {
        console.error('❌ OPENAI_API_KEY is not set in environment variables');
        console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
        openai = null;
    }
    
    console.log(`- OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}`);
    console.log('================================\n');
    
    isInitialized = true;
    return openai;
};

// Bio products context for AI assistant
const SYSTEM_CONTEXT = {
    fr: `Tu es un assistant commercial expert pour X Company, spécialisé dans les produits biologiques et naturels. 

PRODUITS DISPONIBLES:
- Poudre de Protéines Bio (Vanille) - 45.99€ - Récupération musculaire, protéines complètes
- Thé Vert Biologique (50 sachets) - 18.99€ - Antioxydants, boost métabolisme
- Complexe Multivitamines Bio - 32.99€ - Support immunitaire, énergie naturelle
- Miel Pur Biologique (500g) - 24.99€ - Antibactérien naturel, source d'énergie
- Huile de Poisson Oméga-3 Bio - 28.99€ - Santé cardiovasculaire, fonction cérébrale
- Huile de Noix de Coco Biologique (500ml) - 22.99€ - MCT naturels, polyvalent
- Comprimés de Spiruline Bio - 35.99€ - Protéines complètes, détoxification
- Graines de Chia Biologiques (250g) - 16.99€ - Oméga-3 végétal, fibres

PROCESSUS DE COMMANDE POUR L'ALGÉRIE:
1. Présenter le produit et son prix
2. Demander: NOM COMPLET du client
3. Demander: NUMÉRO DE TÉLÉPHONE (format algérien)
4. Demander: WILAYA (province) de livraison
5. Confirmer la commande avec tous les détails

INSTRUCTIONS:
- Sois chaleureux, professionnel et informatif
- Recommande des produits adaptés aux besoins du client
- Explique les bienfaits des produits biologiques
- Pour les commandes, collecte OBLIGATOIREMENT: nom, téléphone, wilaya
- Utilise la fonction save_order_data pour enregistrer les commandes complètes
- Réponds en français sauf si le client préfère l'arabe
- Pose des questions pour mieux comprendre les besoins`,

    ar: `أنت مساعد مبيعات خبير لشركة X، متخصص في المنتجات العضوية والطبيعية.

المنتجات المتوفرة:
- مسحوق البروتين العضوي بالفانيليا - 45.99€ - استعادة العضلات، بروتينات كاملة
- الشاي الأخضر العضوي (50 كيس) - 18.99€ - مضادات الأكسدة، تعزيز الأيض
- مجمع الفيتامينات العضوي - 32.99€ - دعم المناعة، طاقة طبيعية
- العسل الطبيعي العضوي (500 جرام) - 24.99€ - مضاد بكتيري طبيعي، مصدر طاقة
- زيت السمك أوميغا-3 العضوي - 28.99€ - صحة القلب، وظائف الدماغ
- زيت جوز الهند العضوي (500 مل) - 22.99€ - MCT طبيعية، متعدد الاستخدامات
- أقراص السبيرولينا العضوية - 35.99€ - بروتينات كاملة، تطهير الجسم
- بذور الشيا العضوية (250 جرام) - 16.99€ - أوميغا-3 نباتي، ألياف

عملية الطلب للجزائر:
1. عرض المنتج وسعره
2. طلب: الاسم الكامل للعميل
3. طلب: رقم الهاتف (تنسيق جزائري)
4. طلب: الولاية للتسليم
5. تأكيد الطلب مع جميع التفاصيل

التعليمات:
- كن ودودًا ومهنيًا ومفيدًا
- اقترح المنتجات المناسبة لاحتياجات العميل
- اشرح فوائد المنتجات العضوية
- للطلبات، اجمع إلزامياً: الاسم، الهاتف، الولاية
- استخدم وظيفة save_order_data لحفظ الطلبات الكاملة
- أجب بالعربية إلا إذا فضل العميل الفرنسية
- اطرح أسئلة لفهم الاحتياجات بشكل أفضل`
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

export const openAIService = {
    // Create a new OpenAI thread
    createThread: async () => {
        console.log('\n🔄 Creating OpenAI thread...');
        
        // Initialize OpenAI client if not already done
        const client = initializeOpenAI();
        
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

    // Send a message and get AI response
    sendMessage: async (threadId, message, context = {}) => {
        console.log(`\n💬 Sending message to thread ${threadId}`);
        console.log(`- Message: ${message.substring(0, 50)}...`);
        
        // Initialize OpenAI client if not already done
        const client = initializeOpenAI();
        console.log(`- OpenAI client exists: ${!!client}`);
        
        if (!client) {
            console.warn('⚠️ OpenAI not configured, returning fallback response');
            // Fallback response when OpenAI is not configured
            return `Merci pour votre message. Notre équipe vous répondra bientôt. En attendant, vous pouvez consulter nos produits biologiques sur notre site.`;
        }

        try {
            const { language = 'fr', customerName, userType = 'customer' } = context;
            
            // Step 1: Comprehensive cleanup of any existing active runs
            console.log('🧹 Checking for existing active runs...');
            await openAIService.cleanupActiveRuns(client, threadId);
            
            // Step 2: Add user message to thread with retry logic
            console.log('📝 Adding message to thread...');
            await openAIService.addMessageWithRetry(client, threadId, message);
            
            // Step 3: Create and execute run
            console.log('🤖 Creating and executing run...');
            const response = await openAIService.executeRun(client, threadId, context);
            
            return response;

        } catch (error) {
            console.error('❌ OpenAI message error:', error);
            
            // Fallback responses based on language
            const fallbackResponses = {
                fr: `Je suis désolé, je rencontre des difficultés techniques. Notre équipe vous contactera bientôt pour vous aider avec vos questions sur nos produits biologiques.`,
                ar: `أعتذر، أواجه صعوبات تقنية. سيتواصل معك فريقنا قريباً لمساعدتك بأسئلتك حول منتجاتنا العضوية.`
            };
            
            return fallbackResponses[context.language] || fallbackResponses.fr;
        }
    },

    // Helper method to clean up active runs
    cleanupActiveRuns: async (client, threadId) => {
        try {
            const existingRuns = await client.beta.threads.runs.list(threadId);
            const activeRuns = existingRuns.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            if (activeRuns.length === 0) {
                console.log('✅ No active runs found');
                return;
            }
            
            console.log(`🧹 Found ${activeRuns.length} active run(s), cancelling them...`);
            
            // Cancel all active runs in parallel
            const cancelPromises = activeRuns.map(async (activeRun) => {
                try {
                    await client.beta.threads.runs.cancel(threadId, activeRun.id);
                    console.log(`✅ Cancelled run: ${activeRun.id} (status: ${activeRun.status})`);
                    return true;
                } catch (cancelError) {
                    console.warn(`⚠️ Failed to cancel run ${activeRun.id}:`, cancelError.message);
                    return false;
                }
            });
            
            await Promise.all(cancelPromises);
            
            // Wait for cancellations to take effect with exponential backoff
            let waitTime = 1000; // Start with 1 second
            const maxWaitTime = 10000; // Max 10 seconds total
            let totalWaitTime = 0;
            
            while (totalWaitTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                totalWaitTime += waitTime;
                
                // Check if any runs are still active
                const updatedRuns = await client.beta.threads.runs.list(threadId);
                const stillActiveRuns = updatedRuns.data.filter(run => 
                    ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
                );
                
                if (stillActiveRuns.length === 0) {
                    console.log('✅ All runs successfully cancelled');
                    return;
                }
                
                console.log(`⏳ Still waiting... ${stillActiveRuns.length} run(s) still active (waited ${totalWaitTime}ms)`);
                waitTime = Math.min(waitTime * 1.5, 3000); // Exponential backoff, max 3s per wait
            }
            
            // Final check - if still active, throw error
            const finalRuns = await client.beta.threads.runs.list(threadId);
            const finalActiveRuns = finalRuns.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            if (finalActiveRuns.length > 0) {
                console.error(`❌ Could not cancel all active runs after ${totalWaitTime}ms. ${finalActiveRuns.length} still active.`);
                throw new Error(`Thread has ${finalActiveRuns.length} active runs that could not be cancelled. Please try again in a moment.`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error during run cleanup:', error.message);
            throw error;
        }
    },

    // Helper method to add message with retry logic
    addMessageWithRetry: async (client, threadId, message) => {
        const maxRetries = 5;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                await client.beta.threads.messages.create(threadId, {
                    role: 'user',
                    content: message
                });
                console.log('✅ Message added to thread successfully');
                return;
                
            } catch (messageError) {
                retryCount++;
                
                if (messageError.message && messageError.message.includes('while a run') && messageError.message.includes('is active')) {
                    const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s, 32s
                    console.log(`⚠️ Active run detected, retrying in ${waitTime/1000}s (attempt ${retryCount}/${maxRetries})`);
                    
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        // Try additional cleanup before retry
                        try {
                            await openAIService.cleanupActiveRuns(client, threadId);
                        } catch (cleanupError) {
                            console.warn('⚠️ Additional cleanup failed:', cleanupError.message);
                        }
                    }
                } else {
                    // Different error, don't retry
                    throw messageError;
                }
            }
        }
        
        throw new Error(`Could not add message to thread after ${maxRetries} attempts. Please try again in a moment.`);
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
        // Handle function calls if needed
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const parameters = JSON.parse(toolCall.function.arguments);
            console.log(`🛠️ Calling function: ${functionName}`);
            
            const output = await openAIService.handleFunctionCall(functionName, parameters);
            toolOutputs.push({
                tool_call_id: toolCall.id,
                output: output
            });
        }
        
        // Submit tool outputs and wait for completion
        await client.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: toolOutputs
        });
        
        // Wait for final completion
        let finalStatus = await client.beta.threads.runs.retrieve(threadId, runId);
        let attempts = 0;
        const maxAttempts = 30;
        
        while (['running', 'queued', 'in_progress'].includes(finalStatus.status)) {
            if (attempts >= maxAttempts) {
                throw new Error('Function call run timeout');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            finalStatus = await client.beta.threads.runs.retrieve(threadId, runId);
            attempts++;
        }
        
        if (finalStatus.status === 'completed') {
            const messages = await client.beta.threads.messages.list(threadId);
            const latestMessage = messages.data[0];
            
            if (latestMessage.role === 'assistant') {
                console.log('✅ AI response with function calls received successfully');
                return latestMessage.content[0].text.value;
            }
        }
        
        throw new Error(`Function call run failed with status: ${finalStatus.status}`);
    },

    // Get or create assistant
    getOrCreateAssistant: async (language = 'fr') => {
        const client = initializeOpenAI();
        if (!client) {
            throw new Error('OpenAI not configured');
        }

        try {
            // Try to get existing assistant
            const assistants = await client.beta.assistants.list();
            const existingAssistant = assistants.data.find(a => 
                a.name === `X Company Bio Products Assistant (${language.toUpperCase()})`
            );

            if (existingAssistant) {
                return existingAssistant.id;
            }

            // Create new assistant
            const assistant = await client.beta.assistants.create({
                name: `X Company Bio Products Assistant (${language.toUpperCase()})`,
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
                            description: 'Search for products based on criteria',
                            parameters: {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'Search query'
                                    },
                                    category: {
                                        type: 'string',
                                        description: 'Product category'
                                    }
                                }
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
                const product = dbUtils.getProductById(parameters.productId);
                return product ? JSON.stringify(product) : 'Product not found';
                
            case 'search_products':
                const products = parameters.query 
                    ? dbUtils.searchProducts(parameters.query)
                    : parameters.category 
                        ? dbUtils.getProductsByCategory(parameters.category)
                        : dbUtils.getAllProducts();
                return JSON.stringify(products);
                
            case 'check_product_availability':
                // Check availability of products
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
                
            case 'get_all_products':
                // Get all products with full details
                const fullProducts = dbUtils.getAllProducts();
                return JSON.stringify(fullProducts);
                
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
                            message: 'Informations client enregistrées localement (Google Sheets indisponible)',
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
                // Save complete order directly to Google Sheets
                try {
                    const { googleSheetsService } = await import('./googleSheets.js');
                    
                    const orderData = {
                        id: `order_${Date.now()}`,
                        customerName: parameters.customer_name || parameters.name || 'Client',
                        customerPhone: parameters.customer_phone || parameters.phone || parameters.telephone || '',
                        customerEmail: parameters.customer_email || '',
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
                        notes: parameters.notes || 'Commande via assistant chat'
                    };
                    
                    // Also save customer data to Customers sheet
                    const customerData = {
                        id: `customer_${Date.now()}`,
                        name: orderData.customerName,
                        phone: orderData.customerPhone,
                        email: orderData.customerEmail,
                        wilaya: orderData.wilaya,
                        address: orderData.address,
                        createdAt: new Date().toISOString(),
                        source: 'chat_assistant',
                        notes: `Client from order ${orderData.id}`
                    };
                    
                    // Save to Google Sheets first (primary database)
                    const sheetsResult = await googleSheetsService.addOrder(orderData);
                    
                    // Also save customer data to Customers sheet
                    let customerSheetsResult = false;
                    try {
                        customerSheetsResult = await googleSheetsService.addCustomer(customerData);
                        console.log(`✅ Customer data also saved to Customers sheet: ${customerData.name}`);
                    } catch (customerError) {
                        console.warn(`⚠️ Failed to save customer to Customers sheet: ${customerError.message}`);
                    }
                    
                    // Also save to local database for immediate access
                    const savedOrder = dbUtils.addOrder(orderData);
                    const savedCustomer = dbUtils.addCustomer(customerData);
                    console.log(`✅ Order saved to Google Sheets and local DB: ${orderData.id} - ${orderData.productName} for ${orderData.customerName}`);
                    
                    return JSON.stringify({
                        success: true,
                        message: 'Commande enregistrée avec succès dans Google Sheets',
                        orderId: orderData.id,
                        customerId: customerData.id,
                        data: orderData,
                        customerData: customerData,
                        summary: `✅ COMMANDE CONFIRMÉE ET ENREGISTRÉE ✅\n\n📋 Détails de la commande:\n• Produit: ${orderData.productName}\n• Quantité: ${orderData.quantity}\n• Prix unitaire: ${orderData.unitPrice}€\n• Total: ${orderData.totalAmount}€\n\n👤 Informations client:\n• Nom: ${orderData.customerName}\n• Téléphone: ${orderData.customerPhone}\n• Wilaya: ${orderData.wilaya}\n\n📊 Statut: En attente de traitement\n🔗 Enregistré dans Google Sheets: ${sheetsResult ? '✅' : '❌'}\n👥 Client enregistré: ${customerSheetsResult ? '✅' : '❌'}`,
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
                            summary: `⚠️ COMMANDE ENREGISTRÉE LOCALEMENT ⚠️\n\n📋 Détails de la commande:\n• Produit: ${orderData.productName}\n• Quantité: ${orderData.quantity}\n• Prix unitaire: ${orderData.unitPrice}€\n• Total: ${orderData.totalAmount}€\n\n👤 Informations client:\n• Nom: ${orderData.customerName}\n• Téléphone: ${orderData.customerPhone}\n• Wilaya: ${orderData.wilaya}\n\n⚠️ Note: Google Sheets temporairement indisponible, commande et client sauvegardés localement`,
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
                        'save_order_data'
                    ] 
                });
        }
    }
};

export default openAIService;