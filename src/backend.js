// X Company Bio Products Sales Agent - Cloudflare Worker Backend
// Pure API backend for bio products sales

import { OpenAI } from 'openai';

// Fixed Assistant ID
const ASSISTANT_ID = 'asst_6L1tElqeiaK2fNBoLNuy7tgp';

// Mock Database for X Company Bio Products
const bioProductsData = {
    'poudre-proteinee-bio': { id: 'poudre-proteinee-bio', name: 'X Poudre de Protéines Bio (Vanille)', price: 45.99, stock: 25, category: 'Compléments' },
    'the-vert-biologique': { id: 'the-vert-biologique', name: 'X Thé Vert Biologique (50 sachets)', price: 18.99, stock: 40, category: 'Boissons' },
    'multivitamines-bio': { id: 'multivitamines-bio', name: 'X Complexe Multivitamines Bio', price: 32.99, stock: 15, category: 'Compléments' },
    'miel-biologique': { id: 'miel-biologique', name: 'X Miel Pur Biologique (500g)', price: 24.99, stock: 30, category: 'Alimentation' },
    'omega3-bio': { id: 'omega3-bio', name: 'X Huile de Poisson Oméga-3 Bio', price: 28.99, stock: 24, category: 'Compléments' },
    'huile-noix-coco-biologique': { id: 'huile-noix-coco-biologique', name: 'X Huile de Noix de Coco Biologique (500ml)', price: 22.99, stock: 35, category: 'Alimentation' },
    'spiruline-bio': { id: 'spiruline-bio', name: 'X Comprimés de Spiruline Bio', price: 35.99, stock: 18, category: 'Compléments' },
    'graines-chia-biologiques': { id: 'graines-chia-biologiques', name: 'X Graines de Chia Biologiques (250g)', price: 16.99, stock: 45, category: 'Alimentation' }
};

// JWT utility functions for Google Sheets authentication
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function createJWT(serviceAccountEmail, privateKey) {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    let cleanPrivateKey = privateKey
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(cleanPrivateKey), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
        },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
    return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(serviceAccountEmail, privateKey) {
    const jwt = await createJWT(serviceAccountEmail, privateKey);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Google Sheets integration functions
async function addCustomerToSheet(customer, env) {
    try {
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
            console.log(`⚠️ [CF] Google Sheets credentials not configured`);
            return true;
        }

        const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, env.GOOGLE_PRIVATE_KEY);

        const timestamp = new Date(customer.createdAt).toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const values = [[
            customer.id,
            customer.name,
            customer.phone,
            timestamp,
            customer.wilaya || 'Non spécifiée',
            timestamp
        ]];

        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Customers!A:F:append?valueInputOption=RAW`;
        
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            throw new Error(`Customer Sheets API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [CF] Error adding customer to Google Sheets:`, error);
        return false;
    }
}

async function addOrderToSheet(order, env) {
    try {
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
            console.log(`⚠️ [CF] Google Sheets credentials not configured`);
            return true;
        }

        const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, env.GOOGLE_PRIVATE_KEY);

        const timestamp = new Date(order.createdAt).toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        let buyIntent = 'Ready to Purchase';
        if (order.totalAmount > 100) {
            buyIntent = 'High Value Buyer';
        } else if (order.quantity > 3) {
            buyIntent = 'Bulk Buyer';
        } else if (order.totalAmount < 30) {
            buyIntent = 'Budget Conscious';
        }

        const values = [[
            timestamp,
            order.id,
            order.customerName || 'Non spécifié',
            order.productName,
            order.quantity,
            order.unitPrice,
            order.totalAmount,
            order.customerPhone,
            order.wilaya || 'Non spécifiée',
            buyIntent
        ]];

        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Orders!A:J:append?valueInputOption=RAW`;
        
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [CF] Error adding to Google Sheets:`, error);
        return false;
    }
}

// Function implementations
const functions = {
    check_product_availability: async ({ product_name }, env) => {
        const products = bioProductsData;
        
        // Auto-detect category
        let category = null;
        if (product_name) {
            const query = product_name.toLowerCase();
            if (query.includes('complément') || query.includes('supplement') || query.includes('protéine') || query.includes('protein') || 
                query.includes('vitamine') || query.includes('vitamin') || query.includes('omega') || query.includes('oméga') || 
                query.includes('spiruline') || query.includes('spirulina')) {
                category = 'Compléments';
            } else if (query.includes('alimentation') || query.includes('food') || query.includes('miel') || query.includes('honey') || 
                      query.includes('huile') || query.includes('oil') || query.includes('graines') || query.includes('seeds')) {
                category = 'Alimentation';
            } else if (query.includes('thé') || query.includes('tea') || query.includes('boisson') || query.includes('beverage')) {
                category = 'Boissons';
            }
        }

        let filteredProducts = products;
        if (category) {
            filteredProducts = Object.fromEntries(
                Object.entries(products).filter(([key, product]) => product.category === category)
            );
        }

        const formatAvailableProducts = (prods) => {
            const productsByCategory = {};
            Object.values(prods).filter(p => p.stock > 0).forEach(p => {
                if (!productsByCategory[p.category]) {
                    productsByCategory[p.category] = [];
                }
                productsByCategory[p.category].push(p);
            });

            let result = `🌿 X Company Bio Products Available:\n\n`;
            
            Object.entries(productsByCategory).forEach(([cat, products]) => {
                const categoryEmoji = cat === 'Compléments' ? '💊' : cat === 'Alimentation' ? '🍯' : '🍃';
                result += `${categoryEmoji} ${cat}:\n`;
                products.forEach(p => {
                    result += `• ${p.name}: ${p.price.toFixed(2)} DA (Stock: ${p.stock})\n`;
                });
                result += '\n';
            });
            
            return result;
        };

        if (!product_name || product_name.toLowerCase().includes('all') || 
            product_name.toLowerCase().includes('available') || 
            product_name.includes('products')) {
            return formatAvailableProducts(filteredProducts);
        }

        // Product search logic
        let product = null;
        const searchTerm = product_name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const searchKeywords = searchTerm.split(' ');
        
        // Try exact match first
        const exactKey = searchTerm.replace(/\s+/g, '-');
        if (filteredProducts[exactKey]) {
            product = filteredProducts[exactKey];
        }
        
        // Fuzzy matching if no exact match
        if (!product) {
            let bestMatch = null;
            let bestScore = 0;
            
            Object.entries(filteredProducts).forEach(([key, prod]) => {
                const productName = prod.name.toLowerCase();
                const productKeywords = productName.split(/[\s-]+/);
                
                let score = 0;
                
                searchKeywords.forEach(keyword => {
                    if (keyword.length >= 3) {
                        productKeywords.forEach(prodKeyword => {
                            if (prodKeyword.includes(keyword) || keyword.includes(prodKeyword)) {
                                score += keyword.length;
                            }
                        });
                        
                        // Special product term matching
                        if (keyword === 'omega' && productName.includes('oméga')) score += 10;
                        if (keyword === 'protéine' && productName.includes('protéines')) score += 10;
                        if (keyword === 'protein' && productName.includes('protéines')) score += 10;
                        // Add more special cases as needed
                    }
                });
                
                if (productName.includes(searchTerm)) {
                    score += searchTerm.length * 2;
                }
                
                if (score > bestScore && score >= 3) {
                    bestScore = score;
                    bestMatch = { key, product: prod };
                }
            });
            
            if (bestMatch) {
                product = bestMatch.product;
            }
        }
        
        if (!product) {
            return `❌ Product "${product_name}" not found.\n\n${formatAvailableProducts(filteredProducts)}`;
        }
        
        if (product.stock > 0) {
            return `✅ ${product.name} is in stock!\n💰 Price: ${product.price.toFixed(2)} DA\n📦 Stock: ${product.stock} units\n🌿 Category: ${product.category}`;
        } else {
            return `❌ ${product.name} is currently out of stock.\n\n${formatAvailableProducts(filteredProducts)}`;
        }
    },

    save_client_data: async ({ name, phone, wilaya }, env) => {
        if (!name || !phone || !wilaya || wilaya === 'Non spécifiée') {
            const missing = [];
            if (!name) missing.push('nom complet');
            if (!phone) missing.push('numéro de téléphone');
            if (!wilaya || wilaya === 'Non spécifiée') missing.push('wilaya');
            
            return `❌ Informations manquantes: ${missing.join(', ')}`;
        }
        
        const customerId = `XCUST_${Date.now()}`;
        const customer = {
            id: customerId,
            name,
            phone,
            wilaya,
            createdAt: new Date().toISOString()
        };
        
        try {
            await env.CACHE.put(`customer_${customerId}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            await env.CACHE.put(`customer_phone_${phone}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            await addCustomerToSheet(customer, env);
            
            return `✅ Welcome to X Company Bio Products!\n- Customer ID: ${customerId}\n- Name: ${name}\n- Phone: ${phone}\n- Wilaya: ${wilaya}`;
        } catch (error) {
            return `❌ Error saving customer data`;
        }
    },

    place_order: async ({ product_name, quantity, customer_phone, customer_name, wilaya }, env) => {
        const missing = [];
        if (!product_name) missing.push('product name');
        if (!quantity) missing.push('quantity');
        if (!customer_phone) missing.push('phone');
        if (!customer_name) missing.push('name');
        if (!wilaya || wilaya === 'Non spécifiée') missing.push('wilaya');
        
        if (missing.length > 0) {
            return `❌ Missing required fields: ${missing.join(', ')}`;
        }
        
        // Find product with better matching for honey/miel
        const products = bioProductsData;
        let product = null;
        
        // Special handling for honey/miel orders
        const lowerProductName = product_name.toLowerCase();
        if (lowerProductName.includes('miel') || lowerProductName.includes('honey')) {
            product = products['miel-biologique']; // Direct match to our honey product
        } else {
            // Try exact key match first
            const searchTerm = product_name.toLowerCase().replace(/\s+/g, '-');
            product = products[searchTerm];
            
            if (!product) {
                // Try fuzzy matching
                const productEntries = Object.entries(products);
                for (const [key, prod] of productEntries) {
                    if (prod.name.toLowerCase().includes(product_name.toLowerCase()) ||
                        product_name.toLowerCase().includes(key.replace(/-/g, ' '))) {
                        product = prod;
                        break;
                    }
                }
            }
        }
        
        if (!product) {
            return `❌ Product "${product_name}" not found. Available products:\n${Object.values(products).map(p => `• ${p.name}: ${p.price.toFixed(2)} DA`).join('\n')}`;
        }
        
        // Default quantity to 1 if not specified or invalid
        const orderQuantity = parseInt(quantity) || 1;
        
        if (product.stock < orderQuantity) {
            return `❌ Insufficient stock for ${product.name}. Available: ${product.stock}`;
        }
        
        const orderId = `XORD_${Date.now()}`;
        const totalAmount = product.price * orderQuantity;
        
        const order = {
            id: orderId,
            productId: product.id,
            productName: product.name,
            quantity: orderQuantity,
            unitPrice: product.price,
            totalAmount,
            customerPhone: customer_phone,
            customerName: customer_name,
            wilaya,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        
        try {
            // Save to KV storage
            await env.CACHE.put(`order_${orderId}`, JSON.stringify(order), { expirationTtl: 86400 * 90 });
            
            // Save customer data too
            const customerId = `XCUST_${Date.now()}`;
            const customer = {
                id: customerId,
                name: customer_name,
                phone: customer_phone,
                wilaya,
                createdAt: new Date().toISOString()
            };
            await env.CACHE.put(`customer_${customerId}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            
            // Add to Google Sheets
            await addOrderToSheet(order, env);
            await addCustomerToSheet(customer, env);
            
            return `🎉 **Commande Confirmée !**

📋 **Détails de la commande:**
• ID Commande: ${orderId}
• Produit: ${product.name}
• Quantité: ${orderQuantity}
• Prix unitaire: ${product.price.toFixed(2)} DA
• **Total: ${totalAmount.toFixed(2)} DA**

👤 **Informations client:**
• Nom: ${customer_name}
• Téléphone: ${customer_phone}
• Wilaya: ${wilaya}

✅ Votre commande a été enregistrée avec succès !
📞 Nous vous contacterons bientôt pour confirmer la livraison.

Merci de votre confiance en X Company Produits Bio ! 🌿`;
            
        } catch (error) {
            console.error('❌ Order processing error:', error);
            return `❌ Erreur lors du traitement de la commande. Veuillez réessayer ou nous contacter directement.`;
        }
    },

    generate_sales_report: async ({ period = 'week', user_type = 'admin' }, env) => {
        const reportTime = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers'
        });
        
        let report = `📊 X Company Bio Products Sales Report - ${reportTime}\n\n`;
        report += `🌿 PRODUCTS AVAILABLE:\n`;
        Object.values(bioProductsData).forEach(product => {
            const emoji = product.category === 'Compléments' ? '💊' : product.category === 'Alimentation' ? '🍯' : '🍃';
            report += `${emoji} ${product.name}: ${product.price.toFixed(2)} DA (Stock: ${product.stock})\n`;
        });
        
        report += `\n💰 SYSTEM STATUS:\n`;
        report += `- Platform: Cloudflare Workers\n`;
        report += `- Status: Operational\n`;
        report += `- Cache: KV Storage Active\n`;
        
        return report;
    }
};

// OpenAI Assistant Management
class CloudflareSalesAssistant {
    constructor(env) {
        this.env = env;
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY
        });
        this.assistantId = ASSISTANT_ID;
    }

    async createThread() {
        const thread = await this.openai.beta.threads.create();
        return thread.id;
    }

    async sendMessage(threadId, message) {
        try {
            // Step 1: Clean up any existing active runs first
            await this.cleanupActiveRuns(threadId);
            
            // Step 2: Add message to thread
            await this.openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: message
            });

            // Step 3: Create run with optimized instructions
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId,
                instructions: `You are a sales assistant for X Company Bio Products in Algeria. 

IMPORTANT ORDER PROCESSING RULES:
1. When a customer mentions wanting to order a product, immediately collect ALL required info in ONE message:
   - Customer name
   - Phone number  
   - Wilaya (province)
   - Product name
   - Quantity (default to 1 if not specified)

2. DO NOT ask for confirmation multiple times. Once you have the required info, IMMEDIATELY call place_order function.

3. For honey orders: if customer says "miel" or "honey", use "miel" as the product_name.

4. NEVER ask "are you sure" or "confirm" - just process the order directly.

5. Keep responses concise and in French.

6. Available functions:
   - check_product_availability: Check products and prices
   - place_order: Process orders (requires: product_name, quantity, customer_phone, customer_name, wilaya)
   - save_client_data: Save customer info

Example flow:
Customer: "je veux commander du miel, moussa khairoune 0778053400 alger"
You: Call place_order immediately with: {product_name: "miel", quantity: 1, customer_name: "moussa khairoune", customer_phone: "0778053400", wilaya: "alger"}

Be efficient and direct. Process orders immediately when you have the required information.`
            });

            // Step 4: Wait for completion with optimized timing
            return await this.waitForRunCompletion(threadId, run.id);
            
        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            
            // Return intelligent fallback based on message content
            return this.getFallbackResponse(message);
        }
    }

    async cleanupActiveRuns(threadId) {
        try {
            const runs = await this.openai.beta.threads.runs.list(threadId);
            const activeRuns = runs.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            // Cancel active runs in parallel
            if (activeRuns.length > 0) {
                console.log(`🧹 Cancelling ${activeRuns.length} active run(s)`);
                await Promise.all(
                    activeRuns.map(run => 
                        this.openai.beta.threads.runs.cancel(threadId, run.id).catch(() => {})
                    )
                );
                
                // Brief wait for cancellations to take effect
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.warn('⚠️ Cleanup error (non-critical):', error.message);
        }
    }

    async waitForRunCompletion(threadId, runId) {
        let attempts = 0;
        const maxAttempts = 15; // Reduced from 30 to 15 (15 seconds max)
        const pollInterval = 1000; // 1 second intervals
        
        console.log(`⏳ Waiting for run ${runId} (max ${maxAttempts}s)`);

        while (attempts < maxAttempts) {
            try {
                const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                console.log(`- Run status: ${run.status} (${attempts + 1}/${maxAttempts})`);
                
                if (run.status === 'completed') {
                    const messages = await this.openai.beta.threads.messages.list(threadId);
                    const latestMessage = messages.data[0];
                    
                    if (latestMessage && latestMessage.role === 'assistant') {
                        console.log('✅ Run completed successfully');
                        return latestMessage.content[0].text.value;
                    }
                    
                } else if (run.status === 'requires_action') {
                    console.log('🔧 Handling function calls...');
                    return await this.handleRequiresAction(threadId, runId, run);
                    
                } else if (run.status === 'failed') {
                    console.error('❌ Run failed:', run.last_error);
                    throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
                    
                } else if (run.status === 'cancelled') {
                    throw new Error('Run was cancelled');
                    
                } else if (run.status === 'expired') {
                    throw new Error('Run expired');
                }

                attempts++;
                
                // Only wait if we're not at max attempts
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
                
            } catch (error) {
                if (error.message.includes('Run failed') || error.message.includes('cancelled') || error.message.includes('expired')) {
                    throw error;
                }
                
                console.warn(`⚠️ Polling error (attempt ${attempts + 1}):`, error.message);
                attempts++;
                
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
            }
        }

        // Timeout reached - cancel the run and return fallback
        console.warn('⏰ Run timed out, cancelling...');
        try {
            await this.openai.beta.threads.runs.cancel(threadId, runId);
        } catch (cancelError) {
            console.warn('⚠️ Failed to cancel run:', cancelError.message);
        }
        
        throw new Error('Run timed out');
    }

    async handleRequiresAction(threadId, runId, run) {
        try {
            const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];

            // Process function calls with timeout protection
            const functionPromises = toolCalls.map(async (toolCall) => {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                console.log(`🛠️ Calling function: ${functionName}`);
                
                if (functions[functionName]) {
                    try {
                        // Add timeout to function calls
                        const result = await Promise.race([
                            functions[functionName](functionArgs, this.env),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Function timeout')), 5000)
                            )
                        ]);
                        
                        return {
                            tool_call_id: toolCall.id,
                            output: result
                        };
                    } catch (error) {
                        console.warn(`⚠️ Function ${functionName} error:`, error.message);
                        return {
                            tool_call_id: toolCall.id,
                            output: `Error: ${error.message}`
                        };
                    }
                } else {
                    return {
                        tool_call_id: toolCall.id,
                        output: `Function ${functionName} not found`
                    };
                }
            });

            const results = await Promise.all(functionPromises);
            toolOutputs.push(...results);

            // Submit tool outputs
            await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
                tool_outputs: toolOutputs
            });

            // Wait for final completion with reduced timeout
            let finalAttempts = 0;
            const maxFinalAttempts = 10; // 10 seconds for function completion
            
            while (finalAttempts < maxFinalAttempts) {
                const finalRun = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                
                if (finalRun.status === 'completed') {
                    const messages = await this.openai.beta.threads.messages.list(threadId);
                    const latestMessage = messages.data[0];
                    
                    if (latestMessage && latestMessage.role === 'assistant') {
                        return latestMessage.content[0].text.value;
                    }
                } else if (finalRun.status === 'failed') {
                    throw new Error(`Function run failed: ${finalRun.last_error?.message}`);
                }
                
                finalAttempts++;
                if (finalAttempts < maxFinalAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            throw new Error('Function run timed out');
            
        } catch (error) {
            console.error('❌ Function handling error:', error);
            throw error;
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Intelligent fallback responses based on message content
        if (lowerMessage.includes('produits') || lowerMessage.includes('products')) {
            return `🌿 **X Company Produits Bio - Catalogue Rapide**

Nos produits biologiques disponibles :

💊 **Compléments Alimentaires:**
• Poudre de Protéines Bio (Vanille) - 45.99 DA
• Complexe Multivitamines Bio - 32.99 DA  
• Huile de Poisson Oméga-3 Bio - 28.99 DA
• Comprimés de Spiruline Bio - 35.99 DA

🍯 **Alimentation Bio:**
• Miel Pur Biologique (500g) - 24.99 DA
• Huile de Noix de Coco Bio (500ml) - 22.99 DA
• Graines de Chia Bio (250g) - 16.99 DA

🍃 **Boissons:**
• Thé Vert Biologique (50 sachets) - 18.99 DA

Pour commander ou plus d'infos, contactez-nous !`;
        }
        
        if (lowerMessage.includes('prix') || lowerMessage.includes('price')) {
            return `💰 **Nos Prix Compétitifs:**

Les prix varient de 16.99 DA à 45.99 DA selon le produit.
Tous nos produits sont certifiés biologiques et de haute qualité.

Pour un devis personnalisé ou des promotions en cours, n'hésitez pas à nous contacter !`;
        }
        
        if (lowerMessage.includes('commander') || lowerMessage.includes('order')) {
            return `🛒 **Comment Commander:**

1. Choisissez vos produits dans notre catalogue
2. Contactez-nous avec le nom du produit et la quantité
3. Nous confirmons votre commande et les détails de livraison
4. Paiement à la livraison disponible

📞 Contactez-nous pour passer votre commande !`;
        }
        
        if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
            return `🌿 Bonjour et bienvenue chez X Company Produits Bio !

Je suis votre assistant virtuel. Je peux vous aider avec :
• Découvrir nos produits biologiques
• Obtenir des informations sur les prix
• Vous guider pour passer commande
• Répondre à vos questions

Que puis-je faire pour vous aujourd'hui ?`;
        }
        
        // Default fallback
        return `🌿 Merci pour votre message ! 

Je rencontre actuellement des difficultés techniques, mais je reste à votre service.

**Nos services :**
• Produits biologiques certifiés
• Compléments alimentaires naturels  
• Livraison rapide
• Support client dédié

Pour une assistance immédiate, n'hésitez pas à nous recontacter ou à reformuler votre question.`;
    }
}

// Main Cloudflare Worker handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // API Routes
            if (path === '/api/initialize') {
                return new Response(JSON.stringify({ 
                    success: true, 
                    assistantId: ASSISTANT_ID,
                    platform: 'Cloudflare Workers Backend'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/initialize') {
                return new Response(JSON.stringify({ 
                    success: true,
                    data: {
                        message: 'Chat system initialized successfully',
                        assistantId: ASSISTANT_ID,
                        platform: 'Cloudflare Workers Backend',
                        features: ['OpenAI Assistant', 'Product Catalog', 'Google Sheets Integration']
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/start') {
                const assistant = new CloudflareSalesAssistant(env);
                const threadId = await assistant.createThread();
                return new Response(JSON.stringify({ 
                    success: true,
                    data: { threadId }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/message') {
                const { threadId, message, userType } = await request.json();
                
                if (!threadId || !message) {
                    return new Response(JSON.stringify({ 
                        success: false,
                        error: 'Missing required fields: threadId and message are required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const assistant = new CloudflareSalesAssistant(env);
                
                try {
                    const response = await assistant.sendMessage(threadId, message);
                    
                    return new Response(JSON.stringify({ 
                        success: true,
                        data: { 
                            response,
                            aiResponse: response, // Fallback for different frontend expectations
                            threadId 
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                    
                } catch (error) {
                    console.error('❌ Message processing error:', error);
                    
                    // Return intelligent error response
                    const fallbackResponse = assistant.getFallbackResponse(message);
                    
                    return new Response(JSON.stringify({ 
                        success: true, // Still return success with fallback
                        data: { 
                            response: fallbackResponse,
                            aiResponse: fallbackResponse,
                            threadId,
                            fallback: true
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }

            if (path === '/api/test-env') {
                return new Response(JSON.stringify({
                    environment: {
                        hasOpenAI: !!env.OPENAI_API_KEY,
                        hasSheetId: !!env.GOOGLE_SHEET_ID,
                        hasServiceAccount: !!env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                        hasPrivateKey: !!env.GOOGLE_PRIVATE_KEY
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Default API info
            return new Response(JSON.stringify({
                message: 'X Company Bio Products API Backend',
                platform: 'Cloudflare Workers',
                endpoints: [
                    '/api/initialize',
                    '/api/chat/start', 
                    '/api/chat/message',
                    '/api/test-env'
                ]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ 
                error: error.message,
                platform: 'Cloudflare Workers Backend'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};